import { Injectable, Logger } from '@nestjs/common';
import { KisService } from '../kis/kis.service';
import { DartService } from '../dart/dart.service';
import { AgenticaService } from '../agentica/agentica.service';
import {
  SectorRecommendation,
  SectorStock,
} from './interfaces/sector.interface';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  
  constructor(
    private readonly kisService: KisService,
    private readonly dartService: DartService,
    private readonly agenticaService: AgenticaService,
  ) {}

  /**
   * 섹터별 종목 추천
   */
  async getRecommendationsBySector(
    sector: string,
  ): Promise<SectorRecommendation> {
    // 하드코딩된 샘플 데이터 사용
    const sectorStocks: SectorStock[] = this.getSampleStocksBySector(sector);
    
    this.logger.log(
      `${sector} 섹터에서 ${sectorStocks.length}개 종목을 조회했습니다.`,
    );

    if (sectorStocks.length === 0) {
      const availableSectors = await this.getAvailableSectors();
      throw new Error(
        `섹터 '${sector}'에 해당하는 종목을 찾을 수 없습니다. 사용 가능한 섹터: ${availableSectors.join(', ')}`,
      );
    }

    // 각 종목의 현재가 조회
    const stocksWithData = await Promise.all(
      sectorStocks.slice(0, 3).map(async (stock) => {
        try {
          const priceData = await this.kisService.getPrice({
            FID_COND_MRKT_DIV_CODE: 'J',
            FID_INPUT_ISCD: stock.code,
          });

          return {
            ...stock,
            currentPrice: parseInt(priceData.stck_prpr),
            changeRate: parseFloat(priceData.prdy_ctrt),
          };
        } catch (error) {
          console.error(`종목 데이터 조회 실패 (${stock.code}):`, error);
          // 실패시 기본값 사용
          return {
            ...stock,
            currentPrice: 100000,
            changeRate: 0,
          };
        }
      }),
    );

    // 추천 결과 생성
    const recommendations = stocksWithData.map((stock, index) => {
      const riskLevel: 'low' | 'medium' | 'high' = 
        index === 0 ? 'low' : index === 1 ? 'medium' : 'high';
      
      const expectedReturn = riskLevel === 'low' ? 10 : riskLevel === 'medium' ? 15 : 20;
      const targetPrice = Math.round(stock.currentPrice * (1 + expectedReturn / 100));

      return {
        code: stock.code,
        name: stock.name,
        reason: this.getRecommendationReason(stock.name, riskLevel),
        currentPrice: stock.currentPrice,
        targetPrice,
        expectedReturn,
        riskLevel,
      };
    });

    // AI를 통한 섹터 분석 생성
    let sectorAnalysis: string;
    let marketTrend: string;
    
    try {
      const [aiAnalysis, aiTrend] = await Promise.all([
        this.agenticaService.generateSectorAnalysis(sector),
        this.agenticaService.generateMarketTrend(sector),
      ]);
      sectorAnalysis = aiAnalysis;
      marketTrend = aiTrend;
    } catch (error) {
      this.logger.error(`AI 분석 생성 실패: ${error.message}`);
      sectorAnalysis = this.getFallbackSectorAnalysis(sector);
      marketTrend = this.getFallbackMarketTrend(sector);
    }

    return {
      sector,
      stocks: recommendations,
      sectorAnalysis,
      marketTrend,
    };
  }

  /**
   * 사용 가능한 섹터 목록
   */
  async getAvailableSectors(): Promise<string[]> {
    return [
      '2차전지',
      '반도체',
      'AI/클라우드',
      '바이오',
      '방산',
      '엔터',
      '게임',
      '신재생',
      '자동차',
      '화장품',
    ];
  }

  /**
   * 섹터별 샘플 종목 데이터
   */
  private getSampleStocksBySector(sector: string): SectorStock[] {
    const sectorData = {
      '2차전지': [
        { code: '051910', name: 'LG화학', sector: '2차전지', subSector: '양극재' },
        { code: '006400', name: '삼성SDI', sector: '2차전지', subSector: '배터리셀' },
        { code: '373220', name: '에너지솔루션', sector: '2차전지', subSector: '전해액' },
      ],
      '반도체': [
        { code: '005930', name: '삼성전자', sector: '반도체', subSector: '종합반도체' },
        { code: '000660', name: 'SK하이닉스', sector: '반도체', subSector: '메모리반도체' },
        { code: '058470', name: '리노공업', sector: '반도체', subSector: '반도체장비' },
      ],
      'AI/클라우드': [
        { code: '035720', name: '카카오', sector: 'AI/클라우드', subSector: '플랫폼' },
        { code: '035420', name: 'NAVER', sector: 'AI/클라우드', subSector: '포털/AI' },
        { code: '053800', name: '안랩', sector: 'AI/클라우드', subSector: '보안SW' },
      ],
    };

    return sectorData[sector] || [];
  }

  /**
   * 추천 이유 생성
   */
  private getRecommendationReason(stockName: string, riskLevel: string): string {
    const reasons = {
      low: '우수한 재무구조와 안정적인 수익성, 업계 선도 기업',
      medium: '양호한 재무상태와 성장 가능성, 섹터 내 경쟁력 보유',
      high: '높은 성장 잠재력, 신기술 투자 활발',
    };
    return reasons[riskLevel] || '섹터 내 주요 기업';
  }

  /**
   * 기본 섹터 분석
   */
  private getFallbackSectorAnalysis(sector: string): string {
    const analyses = {
      '2차전지': '전기차 시장 성장과 ESS 수요 증가로 중장기 성장 전망이 밝습니다.',
      '반도체': 'AI와 데이터센터 수요 증가로 메모리 반도체 시장 회복이 예상됩니다.',
      'AI/클라우드': 'AI 혁명과 디지털 전환 가속화로 고성장이 지속되고 있습니다.',
    };
    return analyses[sector] || `${sector} 섹터는 시장 상황에 따라 변동성이 있습니다.`;
  }

  /**
   * 기본 시장 트렌드
   */
  private getFallbackMarketTrend(sector: string): string {
    const trends = {
      '2차전지': '단기 조정 후 중장기 상승 전망',
      '반도체': '바닥 통과 후 회복 국면 진입',
      'AI/클라우드': '강세 지속 전망',
    };
    return trends[sector] || `${sector} 섹터는 박스권 흐름을 보이고 있습니다.`;
  }
}