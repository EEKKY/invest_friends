import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agentica, assertHttpController } from '@agentica/core';
import OpenAI from 'openai';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class AgenticaService {
  private readonly logger = new Logger(AgenticaService.name);
  private agent: Agentica<'chatgpt'> | null = null;
  private initialized = false;

  constructor(
    private configService: ConfigService,
    private chatService: ChatService,
  ) {
    // 서버가 완전히 시작된 후 초기화
  }

  /**
   * Agentica 에이전트 초기화
   */
  private async initializeAgent(): Promise<void> {
    try {
      const openAiKey = this.configService.get<string>('OPENAI_API_KEY');

      if (!openAiKey) {
        this.logger.warn(
          'OpenAI API key not found. Agentica service will not be available.',
        );
        return;
      }

      const openai = new OpenAI({ apiKey: openAiKey });

      // 현재 서버의 Swagger 문서 가져오기
      const host = this.configService.get<string>(
        'APP_HOST',
        'http://localhost:3000',
      );
      const swaggerDoc = await fetch(`${host}/api/v1-json`).then((r) =>
        r.json(),
      );

      this.agent = new Agentica({
        model: 'chatgpt' as const,
        vendor: {
          api: openai,
          model: 'gpt-4o-mini',
        },
        controllers: [
          assertHttpController({
            name: 'InvestFriendsBackend',
            model: 'chatgpt' as const,
            document: swaggerDoc,
            connection: {
              host,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          }),
        ],
      });

      this.initialized = true;
      this.logger.log('Agentica agent initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Agentica agent', error);
    }
  }

  /**
   * 자연어 메시지를 처리하여 적절한 API를 호출
   * @param message 사용자의 자연어 요청
   * @param userId 요청한 사용자 ID (인증용)
   * @returns 처리된 응답
   */
  async processMessage(message: string, userId?: string): Promise<any> {
    // 섹터 분석 요청 먼저 감지
    const sectorAnalysisRequest = this.detectSectorAnalysisRequest(message);

    // 섹터 분석 요청인 경우 ChatService로 직접 처리
    if (sectorAnalysisRequest) {
      try {
        const analysisResult = await this.chatService.generateSectorAnalysis(
          sectorAnalysisRequest.sector,
        );

        // 섹터 관련 주식 정보 추출
        const stockInfo = this.extractStockInfo(message, null);

        return {
          success: true,
          data: {
            type: 'sectorAnalysis',
            sector: sectorAnalysisRequest.sector,
          },
          message: analysisResult.message,
          stockInfo: stockInfo,
          sectorAnalysis: analysisResult,
        };
      } catch (error) {
        this.logger.error('Error generating sector analysis', error);
      }
    }

    // 주식 분석 요청 감지 (개별 종목)
    const stockInfo = this.extractStockInfo(message, null);
    if (stockInfo && stockInfo.code) {
      try {
        // 직접 investment-analysis API 호출
        const host = this.configService.get<string>(
          'APP_HOST',
          'http://localhost:3000',
        );
        
        const analysisResponse = await fetch(
          `${host}/investment-analysis?stockCode=${stockInfo.code}`,
        );
        
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          
          // AI를 통해 투자 분석 인사이트 생성
          const analysisInsight = await this.generateInvestmentAnalysisInsight(
            analysisData,
            stockInfo,
            message,
          );
          
          return {
            success: true,
            data: analysisData,
            message: analysisInsight,
            stockInfo: stockInfo,
            structuredData: {
              type: 'investmentAnalysis',
              ...analysisData,
            },
          };
        }
      } catch (error) {
        this.logger.error('Error fetching investment analysis', error);
      }
    }

    // 섹터 분석도 아니고 개별 종목 분석도 아닌 경우에만 Agentica 사용
    if (!this.initialized || !this.agent) {
      // Agentica가 초기화되지 않은 경우 직접 처리
      await this.initializeAgent();
    }

    try {
      // JWT 토큰이 필요한 경우 헤더에 추가
      if (userId) {
        // TODO: Generate JWT token for the user
        // const token = await this.authService.generateToken(userId);
        // Update agent connection headers with token
      }

      // Agentica를 통해 자연어를 API 호출로 변환
      // 한국어 응답을 명시적으로 요청
      const koreanPrompt = `${message}\n\n(모든 응답은 한국어로 작성해주세요. 투자 분석 정보는 간결하고 명확하게 전달해주세요.)`;
      const response = await this.agent.conversate(koreanPrompt);

      console.log(response);

      // Extract stock information if present in the message
      const stockInfoFromResponse = this.extractStockInfo(message, response);

      // Parse structured data from response
      const structuredData = this.parseInvestmentAnalysisFromResponse(response);

      const text = response
        .map((c) => {
          if ((c.type == 'assistantMessage' || c.type == 'describe') && c.text)
            return c.text;
        })
        .filter((text) => text != null);

      return {
        success: true,
        data: structuredData || response,
        message: text,
        stockInfo: stockInfoFromResponse,
        structuredData: structuredData,
      };
    } catch (error) {
      this.logger.error('Error processing message with Agentica', error);

      return {
        success: false,
        message: '처리 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  /**
   * Get structured data response from AI
   * This method is optimized for getting JSON responses without API calls
   * @param prompt The prompt asking for specific data
   * @returns Structured response from AI
   */
  async getStructuredData(prompt: string): Promise<any> {
    try {
      // If Agentica is not initialized, try OpenAI directly
      const openAiKey = this.configService.get<string>('OPENAI_API_KEY');

      if (!openAiKey) {
        this.logger.warn('OpenAI API key not found. Returning mock data.');
        return null;
      }

      const openai = new OpenAI({ apiKey: openAiKey });

      // Create a system message to ensure JSON response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that provides accurate information about Korean stocks and companies. Always respond in valid JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent responses
      });

      const responseContent = completion.choices[0]?.message?.content;

      if (responseContent) {
        try {
          return JSON.parse(responseContent);
        } catch (parseError) {
          this.logger.warn('Failed to parse OpenAI response as JSON');
          return { raw: responseContent };
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error getting structured data from OpenAI', error);
      return null;
    }
  }

  /**
   * Agentica 상태 확인
   * @returns 초기화 상태
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Extract stock information from message and response
   * @param message User's message
   * @param response AI response
   * @returns Stock information if found
   */
  private extractStockInfo(message: string, response: any): any {
    try {
      // Common Korean stock names and their codes
      const stockMappings: { [key: string]: { code: string; name: string } } = {
        삼성전자: { code: '005930', name: '삼성전자' },
        SK하이닉스: { code: '000660', name: 'SK하이닉스' },
        LG에너지솔루션: { code: '373220', name: 'LG에너지솔루션' },
        LG화학: { code: '051910', name: 'LG화학' },
        현대차: { code: '005380', name: '현대차' },
        현대자동차: { code: '005380', name: '현대자동차' },
        기아: { code: '000270', name: '기아' },
        NAVER: { code: '035420', name: 'NAVER' },
        네이버: { code: '035420', name: 'NAVER' },
        카카오: { code: '035720', name: '카카오' },
        카카오뱅크: { code: '323410', name: '카카오뱅크' },
        삼성바이오로직스: { code: '207940', name: '삼성바이오로직스' },
        셀트리온: { code: '068270', name: '셀트리온' },
        POSCO홀딩스: { code: '005490', name: 'POSCO홀딩스' },
        포스코: { code: '005490', name: 'POSCO홀딩스' },
        KB금융: { code: '105560', name: 'KB금융' },
        신한지주: { code: '055550', name: '신한지주' },
        하나금융지주: { code: '086790', name: '하나금융지주' },
        삼성SDI: { code: '006400', name: '삼성SDI' },
        LG전자: { code: '066570', name: 'LG전자' },
      };

      // Check for stock code pattern (6 digits)
      const stockCodePattern = /\b\d{6}\b/g;
      const stockCodes = message.match(stockCodePattern);

      if (stockCodes && stockCodes.length > 0) {
        return {
          code: stockCodes[0],
          name: null,
          detectedFrom: 'code',
        };
      }

      // Check for stock names
      for (const [key, value] of Object.entries(stockMappings)) {
        if (message.toLowerCase().includes(key.toLowerCase())) {
          return {
            code: value.code,
            name: value.name,
            detectedFrom: 'name',
          };
        }
      }

      // Check if response contains stock information
      if (response && typeof response === 'string') {
        // Try to extract from response text
        const responseCodes = response.match(stockCodePattern);
        if (responseCodes && responseCodes.length > 0) {
          return {
            code: responseCodes[0],
            name: null,
            detectedFrom: 'response',
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error extracting stock info', error);
      return null;
    }
  }

  /**
   * Detect if the message is requesting sector analysis
   * @param message User's message
   * @returns Sector analysis request info or null
   */
  private detectSectorAnalysisRequest(message: string): {
    sector: string;
  } | null {
    try {
      const lowerMessage = message.toLowerCase();

      // 섹터 관련 키워드 매핑
      const sectorMappings: { [key: string]: string } = {
        기술: '기술',
        it: '기술',
        테크: '기술',
        기술주: '기술',
        기술분야: '기술',
        반도체: '반도체',
        배터리: '배터리',
        '2차전지': '배터리',
        이차전지: '배터리',
        바이오: '바이오',
        제약: '제약',
        헬스케어: '헬스케어',
        의료: '헬스케어',
        자동차: '자동차',
        금융: '금융',
        은행: '은행',
        보험: '보험',
        증권: '증권',
        건설: '건설',
        화학: '화학',
        철강: '철강',
        조선: '조선',
        항공: '항공',
        방산: '방산',
        엔터: '엔터테인먼트',
        엔터테인먼트: '엔터테인먼트',
        게임: '게임',
        미디어: '미디어',
        유통: '유통',
        소비재: '소비재',
        식품: '식품',
        음료: '음료',
        에너지: '에너지',
        신재생: '신재생에너지',
        전기차: '전기차',
        ai: 'AI',
        인공지능: 'AI',
      };

      // 주식/종목 추천 관련 패턴
      const stockRecommendPatterns = [
        '주식',
        '종목',
        '회사',
        '기업',
        '투자',
        '매수',
      ];

      // 추천/분석 요청 패턴
      const analysisPatterns = [
        '추천',
        '알려',
        '찾아',
        '분석',
        '전망',
        '어때',
        '어떻',
        '어떤',
        '뭐가',
        '뭐',
        '좋',
        '괜찮',
        '상황',
        '동향',
      ];

      // 섹터 키워드가 있는지 먼저 확인
      let detectedSector = null;
      for (const [keyword, sector] of Object.entries(sectorMappings)) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          detectedSector = sector;
          break;
        }
      }

      // 섹터가 없으면 '분야', '섹터', '업종' 등과 함께 나오는 단어 찾기
      if (!detectedSector) {
        const sectorPattern = /(\S+)\s*(분야|섹터|업종|업계|주)/;
        const match = message.match(sectorPattern);
        if (match && match[1]) {
          // 매핑에 있는지 확인
          const foundSector = sectorMappings[match[1].toLowerCase()];
          if (foundSector) {
            detectedSector = foundSector;
          } else {
            detectedSector = match[1];
          }
        }
      }

      // 섹터가 감지되지 않으면 null 반환
      if (!detectedSector) {
        return null;
      }

      // 주식/종목 추천 패턴이 있는지 확인
      const hasStockPattern = stockRecommendPatterns.some((pattern) =>
        lowerMessage.includes(pattern),
      );

      // 분석/추천 요청 패턴이 있는지 확인
      const hasAnalysisPattern = analysisPatterns.some((pattern) =>
        lowerMessage.includes(pattern),
      );

      // 섹터가 있고, (주식 패턴이 있거나 분석 패턴이 있으면) 섹터 분석으로 처리
      if (detectedSector && (hasStockPattern || hasAnalysisPattern)) {
        return { sector: detectedSector };
      }

      return null;
    } catch (error) {
      this.logger.error('Error detecting sector analysis request', error);
      return null;
    }
  }

  /**
   * Parse investment analysis data from Agentica response
   * @param response Agentica response
   * @returns Structured investment analysis data
   */
  private parseInvestmentAnalysisFromResponse(response: any): any {
    try {
      if (!response || !Array.isArray(response)) {
        return null;
      }

      // Find investment analysis response in the conversate array
      for (const item of response) {
        // Check for function call with investment analysis data
        if (item.type === 'function' && item.result) {
          const result = item.result;
          
          // Check if this is investment analysis data
          if (result.investmentMetrics || result.financialStatements || result.chartData) {
            return {
              type: 'investmentAnalysis',
              stockCode: result.stockCode || this.extractStockCodeFromResult(result),
              companyName: result.companyName || result.companyInfo?.name,
              currentPrice: result.currentPrice || result.stockPrice?.currentPrice,
              chartData: result.chartData || this.extractChartData(result),
              companyInfo: result.companyInfo || this.extractCompanyInfo(result),
              investmentMetrics: result.investmentMetrics || this.extractInvestmentMetrics(result),
              financialStatements: result.financialStatements || this.extractFinancialStatements(result),
              riskAnalysis: result.riskAnalysis || this.extractRiskAnalysis(result),
              peerComparison: result.peerComparison || [],
              analystReports: result.analystReports || [],
              news: result.news || [],
              sentiment: result.sentiment || { positive: 0, neutral: 0, negative: 0 },
              dividendInfo: result.dividendInfo || null,
            };
          }
        }
        
        // Check for assistant message with structured data
        if (item.type === 'assistantMessage' && item.text) {
          // Try to extract structured data from markdown tables
          const structuredData = this.parseMarkdownTables(item.text);
          if (structuredData) {
            return structuredData;
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error parsing investment analysis from response', error);
      return null;
    }
  }

  private extractStockCodeFromResult(result: any): string | null {
    if (result.stockCode) return result.stockCode;
    if (result.stock_code) return result.stock_code;
    if (result.code) return result.code;
    if (result.symbol) return result.symbol;
    return null;
  }

  private extractChartData(result: any): any {
    if (result.chartData) return result.chartData;
    if (result.dailyPrices) {
      return {
        daily: result.dailyPrices,
        weekly: result.weeklyPrices || [],
        monthly: result.monthlyPrices || [],
      };
    }
    return null;
  }

  private extractCompanyInfo(result: any): any {
    if (result.companyInfo) return result.companyInfo;
    return {
      name: result.companyName || result.name,
      industry: result.industry || result.sector,
      marketCap: result.marketCap || result.market_cap,
      description: result.description || result.companyDescription,
      founded: result.founded || result.establishedDate,
      employees: result.employees || result.employeeCount,
      website: result.website || result.homepage,
    };
  }

  private extractInvestmentMetrics(result: any): any {
    if (result.investmentMetrics) return result.investmentMetrics;
    return {
      per: result.per || result.PER || result.pe_ratio,
      pbr: result.pbr || result.PBR || result.pb_ratio,
      roe: result.roe || result.ROE || result.return_on_equity,
      eps: result.eps || result.EPS || result.earnings_per_share,
      bps: result.bps || result.BPS || result.book_value_per_share,
      dividendYield: result.dividendYield || result.dividend_yield,
      debtRatio: result.debtRatio || result.debt_ratio,
      currentRatio: result.currentRatio || result.current_ratio,
      operatingMargin: result.operatingMargin || result.operating_margin,
    };
  }

  private extractFinancialStatements(result: any): any {
    if (result.financialStatements) return result.financialStatements;
    return {
      incomeStatement: result.incomeStatement || result.income_statement || [],
      balanceSheet: result.balanceSheet || result.balance_sheet || [],
      cashFlow: result.cashFlow || result.cash_flow || [],
    };
  }

  private extractRiskAnalysis(result: any): any {
    if (result.riskAnalysis) return result.riskAnalysis;
    return {
      volatility: result.volatility || {},
      financialRisk: result.financialRisk || result.financial_risk || {},
      marketRisk: result.marketRisk || result.market_risk || {},
      operationalRisk: result.operationalRisk || result.operational_risk || {},
      overallRisk: result.overallRisk || result.overall_risk || 'medium',
    };
  }

  /**
   * Generate investment analysis insight using AI
   * @param analysisData Investment analysis data
   * @param stockInfo Stock information
   * @param userMessage Original user message
   * @returns AI-generated investment insight
   */
  private async generateInvestmentAnalysisInsight(
    analysisData: any,
    stockInfo: any,
    userMessage: string,
  ): Promise<string> {
    try {
      const openAiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!openAiKey) {
        this.logger.warn('OpenAI API key not found, using fallback summary');
        return this.generateKoreanSummary(analysisData, stockInfo);
      }

      this.logger.log('Generating AI investment insight with OpenAI');
      const openai = new OpenAI({ apiKey: openAiKey });
      
      // 분석 데이터 요약
      const dataContext = {
        companyName: analysisData.companyInfo?.name || stockInfo.name,
        stockCode: analysisData.stockCode || stockInfo.code,
        currentPrice: analysisData.currentPrice,
        metrics: analysisData.investmentMetrics,
        financials: analysisData.financialStatements,
        risk: analysisData.riskAnalysis,
        dividendInfo: analysisData.dividendInfo,
        peerComparison: analysisData.peerComparison,
      };

      const prompt = `당신은 한국 주식 투자 전문 애널리스트입니다. 다음 데이터를 바탕으로 ${dataContext.companyName}(${dataContext.stockCode})에 대한 투자 분석을 제공해주세요.

사용자 질문: ${userMessage}

분석 데이터:
- 현재가: ${dataContext.currentPrice ? dataContext.currentPrice.toLocaleString() + '원' : '정보 없음'}
- PER: ${dataContext.metrics?.per || '정보 없음'}
- PBR: ${dataContext.metrics?.pbr || '정보 없음'}
- ROE: ${dataContext.metrics?.roe ? dataContext.metrics.roe + '%' : '정보 없음'}
- 배당수익률: ${dataContext.metrics?.dividendYield ? dataContext.metrics.dividendYield + '%' : '정보 없음'}
- 부채비율: ${dataContext.metrics?.debtRatio ? dataContext.metrics.debtRatio + '%' : '정보 없음'}
- 리스크 점수: ${dataContext.risk?.aiAnalysis?.score || '정보 없음'}/100

최근 재무 정보:
${dataContext.financials ? JSON.stringify(dataContext.financials.incomeStatement?.slice(0, 2)) : '정보 없음'}

리스크 분석:
${dataContext.risk?.aiAnalysis?.summary || '정보 없음'}

다음 형식으로 간결하고 실용적인 투자 분석을 제공해주세요:
1. 현재 투자 매력도 평가 (1-2문장)
2. 주요 강점 2-3개
3. 주요 위험 요인 2-3개
4. 투자 추천 의견 (1-2문장)

답변은 반드시 한국어로 작성하고, 전문적이면서도 이해하기 쉽게 설명해주세요.
마지막에 "📈 상세 분석 정보는 오른쪽 캔버스에서 확인하실 수 있습니다."를 추가해주세요.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 한국 주식 시장에 정통한 전문 투자 애널리스트입니다. 데이터 기반의 객관적이고 실용적인 투자 조언을 제공합니다.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        this.logger.log('AI investment insight generated successfully');
        return aiResponse;
      }
      
      this.logger.warn('No AI response received, using fallback summary');
      // Fallback to simple summary
      return this.generateKoreanSummary(analysisData, stockInfo);
    } catch (error) {
      this.logger.error('Error generating AI investment insight:', error.message);
      this.logger.error('Full error:', error);
      // Fallback to simple summary
      return this.generateKoreanSummary(analysisData, stockInfo);
    }
  }

  /**
   * Generate Korean summary message from investment analysis data
   * @param analysisData Investment analysis data
   * @param stockInfo Stock information
   * @returns Korean summary message
   */
  private generateKoreanSummary(analysisData: any, stockInfo: any): string {
    const companyName = analysisData.companyInfo?.name || stockInfo.name || '해당 종목';
    const stockCode = analysisData.stockCode || stockInfo.code;
    
    let summary = `${companyName}(${stockCode})에 대한 종합 투자 분석을 완료했습니다.\n\n`;
    
    // 주요 지표 추가
    if (analysisData.investmentMetrics) {
      const metrics = analysisData.investmentMetrics;
      summary += '📊 주요 투자 지표:\n';
      if (metrics.per) summary += `• PER: ${metrics.per}\n`;
      if (metrics.pbr) summary += `• PBR: ${metrics.pbr}\n`;
      if (metrics.roe) summary += `• ROE: ${metrics.roe}%\n`;
      if (metrics.dividendYield) summary += `• 배당수익률: ${metrics.dividendYield}%\n`;
    }
    
    // 현재가 정보
    if (analysisData.currentPrice) {
      summary += `\n💰 현재가: ${analysisData.currentPrice.toLocaleString()}원\n`;
    }
    
    // 리스크 분석 요약
    if (analysisData.riskAnalysis?.aiAnalysis?.score) {
      const riskScore = analysisData.riskAnalysis.aiAnalysis.score;
      let riskLevel = '낮음';
      if (riskScore > 60) riskLevel = '높음';
      else if (riskScore > 40) riskLevel = '보통';
      
      summary += `\n⚠️ 리스크 수준: ${riskLevel} (점수: ${riskScore}/100)\n`;
    }
    
    summary += '\n📈 상세 분석 정보는 오른쪽 캔버스에서 확인하실 수 있습니다.';
    
    return summary;
  }

  private parseMarkdownTables(text: string): any {
    try {
      // Extract stock code from text
      const stockCodeMatch = text.match(/주식\s*코드\s*\*\*(\d{6})\*\*/i) || 
                            text.match(/(\d{6})/);
      const stockCode = stockCodeMatch ? stockCodeMatch[1] : null;

      // Extract company name
      const companyNameMatch = text.match(/(.+?)\((\d{6})\)/) ||
                              text.match(/기업명\s*[:：]\s*(.+)/i);
      const companyName = companyNameMatch ? companyNameMatch[1].trim() : null;

      // Extract current price
      const priceMatch = text.match(/현재가\s*[:：]\s*([\d,]+)/) ||
                        text.match(/종가\s*[:：]\s*([\d,]+)/);
      const currentPrice = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;

      // Extract PER
      const perMatch = text.match(/PER[^\d]*(\d+\.?\d*)/);
      const per = perMatch ? parseFloat(perMatch[1]) : null;

      // Extract PBR
      const pbrMatch = text.match(/PBR[^\d]*(\d+\.?\d*)/);
      const pbr = pbrMatch ? parseFloat(pbrMatch[1]) : null;

      // Extract ROE
      const roeMatch = text.match(/ROE[^\d]*(\d+\.?\d*)/);
      const roe = roeMatch ? parseFloat(roeMatch[1]) : null;

      if (!stockCode && !companyName) {
        return null;
      }

      return {
        type: 'investmentAnalysis',
        stockCode,
        companyName,
        currentPrice,
        investmentMetrics: {
          per,
          pbr,
          roe,
        },
        rawText: text,
      };
    } catch (error) {
      this.logger.error('Error parsing markdown tables', error);
      return null;
    }
  }
}
