import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agentica, assertHttpController } from '@agentica/core';
import OpenAI from 'openai';

@Injectable()
export class AgenticaService {
  private readonly logger = new Logger(AgenticaService.name);
  private agent: Agentica<'chatgpt'> | null = null;
  private initialized = false;

  constructor(private configService: ConfigService) {
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

      const response = await this.agent.conversate(message);

      return {
        success: true,
        data: response,
        message: 'Agentica processed successfully',
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
   * Agentica 상태 확인
   * @returns 초기화 상태
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
