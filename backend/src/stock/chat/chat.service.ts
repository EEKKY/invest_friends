import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly logger = new Logger(ChatService.name);
  private openai: OpenAI | null = null;
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async onModuleInit() {
    if (this.openai) {
      this.logger.log('Chat agent initialized successfully');
    } else {
      this.logger.warn(
        'OpenAI API key not found. Chat features will be disabled.',
      );
    }
  }
  /**
   * 일반 채팅 기능
   * GPT-4와 자유로운 대화를 나눕니다
   */
  async chat(
    message: string,
    context?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  ): Promise<{
    success: boolean;
    message: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    if (!this.openai) {
      return {
        success: false,
        message: 'OpenAI API가 설정되지 않았습니다.',
      };
    }

    try {
      const messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }> = [
        {
          role: 'system',
          content: `당신은 한국 주식시장 전문 AI 애널리스트입니다.
투자자들에게 정확하고 유용한 정보를 제공하며, 리스크도 함께 설명합니다.
답변은 전문적이면서도 이해하기 쉽게 작성합니다.
친절하고 도움이 되는 AI 어시스턴트로서 한국어로 자연스럽게 대화합니다.`,
        },
      ];

      // 이전 대화 컨텍스트 추가 (최근 10개만)
      if (context && context.length > 0) {
        const recentContext = context.slice(-10);
        messages.push(...recentContext);
      }

      messages.push({ role: 'user', content: message });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages,
      });
      const reply = response.choices[0].message;

      return {
        success: true,
        message: reply.content || '응답을 생성할 수 없습니다.',
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error('Chat error:', error);
      return {
        success: false,
        message: '채팅 처리 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 주식 전문 채팅 기능
   * 주식 관련 질문에 특화된 답변을 제공합니다
   */
  async stockChat(
    message: string,
    stockContext?: {
      code?: string;
      name?: string;
      sector?: string;
      currentPrice?: number;
      changeRate?: number;
    },
    chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{
    success: boolean;
    message: string;
    suggestions?: string[];
    relatedStocks?: Array<{ code: string; name: string }>;
  }> {
    if (!this.openai) {
      return {
        success: false,
        message: 'OpenAI API가 설정되지 않았습니다.',
      };
    }

    try {
      let systemPrompt = `당신은 한국 주식시장 전문 AI 애널리스트입니다.
투자자들에게 정확하고 유용한 정보를 제공하며, 리스크도 함께 설명합니다.
답변은 전문적이면서도 이해하기 쉽게 작성합니다.`;

      // 현재 조회 중인 종목 정보 추가
      if (stockContext) {
        systemPrompt += `\n\n현재 분석 중인 종목:
- 종목코드: ${stockContext.code || '미제공'}
- 종목명: ${stockContext.name || '미제공'}
- 섹터: ${stockContext.sector || '미제공'}
- 현재가: ${stockContext.currentPrice ? `${stockContext.currentPrice.toLocaleString()}원` : '미제공'}
- 등락률: ${stockContext.changeRate !== undefined ? `${stockContext.changeRate}%` : '미제공'}`;
      }

      const messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }> = [{ role: 'system', content: systemPrompt }];

      // 최근 대화 내역 추가 (최근 6개만)
      if (chatHistory && chatHistory.length > 0) {
        const recentHistory = chatHistory.slice(-6);
        messages.push(...recentHistory);
      }

      messages.push({ role: 'user', content: message });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages,
      });

      const reply = response.choices[0].message;

      // 기본 응답 반환
      return {
        success: true,
        message: reply.content || '응답을 생성할 수 없습니다.',
      };
    } catch (error) {
      this.logger.error('Stock chat error:', error);
      return {
        success: false,
        message: '주식 분석 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 섹터 분석 생성 (간단한 버전)
   */
  async generateSectorAnalysis(sector: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!this.openai) {
      return {
        success: false,
        message: `${sector} 섹터는 시장 상황에 따라 변동성이 있습니다.`,
      };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 한국 주식시장의 섹터 분석 및 종목 추천 전문가입니다. 
          다음 형식으로 분석을 제공해주세요:
          
          1. 섹터 현황 (2-3문장)
          2. 투자 포인트 (핵심 이유 2-3개)
          3. 추천 종목 (3-5개, 종목명과 간단한 이유)
          4. 리스크 요인 (1-2개)
          
          객관적이고 균형잡힌 시각으로 분석하되, 투자 결정은 개인의 판단임을 명시하세요.`,
          },
          {
            role: 'user',
            content: `${sector} 섹터에 대해 다음과 같이 분석해주세요:

          **섹터 현황:**
          - 현재 시장 상황과 최근 동향
          - 성장 전망과 시장 위치

          **투자 포인트:**
          - 이 섹터가 주목받는 핵심 이유들
          - 성장 동력과 경쟁력 요소

          **추천 종목 (3-5개):**
          - 종목명: 추천 이유 (재무상태, 성장성, 경쟁력 등)
          - 대형주, 중형주 포함하여 다양한 옵션 제시

          **리스크 요인:**
          - 섹터별 주요 위험 요소
          - 시장 변동성 및 규제 리스크

          ※ 본 정보는 투자 참고용이며, 투자 결정은 개인의 판단에 따라 신중히 하시기 바랍니다.`,
          },
        ],
        max_completion_tokens: 800,
      });

      return {
        success: true,
        message:
          response.choices[0].message.content ||
          `${sector} 섹터 분석을 완료했습니다.`,
      };
    } catch (error) {
      this.logger.error('Failed to generate sector analysis:', error);
      return {
        success: true,
        message: `${sector} 섹터는 현재 시장 상황에 따라 변동성이 있으며, 투자 시 신중한 검토가 필요합니다.`,
      };
    }
  }
}
