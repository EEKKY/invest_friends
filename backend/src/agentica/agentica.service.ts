import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agentica, assertHttpController } from '@agentica/core';
import OpenAI from 'openai';
import { KisService } from '../stock/chart/kis/kis.service';
import { DartService } from '../stock/chart/dart/dart.service';

@Injectable()
export class AgenticaService {
  private readonly logger = new Logger(AgenticaService.name);
  private agent: Agentica<'chatgpt'> | null = null;
  private initialized = false;

  constructor(
    private configService: ConfigService,
    private kisService: KisService,
    private dartService: DartService,
  ) {
    // 서버가 완전히 시작된 후 초기화
    setTimeout(() => this.initializeAgent(), 3000);
  }

  /**
   * Agentica 에이전트 초기화
   */
  private async initializeAgent(): Promise<void> {
    try {
      const openAiKey = this.configService.get<string>('OPENAI_API_KEY');
      
      if (!openAiKey) {
        this.logger.warn('OpenAI API key not found. Agentica service will not be available.');
        return;
      }

      const openai = new OpenAI({ apiKey: openAiKey });

      // 현재 서버의 Swagger 문서 가져오기
      const host = this.configService.get<string>('APP_HOST', 'http://localhost:3000');
      const swaggerDoc = await fetch(`${host}/api/v1-json`).then(r => r.json());

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
    if (!this.initialized || !this.agent) {
      // Agentica가 초기화되지 않은 경우 직접 처리
      return this.processFallback(message);
    }

    try {
      // JWT 토큰이 필요한 경우 헤더에 추가
      if (userId) {
        // TODO: Generate JWT token for the user
        // const token = await this.authService.generateToken(userId);
        // Update agent connection headers with token
      }

      // Agentica를 통해 자연어를 API 호출로 변환
      const response = await this.agent.conversate(message);
      
      return {
        success: true,
        data: response,
        message: 'Agentica processed successfully',
      };
    } catch (error) {
      this.logger.error('Error processing message with Agentica', error);
      
      // 에러 발생시 폴백 처리
      return this.processFallback(message);
    }
  }

  /**
   * Agentica가 사용 불가능할 때 직접 처리
   * @param message 사용자 메시지
   * @returns 폴백 응답
   */
  private async processFallback(message: string): Promise<any> {
    const lowerMessage = message.toLowerCase();
    
    try {
      // 주가 조회 패턴
      if (lowerMessage.includes('주가') || lowerMessage.includes('가격')) {
        // 종목 코드 추출 (예: 005930, 삼성전자)
        const stockCode = this.extractStockCode(message);
        if (stockCode) {
          const priceData = await this.kisService.getPrice({
            FID_COND_MRKT_DIV_CODE: 'J',
            FID_INPUT_ISCD: stockCode,
          });
          
          return {
            success: true,
            data: priceData,
            message: `${stockCode} 주가 정보`,
          };
        }
      }
      
      // 차트 데이터 패턴
      if (lowerMessage.includes('차트') || lowerMessage.includes('그래프')) {
        const stockCode = this.extractStockCode(message);
        if (stockCode) {
          const chartData = await this.kisService.getDailyChart({
            FID_COND_MRKT_DIV_CODE: 'J',
            FID_INPUT_ISCD: stockCode,
            FID_PERIOD_DIV_CODE: 'D',
            FID_ORG_ADJ_PRC: '0',
          });
          
          return {
            success: true,
            data: chartData,
            message: `${stockCode} 차트 데이터`,
          };
        }
      }
      
      // 재무제표 패턴
      if (lowerMessage.includes('재무') || lowerMessage.includes('실적')) {
        const corpCode = this.extractCorpCode(message);
        if (corpCode) {
          const financialData = await this.dartService.getFinancialStatements(
            corpCode,
            new Date().getFullYear(),
          );
          
          return {
            success: true,
            data: financialData,
            message: `재무제표 정보`,
          };
        }
      }
      
      // 기본 응답
      return {
        success: false,
        message: '죄송합니다. 요청을 이해하지 못했습니다. 주가, 차트, 재무제표 등을 요청해보세요.',
        examples: [
          '삼성전자 주가 알려줘',
          '005930 차트 보여줘',
          'SK하이닉스 재무제표 조회',
        ],
      };
    } catch (error) {
      this.logger.error('Error in fallback processing', error);
      return {
        success: false,
        message: '처리 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  /**
   * 메시지에서 종목 코드 추출
   * @param message 사용자 메시지
   * @returns 종목 코드 또는 null
   */
  private extractStockCode(message: string): string | null {
    // 6자리 숫자 패턴 찾기
    const codeMatch = message.match(/\d{6}/);
    if (codeMatch) {
      return codeMatch[0];
    }
    
    // 종목명으로 매핑 (예시)
    const stockMap: Record<string, string> = {
      '삼성전자': '005930',
      'SK하이닉스': '000660',
      'LG전자': '066570',
      'NAVER': '035420',
      '카카오': '035720',
    };
    
    for (const [name, code] of Object.entries(stockMap)) {
      if (message.includes(name)) {
        return code;
      }
    }
    
    return null;
  }

  /**
   * 메시지에서 기업 코드 추출
   * @param message 사용자 메시지
   * @returns 기업 코드 또는 null
   */
  private extractCorpCode(message: string): string | null {
    // TODO: Implement corp code extraction logic
    // This would typically involve looking up the corp code from a database
    return '00126380'; // 삼성전자 예시
  }

  /**
   * Agentica 상태 확인
   * @returns 초기화 상태
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}