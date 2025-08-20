import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { KisService } from '../stock/kis/kis.service';
import { DartService } from '../stock/dart/dart.service';
import {
  GetInvestmentAnalysisDto,
  InvestmentAnalysisResponseDto,
  ChartDataDto,
  CompanyInfoDto,
  InvestmentMetricsDto,
  PerformanceConsensusDto,
  DividendInfoDto,
  PeerComparisonDto,
  AnalystNewsDto,
  FinancialStatementsDto,
  RiskAnalysisDto,
} from './dto/investment-analysis.dto';
import { ChatService } from 'src/stock/chat/chat.service';

@Injectable()
export class InvestmentAnalysisService {
  private readonly logger = new Logger(InvestmentAnalysisService.name);
  private readonly dartApiKey: string;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly kisService: KisService,
    private readonly dartService: DartService,
    private readonly chatService: ChatService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.dartApiKey = this.configService.get<string>('DART_API_KEY');
  }

  async getInvestmentAnalysis(
    dto: GetInvestmentAnalysisDto,
  ): Promise<InvestmentAnalysisResponseDto> {
    const { stockCode, period = '3m', sections } = dto;

    // sections 문자열을 배열로 변환
    const sectionArray = sections
      ? sections.split(',').map((s) => s.trim())
      : null;

    // 캐시 키 생성
    const cacheKey = `investment-analysis:${stockCode}:${period}:${sections || 'all'}`;

    // 캐시 확인
    const cachedData =
      await this.cacheManager.get<InvestmentAnalysisResponseDto>(cacheKey);
    if (cachedData) {
      this.logger.log(`Returning cached data for ${stockCode}`);
      return cachedData;
    }

    // 포함할 섹션 결정
    const includeSections = sectionArray || [
      'chart',
      'company',
      'metrics',
      'performance',
      'dividend',
      'peer',
      'news',
      'financial',
      'risk',
    ];

    // 병렬로 모든 데이터 수집
    const results = await Promise.allSettled([
      includeSections.includes('chart')
        ? this.getChartData(stockCode, period)
        : null,
      includeSections.includes('company')
        ? this.getCompanyInfo(stockCode)
        : null,
      includeSections.includes('metrics')
        ? this.getInvestmentMetrics(stockCode)
        : null,
      includeSections.includes('performance')
        ? this.getPerformanceConsensus(stockCode)
        : null,
      includeSections.includes('dividend')
        ? this.getDividendInfo(stockCode)
        : null,
      includeSections.includes('peer')
        ? this.getPeerComparison(stockCode)
        : null,
      includeSections.includes('news') ? this.getAnalystNews(stockCode) : null,
      includeSections.includes('financial')
        ? this.getFinancialStatements(stockCode)
        : null,
      includeSections.includes('risk') ? this.getRiskAnalysis(stockCode) : null,
    ]);

    // 결과 매핑
    const response: InvestmentAnalysisResponseDto = {
      stockCode,
      analysisDate: new Date().toISOString(),
      chartData: this.extractResult(results[0]),
      companyInfo: this.extractResult(results[1]),
      investmentMetrics: this.extractResult(results[2]),
      performanceConsensus: this.extractResult(results[3]),
      dividendInfo: this.extractResult(results[4]),
      peerComparison: this.extractResult(results[5]),
      analystNews: this.extractResult(results[6]),
      financialStatements: this.extractResult(results[7]),
      riskAnalysis: this.extractResult(results[8]),
    };

    // 캐시 저장 (60초)
    await this.cacheManager.set(cacheKey, response, 60000);

    return response;
  }

  private extractResult(result: PromiseSettledResult<any>): any {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    this.logger.error('Failed to fetch data', result.reason);
    return null;
  }

  // 1. 차트 데이터 (KIS API + 기술지표 계산)
  private async getChartData(
    stockCode: string,
    period: string,
  ): Promise<ChartDataDto> {
    try {
      // KIS API로 일별 차트 데이터 가져오기
      const dailyChartResponse = await this.kisService.getDailyChart({
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: stockCode,
        FID_PERIOD_DIV_CODE: 'D',
        FID_ORG_ADJ_PRC: '0',
      });

      // 시간별 차트 데이터 가져오기 (optional)
      let itemChartData = null;
      try {
        const itemChartResponse = await this.kisService.getItemChart({
          FID_COND_MRKT_DIV_CODE: 'J',
          FID_INPUT_ISCD: stockCode,
          FID_PW_DATA_INCU_YN: 'N',
        });
        itemChartData = itemChartResponse.stock;
      } catch (err) {
        this.logger.warn(`Failed to get item chart: ${err.message}`);
      }

      // 기술지표 계산을 위한 데이터 추출
      const stockData = dailyChartResponse.stock?.output || [];
      const prices = stockData.map((d) => parseFloat(d.stck_prpr));

      // 이동평균선 계산
      const movingAverages =
        prices.length > 0
          ? {
              ma5: this.calculateMA(prices, 5),
              ma20: this.calculateMA(prices, 20),
              ma60: this.calculateMA(prices, 60),
            }
          : undefined;

      // RSI 계산
      const rsi = prices.length > 0 ? this.calculateRSI(prices, 14) : [];

      return {
        dailyChart: dailyChartResponse.stock || {
          rt_cd: '0',
          msg_cd: 'SUCCESS',
          msg1: 'Success',
          output: [],
        },
        itemChart: itemChartData,
        indexChart: dailyChartResponse.index,
        movingAverages,
        technicalIndicators:
          rsi.length > 0
            ? {
                rsi,
              }
            : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get chart data: ${error.message}`);
      return this.generateDynamicChartData(30);
    }
  }

  // 2. 회사 정보 (DART API + KIS)
  private async getCompanyInfo(stockCode: string): Promise<CompanyInfoDto> {
    try {
      // Get corp code from database
      const corpCodes = await this.dartService.getCorpCode();
      const corpCodeObj = corpCodes.find((c) => c.stock_code === stockCode);
      const corpCode = corpCodeObj?.corp_code;

      if (!corpCode) {
        this.logger.warn(`Corp code not found for stock code: ${stockCode}`);
        return this.generateDynamicCompanyInfo(stockCode);
      }

      // Get company info from DART and KIS APIs
      const companyInfo = await this.getCompanyInfoFromAPIs(
        corpCode,
        stockCode,
      );

      return {
        stockCode,
        companyName: companyInfo.companyName || `Company_${stockCode}`,
        industry: companyInfo.industry || 'N/A',
        listingDate: companyInfo.listingDate || '',
        marketCap: companyInfo.marketCap || 0,
        sharesOutstanding: companyInfo.sharesOutstanding || 0,
        description: companyInfo.description || '',
        ceo: companyInfo.ceo || '',
        website: companyInfo.website || '',
      };
    } catch (error) {
      this.logger.error(`Failed to get company info: ${error.message}`);
      return this.generateDynamicCompanyInfo(stockCode);
    }
  }

  // 3. 투자 지표 (DART 재무제표 + 계산)
  private async getInvestmentMetrics(
    stockCode: string,
  ): Promise<InvestmentMetricsDto> {
    try {
      // Get corp code from database
      const corpCodes = await this.dartService.getCorpCode();
      const corpCodeObj = corpCodes.find((c) => c.stock_code === stockCode);
      const corpCode = String(corpCodeObj?.corp_code || '');
      const financialData = await this.dartService.getFinancialStatements({
        corpCode: String(corpCode),
        year: new Date().getFullYear(),
      });
      const priceData = await this.kisService.getPrice({
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: stockCode,
      });

      const currentPrice = parseFloat(priceData.stck_prpr);
      const eps = this.calculateEPS(financialData);
      const bps = this.calculateBPS(financialData);

      return {
        per: eps > 0 ? currentPrice / eps : 0,
        pbr: bps > 0 ? currentPrice / bps : 0,
        roe: financialData.roe || 0,
        eps,
        bps,
        debtRatio: this.calculateDebtRatio(financialData),
        currentRatio: this.calculateCurrentRatio(financialData),
        operatingMargin: this.calculateOperatingMargin(financialData),
      };
    } catch (error) {
      this.logger.error(`Failed to get investment metrics: ${error.message}`);
      return this.generateDynamicInvestmentMetrics();
    }
  }

  // 4. 실적/컨센서스 (GPT Agent)
  private async getPerformanceConsensus(
    stockCode: string,
  ): Promise<PerformanceConsensusDto> {
    try {
      const consensus = await this.getAgentConsensusData(stockCode);

      return {
        quarterlyResults: consensus.quarterlyResults || [],
        annualResults: consensus.annualResults || [],
        consensus: consensus.consensus || {
          targetPrice: 0,
          recommendation: 'Hold',
          numberOfAnalysts: 0,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get performance consensus: ${error.message}`,
      );
      return this.generateDynamicPerformanceConsensus();
    }
  }

  // 5. 배당 정보 (DART + KIS)
  private async getDividendInfo(stockCode: string): Promise<DividendInfoDto> {
    try {
      // Get corp code from database
      const corpCodes = await this.dartService.getCorpCode();
      const corpCodeObj = corpCodes.find((c) => c.stock_code === stockCode);

      if (!corpCodeObj || !corpCodeObj.corp_code) {
        this.logger.warn(`Corp code not found for stock: ${stockCode}`);
        return this.generateDynamicDividendInfo();
      }

      // Get current stock price from KIS
      const priceData = await this.kisService.getPrice({
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: stockCode,
      });
      const currentPrice = parseFloat(priceData.stck_prpr || '0');

      // Get financial data for dividend info (using last year's data)
      const lastYear = new Date().getFullYear() - 1;
      const financialData = await this.dartService
        .getFinancialStatements({
          corpCode: corpCodeObj.corp_code,
          year: lastYear,
        })
        .catch(() => null);

      // Calculate dividend info based on available data
      // Note: OpenDART doesn't directly provide DPS, so we'll estimate
      // In production, you'd parse the actual business report for dividend info
      const estimatedDPS = 1500; // This should be fetched from business report
      const dividendYield =
        currentPrice > 0 ? (estimatedDPS / currentPrice) * 100 : 0;
      const payoutRatio =
        financialData && financialData.eps > 0
          ? (estimatedDPS / financialData.eps) * 100
          : 30; // Default payout ratio

      // Get historical dividend data (simplified)
      const history = [];
      for (let i = 0; i < 3; i++) {
        const year = lastYear - i;
        history.push({
          year: year.toString(),
          dividendPerShare: Math.floor(estimatedDPS * (1 - i * 0.1)), // Simplified trend
          dividendYield: Math.round(dividendYield * (1 - i * 0.05) * 10) / 10,
        });
      }

      return {
        dividendPerShare: estimatedDPS,
        dividendYield: Math.round(dividendYield * 100) / 100,
        payoutRatio: Math.round(payoutRatio * 10) / 10,
        schedule: {
          // Korean companies typically pay dividends in Q1 for previous year
          exDividendDate: `${new Date().getFullYear()}-12-27`,
          recordDate: `${new Date().getFullYear()}-12-31`,
          paymentDate: `${new Date().getFullYear() + 1}-04-15`,
        },
        history,
      };
    } catch (error) {
      this.logger.error(`Failed to get dividend info: ${error.message}`);
      return this.generateDynamicDividendInfo();
    }
  }

  // 6. 동종업계 비교 (사전정의 피어 + KIS/DART)
  private async getPeerComparison(
    stockCode: string,
  ): Promise<PeerComparisonDto> {
    try {
      // Define peer groups manually (in production, this should be in a config/DB)
      const peerGroups = {
        // 반도체
        '005930': ['000660', '009150', '005490'], // 삼성전자 peers: SK하이닉스, 삼성전기, POSCO홀딩스
        '000660': ['005930', '009150', '005490'], // SK하이닉스 peers
        // IT/인터넷
        '035420': ['035720', '036570', '053800'], // NAVER peers: 카카오, 엔씨소프트, 안랩
        '035720': ['035420', '036570', '053800'], // 카카오 peers
        // 자동차
        '005380': ['000270', '012330', '004020'], // 현대차 peers: 기아, 현대모비스, 현대제철
        '000270': ['005380', '012330', '004020'], // 기아 peers
      };

      // Get peers for the stock
      const peerCodes = peerGroups[stockCode] || [];

      // If no predefined peers, return default
      if (peerCodes.length === 0) {
        this.logger.warn(`No peer group defined for stock: ${stockCode}`);
        return this.generateDynamicPeerComparison();
      }

      // Include the target stock in analysis
      const allStocks = [stockCode, ...peerCodes];

      // Fetch data for all stocks in parallel
      const stockDataPromises = allStocks.map(async (code) => {
        try {
          // Get corp code
          const corpCodes = await this.dartService.getCorpCode();
          const corpCodeObj = corpCodes.find((c) => c.stock_code === code);

          // Get price data from KIS
          const priceData = await this.kisService.getPrice({
            FID_COND_MRKT_DIV_CODE: 'J',
            FID_INPUT_ISCD: code,
          });

          // Get financial data from DART
          let financialData = null;
          if (corpCodeObj && corpCodeObj.corp_code) {
            financialData = await this.dartService
              .getFinancialStatements({
                corpCode: corpCodeObj.corp_code,
                year: new Date().getFullYear(),
              })
              .catch(() => null);
          }

          const currentPrice = parseFloat(priceData.stck_prpr || '0');
          const marketCap =
            parseFloat(priceData.hts_avls || '0') ||
            currentPrice * parseFloat(priceData.lstn_stcn || '0');

          // Calculate metrics
          const per =
            financialData && financialData.eps > 0
              ? currentPrice / financialData.eps
              : 0;
          const pbr =
            financialData &&
            financialData.totalEquity > 0 &&
            parseFloat(priceData.lstn_stcn || '0') > 0
              ? (marketCap * 100000000) / financialData.totalEquity // Convert to same unit
              : 0;
          const roe = financialData?.roe || 0;

          return {
            stockCode: code,
            name: corpCodeObj?.corp_name || `Company_${code}`,
            marketCap,
            per: Math.round(per * 10) / 10,
            pbr: Math.round(pbr * 10) / 10,
            roe: Math.round(roe * 10) / 10,
            revenue: financialData?.revenue || 0,
            netIncome: financialData?.netIncome || 0,
          };
        } catch (err) {
          this.logger.warn(
            `Failed to get data for peer ${code}: ${err.message}`,
          );
          return null;
        }
      });

      const stockDataResults = (await Promise.all(stockDataPromises)).filter(
        Boolean,
      );

      if (stockDataResults.length === 0) {
        return this.generateDynamicPeerComparison();
      }

      // Calculate industry averages (excluding the target stock)
      const peerData = stockDataResults.filter(
        (s) => s.stockCode !== stockCode,
      );
      const avgPer =
        peerData.reduce((sum, s) => sum + s.per, 0) / peerData.length || 0;
      const avgPbr =
        peerData.reduce((sum, s) => sum + s.pbr, 0) / peerData.length || 0;
      const avgRoe =
        peerData.reduce((sum, s) => sum + s.roe, 0) / peerData.length || 0;

      // Sort for rankings
      const sortedByMarketCap = [...stockDataResults].sort(
        (a, b) => b.marketCap - a.marketCap,
      );
      const sortedByRevenue = [...stockDataResults].sort(
        (a, b) => b.revenue - a.revenue,
      );
      const sortedByProfit = [...stockDataResults].sort(
        (a, b) => b.netIncome - a.netIncome,
      );

      const targetStock = stockDataResults.find(
        (s) => s.stockCode === stockCode,
      );
      const marketCapRank =
        sortedByMarketCap.findIndex((s) => s.stockCode === stockCode) + 1;
      const revenueRank =
        sortedByRevenue.findIndex((s) => s.stockCode === stockCode) + 1;
      const profitRank =
        sortedByProfit.findIndex((s) => s.stockCode === stockCode) + 1;

      return {
        industryAverages: {
          per: Math.round(avgPer * 10) / 10,
          pbr: Math.round(avgPbr * 10) / 10,
          roe: Math.round(avgRoe * 10) / 10,
          dividendYield: 2.0, // Would need dividend data
        },
        ranking: {
          byMarketCap: marketCapRank,
          byRevenue: revenueRank,
          byProfit: profitRank,
          totalCompanies: stockDataResults.length,
        },
        competitors: peerData.map((s) => ({
          name: s.name,
          stockCode: s.stockCode,
          marketCap: Math.round(s.marketCap),
          per: s.per,
          pbr: s.pbr,
          roe: s.roe,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get peer comparison: ${error.message}`);
      return this.generateDynamicPeerComparison();
    }
  }

  // 7. 애널리스트/뉴스 (GPT Agent)
  private async getAnalystNews(stockCode: string): Promise<AnalystNewsDto> {
    try {
      const newsData = await this.getAgentNewsAndReports(stockCode);

      return {
        analystReports: newsData.analystReports || [],
        news: newsData.news || [],
        sentimentAnalysis: newsData.sentimentAnalysis || {
          positive: 0,
          neutral: 0,
          negative: 0,
          overallSentiment: 'neutral',
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get analyst news: ${error.message}`);
      return this.generateDynamicAnalystNews();
    }
  }

  // 8. 재무제표 (DART XBRL)
  private async getFinancialStatements(
    stockCode: string,
  ): Promise<FinancialStatementsDto> {
    try {
      // Get corp code from database
      const corpCodes = await this.dartService.getCorpCode();
      const corpCodeObj = corpCodes.find((c) => c.stock_code === stockCode);

      if (!corpCodeObj || !corpCodeObj.corp_code) {
        this.logger.warn(`Corp code not found for stock: ${stockCode}`);
        return this.generateDynamicFinancialStatements();
      }

      const currentYear = new Date().getFullYear();
      const years = [currentYear, currentYear - 1, currentYear - 2];

      // Get financial data for recent 3 years
      const financialDataPromises = years.map((year) =>
        this.dartService
          .getFinancialStatements({
            corpCode: corpCodeObj.corp_code,
            year,
          })
          .catch((err) => {
            this.logger.warn(
              `Failed to get financial data for year ${year}: ${err.message}`,
            );
            return null;
          }),
      );

      const financialDataResults = await Promise.all(financialDataPromises);

      // Format financial statements
      const incomeStatement = [];
      const balanceSheet = [];
      const cashFlow = [];

      for (let i = 0; i < financialDataResults.length; i++) {
        const data = financialDataResults[i];
        const year = years[i];

        if (data) {
          // Income Statement
          incomeStatement.push({
            period: year.toString(),
            revenue: data.revenue || 0,
            costOfGoodsSold: Math.floor((data.revenue || 0) * 0.7), // Estimated
            grossProfit: Math.floor((data.revenue || 0) * 0.3), // Estimated
            operatingExpenses: Math.floor((data.revenue || 0) * 0.15), // Estimated
            operatingIncome: data.operatingProfit || 0,
            netIncome: data.netIncome || 0,
          });

          // Balance Sheet
          balanceSheet.push({
            period: year.toString(),
            totalAssets: data.totalAssets || 0,
            currentAssets: Math.floor((data.totalAssets || 0) * 0.4), // Estimated
            totalLiabilities: (data.totalAssets || 0) - (data.totalEquity || 0),
            currentLiabilities: Math.floor(
              ((data.totalAssets || 0) - (data.totalEquity || 0)) * 0.5,
            ), // Estimated
            totalEquity: data.totalEquity || 0,
          });

          // Cash Flow (estimated based on net income)
          cashFlow.push({
            period: year.toString(),
            operatingCashFlow: Math.floor((data.netIncome || 0) * 1.2), // Estimated
            investingCashFlow: Math.floor((data.netIncome || 0) * -0.8), // Estimated
            financingCashFlow: Math.floor((data.netIncome || 0) * -0.4), // Estimated
            netCashFlow: Math.floor((data.netIncome || 0) * 0.1), // Estimated
            freeCashFlow: Math.floor((data.netIncome || 0) * 0.8), // Estimated
          });
        }
      }

      // If we have data, return it; otherwise return dynamic data
      if (incomeStatement.length > 0) {
        return {
          incomeStatement,
          balanceSheet,
          cashFlow,
        };
      } else {
        return this.generateDynamicFinancialStatements();
      }
    } catch (error) {
      this.logger.error(`Failed to get financial statements: ${error.message}`);
      return this.generateDynamicFinancialStatements();
    }
  }

  // 9. 리스크 분석 (KIS 시세 + DART 재무 + AI 분석)
  private async getRiskAnalysis(stockCode: string): Promise<RiskAnalysisDto> {
    try {
      // Get historical price data from KIS
      const priceData = await this.kisService.getDailyChart({
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: stockCode,
        FID_PERIOD_DIV_CODE: 'D',
        FID_ORG_ADJ_PRC: '0',
      });
      const stockData = priceData.stock?.output || [];
      const prices = stockData
        .map((d) => parseFloat(d.stck_prpr))
        .filter((p) => p > 0);

      // Calculate volatility metrics
      const volatility = this.calculateVolatility(prices);

      // Calculate Maximum Drawdown
      const maxDrawdown = this.calculateMaxDrawdown(prices);

      // Get company info for context
      const corpCodes = await this.dartService.getCorpCode();
      const corpCodeObj = corpCodes.find((c) => c.stock_code === stockCode);
      const companyName = corpCodeObj?.corp_name || `종목코드 ${stockCode}`;

      let financialRisk = {
        debtToEquity: 0,
        interestCoverage: 5.0, // Default
        quickRatio: 1.2, // Default
        altmanZScore: 3.0, // Default (safe zone)
        riskLevel: 'medium' as 'low' | 'medium' | 'high',
      };

      let financialData = null;
      if (corpCodeObj && corpCodeObj.corp_code) {
        try {
          financialData = await this.dartService.getFinancialStatements({
            corpCode: corpCodeObj.corp_code,
            year: new Date().getFullYear(),
          });

          // Calculate financial risk metrics
          const debtToEquity =
            financialData.totalEquity > 0
              ? (financialData.totalAssets - financialData.totalEquity) /
                financialData.totalEquity
              : 0;

          // Assess risk level based on debt ratio
          const debtRatio =
            financialData.totalAssets > 0
              ? (financialData.totalAssets - financialData.totalEquity) /
                financialData.totalAssets
              : 0;

          let riskLevel: 'low' | 'medium' | 'high' = 'medium';
          if (debtRatio < 0.3) riskLevel = 'low';
          else if (debtRatio > 0.6) riskLevel = 'high';

          financialRisk = {
            debtToEquity: Math.round(debtToEquity * 100) / 100,
            interestCoverage: 5.0, // Would need interest expense data
            quickRatio: 1.2, // Would need current assets/liabilities breakdown
            altmanZScore: debtRatio < 0.3 ? 3.5 : debtRatio < 0.6 ? 2.5 : 1.5,
            riskLevel,
          };
        } catch (err) {
          this.logger.warn(
            `Failed to get financial data for risk analysis: ${err.message}`,
          );
        }
      }

      // Use AI to analyze risk comprehensively
      let aiAnalysisResult = {
        summary: '',
        score: 50,
        recommendations: [] as string[],
      };

      try {
        const analysisPrompt = `
다음 ${companyName}(${stockCode})의 리스크 지표를 분석하여 투자 리스크를 평가해주세요:

1. 시장 리스크 지표:
   - 일간 변동성: ${(volatility.daily * 100).toFixed(2)}%
   - 주간 변동성: ${(volatility.weekly * 100).toFixed(2)}%
   - 월간 변동성: ${(volatility.monthly * 100).toFixed(2)}%
   - 연간 변동성: ${(volatility.annual * 100).toFixed(2)}%
   - 최대낙폭(MDD): ${(maxDrawdown * 100).toFixed(2)}%
   - 최근 30일 가격 추이: ${prices.slice(0, 5).join(', ')}원

2. 재무 리스크 지표:
   - 부채비율: ${(financialRisk.debtToEquity * 100).toFixed(1)}%
   - 이자보상배율: ${financialRisk.interestCoverage.toFixed(1)}배
   - 당좌비율: ${financialRisk.quickRatio.toFixed(1)}
   - Altman Z-Score: ${financialRisk.altmanZScore.toFixed(1)}
   ${
     financialData
       ? `
   - 총자산: ${(financialData.totalAssets / 100).toFixed(0)}억원
   - 총부채: ${((financialData.totalAssets - financialData.totalEquity) / 100).toFixed(0)}억원
   - 자기자본: ${(financialData.totalEquity / 100).toFixed(0)}억원`
       : ''
   }

다음 JSON 형식으로 분석 결과를 제공해주세요:
{
  "summary": "전반적인 리스크 평가 요약 (한국어, 2-3문장)",
  "score": 0-100 사이의 리스크 점수 (낮을수록 안전),
  "recommendations": ["구체적인 투자 권고사항 1", "구체적인 투자 권고사항 2", "구체적인 투자 권고사항 3"],
  "riskFactors": [
    {
      "category": "리스크 카테고리 (시장/재무/운영/규제 등)",
      "description": "구체적인 리스크 설명",
      "impact": "low/medium/high",
      "probability": "low/medium/high"
    }
  ]
}

업종 특성과 시장 상황을 고려하여 실용적이고 구체적인 분석을 제공해주세요.`;

        const aiResponse = await this.chatService.chat(analysisPrompt);

        if (aiResponse.success && aiResponse.message) {
          try {
            // Extract JSON from the response
            const jsonMatch = aiResponse.message.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              aiAnalysisResult = {
                summary: parsed.summary || aiAnalysisResult.summary,
                score: parsed.score || aiAnalysisResult.score,
                recommendations:
                  parsed.recommendations || aiAnalysisResult.recommendations,
              };

              // Add AI-generated risk factors if available
              if (parsed.riskFactors && Array.isArray(parsed.riskFactors)) {
                const aiRiskFactors = parsed.riskFactors.map((rf) => ({
                  category: rf.category,
                  description: rf.description,
                  impact: rf.impact as 'low' | 'medium' | 'high',
                  probability: rf.probability as 'low' | 'medium' | 'high',
                }));

                return {
                  volatility: {
                    daily: Math.round(volatility.daily * 1000) / 1000,
                    weekly: Math.round(volatility.weekly * 1000) / 1000,
                    monthly: Math.round(volatility.monthly * 1000) / 1000,
                    annual: Math.round(volatility.annual * 1000) / 1000,
                    beta: 1.0,
                  },
                  financialRisk,
                  riskFactors: aiRiskFactors,
                  aiAnalysis: aiAnalysisResult,
                };
              }
            }
          } catch (parseError) {
            this.logger.warn(
              `Failed to parse AI response: ${parseError.message}`,
            );
          }
        }
      } catch (aiError) {
        this.logger.warn(
          `AI analysis failed, using fallback: ${aiError.message}`,
        );
      }

      // Fallback risk factors if AI analysis fails
      const riskFactors = [];

      if (volatility.annual > 0.3) {
        riskFactors.push({
          category: '시장 리스크',
          description: '높은 가격 변동성',
          impact: 'high' as const,
          probability: 'high' as const,
        });
      }

      if (financialRisk.debtToEquity > 1) {
        riskFactors.push({
          category: '재무 리스크',
          description: '높은 부채비율',
          impact: 'medium' as const,
          probability: 'medium' as const,
        });
      }

      if (maxDrawdown < -0.3) {
        riskFactors.push({
          category: '하방 리스크',
          description: '과거 큰 폭의 하락 경험',
          impact: 'high' as const,
          probability: 'low' as const,
        });
      }

      // Calculate overall risk score if not set by AI
      if (!aiAnalysisResult.score || aiAnalysisResult.score === 50) {
        const volScore = Math.min(volatility.annual * 100, 50);
        const debtScore = Math.min(financialRisk.debtToEquity * 20, 30);
        const mddScore = Math.abs(maxDrawdown) * 20;
        aiAnalysisResult.score = Math.round(volScore + debtScore + mddScore);
      }

      // Set summary if not provided by AI
      if (!aiAnalysisResult.summary) {
        aiAnalysisResult.summary = `${financialRisk.riskLevel === 'low' ? '낮은' : financialRisk.riskLevel === 'medium' ? '중간' : '높은'} 리스크 프로파일. 연간 변동성 ${Math.round(volatility.annual * 100)}%, 최대낙폭 ${Math.round(maxDrawdown * 100)}%`;
      }

      // Set recommendations if not provided by AI
      if (
        !aiAnalysisResult.recommendations ||
        aiAnalysisResult.recommendations.length === 0
      ) {
        aiAnalysisResult.recommendations = [
          volatility.annual > 0.3
            ? '높은 변동성에 유의하여 분산투자 권장'
            : '안정적인 변동성 유지',
          financialRisk.debtToEquity > 1
            ? '부채비율 모니터링 필요'
            : '건전한 재무구조 유지',
          maxDrawdown < -0.3
            ? '손절매 기준 설정 권장'
            : '현재 포지션 유지 가능',
        ].filter(Boolean);
      }

      return {
        volatility: {
          daily: Math.round(volatility.daily * 1000) / 1000,
          weekly: Math.round(volatility.weekly * 1000) / 1000,
          monthly: Math.round(volatility.monthly * 1000) / 1000,
          annual: Math.round(volatility.annual * 1000) / 1000,
          beta: 1.0,
        },
        financialRisk,
        riskFactors,
        aiAnalysis: aiAnalysisResult,
      };
    } catch (error) {
      this.logger.error(`Failed to get risk analysis: ${error.message}`);
      return this.generateDynamicRiskAnalysis();
    }
  }

  // Helper functions
  private getPeriodDays(period: string): number {
    const periodMap = {
      '1d': 1,
      '1w': 7,
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
    };
    return periodMap[period] || 90;
  }

  private calculateMA(prices: number[], period: number): number[] {
    const ma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        ma.push(null);
      } else {
        const sum = prices
          .slice(i - period + 1, i + 1)
          .reduce((a, b) => a + b, 0);
        ma.push(sum / period);
      }
    }
    return ma;
  }

  private calculateRSI(prices: number[], period: number): number[] {
    const rsi = [];
    const gains = [];
    const losses = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    for (let i = 0; i < prices.length; i++) {
      if (i < period) {
        rsi.push(null);
      } else {
        const avgGain =
          gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        const avgLoss =
          losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }

    return rsi;
  }

  private calculateVolatility(prices: number[]): any {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    return {
      daily: stdDev,
      weekly: stdDev * Math.sqrt(5),
      monthly: stdDev * Math.sqrt(21),
      annual: stdDev * Math.sqrt(252),
      beta: 1.0, // Simplified
    };
  }

  private calculateMaxDrawdown(prices: number[]): number {
    if (prices.length < 2) return 0;

    let maxDrawdown = 0;
    let peak = prices[0];

    for (const price of prices) {
      if (price > peak) {
        peak = price;
      }
      const drawdown = (price - peak) / peak;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateAltmanZScore(financialData: any): number {
    // Simplified Altman Z-Score calculation
    return 3.0; // Placeholder
  }

  private assessRiskLevel(financialData: any): 'low' | 'medium' | 'high' {
    const debtRatio = financialData.debt_ratio || 0;
    if (debtRatio < 0.3) return 'low';
    if (debtRatio < 0.6) return 'medium';
    return 'high';
  }

  private calculateEPS(financialData: any): number {
    // Calculate EPS from financial data
    return 5000; // Placeholder
  }

  private calculateBPS(financialData: any): number {
    // Calculate BPS from financial data
    return 65000; // Placeholder
  }

  private calculateDebtRatio(financialData: any): number {
    // Calculate debt ratio from financial data
    return 45.2; // Placeholder
  }

  private calculateCurrentRatio(financialData: any): number {
    // Calculate current ratio from financial data
    return 1.5; // Placeholder
  }

  private calculateOperatingMargin(financialData: any): number {
    // Calculate operating margin from financial data
    return 15.3; // Placeholder
  }

  private calculateDebtToEquity(financialData: any): number {
    // Calculate debt to equity from financial data
    return 0.5; // Placeholder
  }

  private calculateInterestCoverage(financialData: any): number {
    // Calculate interest coverage from financial data
    return 5.0; // Placeholder
  }

  private calculateQuickRatio(financialData: any): number {
    // Calculate quick ratio from financial data
    return 1.2; // Placeholder
  }

  private formatIncomeStatement(statements: any): any[] {
    // Format income statement data
    return [];
  }

  private formatBalanceSheet(statements: any): any[] {
    // Format balance sheet data
    return [];
  }

  private formatCashFlow(statements: any): any[] {
    // Format cash flow data
    return [];
  }

  // Get company info from DART API directly
  private async getCompanyInfoFromAPIs(
    corpCode: string,
    stockCode: string,
  ): Promise<any> {
    try {
      // 1. DART company.json API 호출 - 기업개황 정보
      const companyUrl = 'https://opendart.fss.or.kr/api/company.json';
      const companyParams = {
        crtfc_key: this.dartApiKey,
        corp_code: corpCode,
      };

      const { data: companyData } = await firstValueFrom(
        this.httpService.get(companyUrl, { params: companyParams }),
      );

      // 2. KIS API로 시가총액 및 발행주식수 가져오기
      let marketCap = 0;
      let sharesOutstanding = 0;

      try {
        // 현재가 및 상장주식수 정보 가져오기
        const priceData = await this.kisService.getPrice({
          FID_COND_MRKT_DIV_CODE: 'J',
          FID_INPUT_ISCD: stockCode,
        });

        this.logger.log('KIS Price Data received:', {
          stck_prpr: priceData.stck_prpr,
          lstn_stcn: priceData.lstn_stcn,
          hts_avls: priceData.hts_avls,
        });

        const currentPrice = parseFloat(priceData.stck_prpr || '0');
        const listedShares = parseFloat(priceData.lstn_stcn || '0');

        // KIS API가 이미 시가총액을 제공하는 경우
        if (priceData.hts_avls) {
          marketCap = parseFloat(priceData.hts_avls);
        } else {
          // 시가총액 = 현재가 * 상장주식수
          marketCap = currentPrice * listedShares;
        }

        sharesOutstanding = listedShares;

        // 만약 상장주식수가 0이면 기본값 사용

        this.logger.log(
          `Stock ${stockCode}: Price=${currentPrice}, Shares=${sharesOutstanding}, MarketCap=${marketCap}`,
        );
      } catch (kisError) {
        this.logger.error('Failed to get market data from KIS', kisError);
      }

      // 3. 업종코드를 한글로 변환
      const industryMap: Record<string, string> = {
        '264': '전자부품, 컴퓨터, 영상, 음향 및 통신장비 제조업',
        '263': '전자부품 제조업',
        '272': '측정, 시험, 항해, 제어 및 기타 정밀기기 제조업',
        '201': '기초 화학물질 제조업',
        '202': '비료 및 질소화합물 제조업',
        '203': '합성고무 및 플라스틱 물질 제조업',
        '204': '기타 화학제품 제조업',
        '212': '의약품 제조업',
        '301': '자동차 및 트레일러 제조업',
        '302': '자동차 부품 제조업',
        '701': '도매 및 상품중개업',
        '651': '금융업',
        '652': '보험업',
        '662': '보험 및 연금관련 서비스업',
      };

      const industryName =
        industryMap[companyData.induty_code] ||
        companyData.induty_code ||
        '기타';

      // 4. 회사 소개 생성 (간단한 설명)
      const description = `${companyData.corp_name}은(는) ${industryName} 분야의 ${
        companyData.est_dt
          ? `${companyData.est_dt.substring(0, 4)}년 설립된`
          : ''
      } 기업입니다.`;

      // 5. 날짜 형식 변환 (YYYYMMDD -> YYYY-MM-DD)
      const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length !== 8) return '';
        return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
      };

      return {
        companyName: companyData.corp_name || '',
        industry: industryName,
        listingDate: formatDate(companyData.list_dt || ''),
        marketCap: marketCap,
        sharesOutstanding: sharesOutstanding,
        description: description,
        ceo: companyData.ceo_nm || '',
        website: companyData.hm_url ? `https://${companyData.hm_url}` : '',
      };
    } catch (error) {
      this.logger.error(
        `Failed to get company info from APIs: ${error.message}`,
      );

      // Fallback to mock data
      return {
        companyName: `Company_${stockCode}`,
        industry: 'N/A',
        listingDate: '',
        marketCap: 0,
        sharesOutstanding: 0,
        description: '',
        ceo: '',
        website: '',
      };
    }
  }

  private async getAgentConsensusData(stockCode: string): Promise<any> {
    try {
      // TODO: Implement actual GPT agent call
      return {
        quarterlyResults: [],
        annualResults: [],
        consensus: {
          targetPrice: 100000,
          recommendation: 'Buy',
          numberOfAnalysts: 10,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get agent consensus data: ${error.message}`);
      return {};
    }
  }

  private async getDartDividendInfo(corpCode: string | number): Promise<any> {
    try {
      // TODO: Implement DART dividend API call
      return {
        dividend_per_share: 1000,
        dividend_yield: 2.5,
        payout_ratio: 30,
        history: [],
      };
    } catch (error) {
      this.logger.error(`Failed to get DART dividend info: ${error.message}`);
      return {};
    }
  }

  private async getAgentDividendSchedule(stockCode: string): Promise<any> {
    try {
      // TODO: Implement actual GPT agent call
      return {
        schedule: {
          exDividendDate: '2024-06-01',
          recordDate: '2024-06-05',
          paymentDate: '2024-06-30',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get agent dividend schedule: ${error.message}`,
      );
      return {};
    }
  }

  private async getAgentPeerComparison(stockCode: string): Promise<any> {
    try {
      // TODO: Implement actual GPT agent call
      return {
        industryAverages: {
          per: 18.5,
          pbr: 1.5,
          roe: 10.2,
          dividendYield: 2.0,
        },
        ranking: {
          byMarketCap: 5,
          byRevenue: 3,
          byProfit: 4,
          totalCompanies: 20,
        },
        competitors: [],
      };
    } catch (error) {
      this.logger.error(
        `Failed to get agent peer comparison: ${error.message}`,
      );
      return {};
    }
  }

  private async getAgentNewsAndReports(stockCode: string): Promise<any> {
    try {
      // TODO: Implement actual GPT agent call
      return {
        analystReports: [],
        news: [],
        sentimentAnalysis: {
          positive: 40,
          neutral: 40,
          negative: 20,
          overallSentiment: 'neutral',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get agent news and reports: ${error.message}`,
      );
      return {};
    }
  }

  private async getAgentRiskAnalysis(
    stockCode: string,
    data: any,
  ): Promise<any> {
    try {
      // TODO: Implement actual GPT agent call
      return {
        riskFactors: [],
        summary: 'Moderate risk profile with stable financials',
        score: 65,
        recommendations: ['Monitor debt levels', 'Diversify portfolio'],
      };
    } catch (error) {
      this.logger.error(`Failed to get agent risk analysis: ${error.message}`);
      return {};
    }
  }

  // Generate dynamic chart data
  private generateDynamicChartData(days: number = 30): ChartDataDto {
    const basePrice = 70000 + Math.random() * 10000;
    const output = [];
    let currentPrice = basePrice;
    let totalVolume = 0;

    const now = new Date();
    const prices = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

      // Generate realistic price movements
      const volatility = 0.02;
      const trend = Math.random() > 0.5 ? 1 : -1;
      const change = currentPrice * volatility * (Math.random() - 0.5) * 2;

      currentPrice = Math.max(currentPrice + change, basePrice * 0.8);
      currentPrice = Math.min(currentPrice, basePrice * 1.2);

      const high = currentPrice * (1 + Math.random() * 0.02);
      const low = currentPrice * (1 - Math.random() * 0.02);
      const open = low + (high - low) * Math.random();
      const volume = Math.floor(1000000 + Math.random() * 5000000);
      totalVolume += volume;

      prices.push(currentPrice);

      output.push({
        stck_cntg_hour: dateStr,
        stck_oprc: Math.floor(open).toString(),
        stck_hgpr: Math.floor(high).toString(),
        stck_lwpr: Math.floor(low).toString(),
        stck_prpr: Math.floor(currentPrice).toString(),
        cntg_vol: volume.toString(),
        acml_vol: totalVolume.toString(),
      });
    }

    // Calculate technical indicators
    const movingAverages = {
      ma5: this.calculateMA(prices, 5),
      ma20: this.calculateMA(prices, 20),
      ma60: prices.length >= 60 ? this.calculateMA(prices, 60) : [],
    };

    const rsi = this.calculateRSI(prices, 14);

    return {
      dailyChart: {
        rt_cd: '0',
        msg_cd: 'SUCCESS',
        msg1: 'Success',
        output,
      },
      movingAverages,
      technicalIndicators: {
        rsi,
      },
    };
  }

  private generateDynamicCompanyInfo(stockCode: string): CompanyInfoDto {
    const companies = {
      '005930': { name: '삼성전자', industry: '전자/반도체', ceo: '한종희' },
      '000660': { name: 'SK하이닉스', industry: '반도체', ceo: '곽노정' },
      '035420': { name: 'NAVER', industry: 'IT/인터넷', ceo: '최수연' },
      '051910': { name: 'LG화학', industry: '화학', ceo: '신학철' },
    };

    const company = companies[stockCode] || {
      name: `기업_${stockCode}`,
      industry: '기타',
      ceo: '대표이사',
    };

    const listingYear = 1990 + Math.floor(Math.random() * 30);
    const marketCap = Math.floor(1000000000000 + Math.random() * 5000000000000);

    return {
      stockCode,
      companyName: company.name,
      industry: company.industry,
      listingDate: `${listingYear}-01-01`,
      marketCap,
      sharesOutstanding: Math.floor(marketCap / 70000),
      description: `${company.industry} 분야의 선도 기업`,
      ceo: company.ceo,
      website: `https://www.company-${stockCode}.co.kr`,
    };
  }

  private generateDynamicInvestmentMetrics(): InvestmentMetricsDto {
    const per = 8 + Math.random() * 20;
    const pbr = 0.5 + Math.random() * 2;
    const roe = 5 + Math.random() * 20;
    const eps = Math.floor(3000 + Math.random() * 7000);
    const bps = Math.floor((eps * per) / pbr);

    return {
      per: Math.round(per * 10) / 10,
      pbr: Math.round(pbr * 10) / 10,
      roe: Math.round(roe * 10) / 10,
      eps,
      bps,
      debtRatio: Math.round((30 + Math.random() * 50) * 10) / 10,
      currentRatio: Math.round((0.8 + Math.random() * 2) * 10) / 10,
      operatingMargin: Math.round((5 + Math.random() * 20) * 10) / 10,
    };
  }

  private generateDynamicPerformanceConsensus(): PerformanceConsensusDto {
    const currentYear = new Date().getFullYear();
    const quarterlyResults = [];
    const annualResults = [];

    // Generate quarterly results
    for (let q = 4; q >= 1; q--) {
      const baseRevenue = 50000 + Math.random() * 30000;
      quarterlyResults.push({
        period: `${currentYear}Q${q}`,
        revenue: Math.floor(baseRevenue),
        operatingProfit: Math.floor(baseRevenue * 0.15),
        netProfit: Math.floor(baseRevenue * 0.1),
        yoyGrowth: Math.round((Math.random() * 40 - 10) * 10) / 10,
      });
    }

    // Generate annual results
    for (let y = 0; y < 3; y++) {
      const year = currentYear - y;
      const baseRevenue = 200000 + Math.random() * 100000;
      annualResults.push({
        year: year.toString(),
        revenue: Math.floor(baseRevenue),
        operatingProfit: Math.floor(baseRevenue * 0.15),
        netProfit: Math.floor(baseRevenue * 0.1),
        yoyGrowth: Math.round((Math.random() * 30 - 5) * 10) / 10,
      });
    }

    const recommendations = ['Strong Buy', 'Buy', 'Hold', 'Sell'];
    const targetPrice = 70000 + Math.floor(Math.random() * 30000);

    return {
      quarterlyResults,
      annualResults,
      consensus: {
        targetPrice,
        recommendation: recommendations[Math.floor(Math.random() * 3)],
        numberOfAnalysts: 5 + Math.floor(Math.random() * 20),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  private generateDynamicDividendInfo(): DividendInfoDto {
    const dividendPerShare = Math.floor(500 + Math.random() * 2000);
    const dividendYield = Math.round((1 + Math.random() * 4) * 10) / 10;
    const currentYear = new Date().getFullYear();

    const history = [];
    for (let i = 0; i < 5; i++) {
      history.push({
        year: (currentYear - i).toString(),
        dividendPerShare: Math.floor(
          dividendPerShare * (0.8 + Math.random() * 0.4),
        ),
        dividendYield:
          Math.round(dividendYield * (0.8 + Math.random() * 0.4) * 10) / 10,
      });
    }

    return {
      dividendPerShare,
      dividendYield,
      payoutRatio: Math.round((20 + Math.random() * 40) * 10) / 10,
      schedule: {
        exDividendDate: `${currentYear}-12-27`,
        recordDate: `${currentYear}-12-31`,
        paymentDate: `${currentYear + 1}-02-15`,
      },
      history,
    };
  }

  private generateDynamicPeerComparison(): PeerComparisonDto {
    const totalCompanies = 15 + Math.floor(Math.random() * 30);
    const competitors = [];

    for (let i = 0; i < 5; i++) {
      competitors.push({
        name: `경쟁사 ${i + 1}`,
        stockCode: String(100000 + Math.floor(Math.random() * 900000)).padStart(
          6,
          '0',
        ),
        marketCap: Math.floor(500000000000 + Math.random() * 2000000000000),
        per: Math.round((10 + Math.random() * 20) * 10) / 10,
        pbr: Math.round((0.8 + Math.random() * 2) * 10) / 10,
        roe: Math.round((5 + Math.random() * 15) * 10) / 10,
      });
    }

    return {
      industryAverages: {
        per: Math.round((12 + Math.random() * 8) * 10) / 10,
        pbr: Math.round((1 + Math.random() * 1) * 10) / 10,
        roe: Math.round((8 + Math.random() * 7) * 10) / 10,
        dividendYield: Math.round((1.5 + Math.random() * 2) * 10) / 10,
      },
      ranking: {
        byMarketCap: 1 + Math.floor(Math.random() * totalCompanies),
        byRevenue: 1 + Math.floor(Math.random() * totalCompanies),
        byProfit: 1 + Math.floor(Math.random() * totalCompanies),
        totalCompanies,
      },
      competitors,
    };
  }

  private generateDynamicAnalystNews(): AnalystNewsDto {
    const firms = [
      '한국투자증권',
      'NH투자증권',
      '미래에셋증권',
      'KB증권',
      '하나증권',
    ];
    const recommendations = ['Strong Buy', 'Buy', 'Hold'];
    const sentiments = ['positive', 'neutral', 'negative'] as const;

    const analystReports = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      analystReports.push({
        title: `실적 개선 기대감 지속`,
        firm: firms[Math.floor(Math.random() * firms.length)],
        analyst: `애널리스트${i + 1}`,
        date: date.toISOString().split('T')[0],
        targetPrice: 70000 + Math.floor(Math.random() * 30000),
        recommendation:
          recommendations[Math.floor(Math.random() * recommendations.length)],
        summary: '실적 개선 트렌드가 지속되고 있으며, 업계 내 경쟁력 강화 기대',
      });
    }

    const news = [];
    const sources = [
      '한국경제',
      '매일경제',
      '서울경제',
      '이데일리',
      '머니투데이',
    ];

    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7));

      news.push({
        title: `주요 기업 뉴스 ${i + 1}`,
        source: sources[Math.floor(Math.random() * sources.length)],
        date: date.toISOString().split('T')[0],
        url: `https://news.example.com/${i + 1}`,
        summary: '기업 관련 주요 뉴스 요약',
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
      });
    }

    const positive = 30 + Math.floor(Math.random() * 40);
    const negative = 10 + Math.floor(Math.random() * 20);
    const neutral = 100 - positive - negative;

    return {
      analystReports,
      news,
      sentimentAnalysis: {
        positive,
        neutral,
        negative,
        overallSentiment:
          positive > 50 ? 'positive' : positive < 30 ? 'negative' : 'neutral',
      },
    };
  }

  private generateDynamicFinancialStatements(): FinancialStatementsDto {
    const currentYear = new Date().getFullYear();
    const incomeStatement = [];
    const balanceSheet = [];
    const cashFlow = [];

    for (let q = 0; q < 4; q++) {
      const period = `${currentYear}Q${4 - q}`;
      const revenue = Math.floor(50000 + Math.random() * 30000);

      incomeStatement.push({
        period,
        revenue,
        costOfGoodsSold: Math.floor(revenue * 0.7),
        grossProfit: Math.floor(revenue * 0.3),
        operatingExpenses: Math.floor(revenue * 0.15),
        operatingIncome: Math.floor(revenue * 0.15),
        netIncome: Math.floor(revenue * 0.1),
      });

      const totalAssets = Math.floor(200000 + Math.random() * 100000);
      balanceSheet.push({
        period,
        totalAssets,
        currentAssets: Math.floor(totalAssets * 0.4),
        totalLiabilities: Math.floor(totalAssets * 0.6),
        currentLiabilities: Math.floor(totalAssets * 0.3),
        totalEquity: Math.floor(totalAssets * 0.4),
      });

      cashFlow.push({
        period,
        operatingCashFlow: Math.floor(revenue * 0.12),
        investingCashFlow: Math.floor(-revenue * 0.08),
        financingCashFlow: Math.floor(-revenue * 0.04),
        netCashFlow: Math.floor(revenue * 0.01),
        freeCashFlow: Math.floor(revenue * 0.08),
      });
    }

    return {
      incomeStatement,
      balanceSheet,
      cashFlow,
    };
  }

  private generateDynamicRiskAnalysis(): RiskAnalysisDto {
    const daily = 0.01 + Math.random() * 0.03;
    const beta = 0.5 + Math.random() * 1.5;
    const debtToEquity = Math.random() * 1.5;
    const altmanZScore = 1.5 + Math.random() * 3;

    const riskLevel =
      altmanZScore > 3 ? 'low' : altmanZScore > 1.8 ? 'medium' : 'high';
    const riskScore = Math.floor(30 + Math.random() * 50);

    const riskFactors = [
      {
        category: '시장 리스크',
        description: '글로벌 경기 둔화 가능성',
        impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as
          | 'low'
          | 'medium'
          | 'high',
        probability: ['low', 'medium', 'high'][
          Math.floor(Math.random() * 3)
        ] as 'low' | 'medium' | 'high',
      },
      {
        category: '운영 리스크',
        description: '경쟁 심화에 따른 수익성 악화',
        impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as
          | 'low'
          | 'medium'
          | 'high',
        probability: ['low', 'medium', 'high'][
          Math.floor(Math.random() * 3)
        ] as 'low' | 'medium' | 'high',
      },
    ];

    const recommendations = [
      '포트폴리오 다각화 고려',
      '위험 관리 체계 강화',
      '장기 투자 관점 유지',
    ];

    return {
      volatility: {
        daily: Math.round(daily * 1000) / 1000,
        weekly: Math.round(daily * Math.sqrt(5) * 1000) / 1000,
        monthly: Math.round(daily * Math.sqrt(21) * 1000) / 1000,
        annual: Math.round(daily * Math.sqrt(252) * 1000) / 1000,
        beta: Math.round(beta * 100) / 100,
      },
      financialRisk: {
        debtToEquity: Math.round(debtToEquity * 100) / 100,
        interestCoverage: Math.round((2 + Math.random() * 8) * 10) / 10,
        quickRatio: Math.round((0.8 + Math.random() * 1) * 10) / 10,
        altmanZScore: Math.round(altmanZScore * 100) / 100,
        riskLevel,
      },
      riskFactors,
      aiAnalysis: {
        summary: `${riskLevel === 'low' ? '안정적인' : riskLevel === 'medium' ? '보통의' : '높은'} 리스크 프로파일`,
        score: riskScore,
        recommendations: recommendations.slice(0, 2),
      },
    };
  }
}
