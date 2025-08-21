import { Body, Controller, Post, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { Public } from '../../authguard/jwt.decorator';

@ApiTags('Chat')
@Controller('Chat')
export class ChatController {
  constructor(private readonly ChatService: ChatService) {}

  @Public()
  @Post('chat')
  @ApiOperation({
    summary: 'GPT 채팅',
    description: `
GPT-4와 자유롭게 대화할 수 있는 채팅 기능입니다.
주식 관련 질문뿐만 아니라 다양한 주제로 대화가 가능합니다.
대화 컨텍스트를 유지하여 연속적인 대화가 가능합니다.
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: '사용자 메시지',
          example: '오늘 주식시장 어때?',
        },
        context: {
          type: 'array',
          description: '이전 대화 컨텍스트',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['user', 'assistant'] },
              content: { type: 'string' },
            },
          },
        },
      },
      required: ['message'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '채팅 응답 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '오늘 한국 주식시장은...' },
        usage: {
          type: 'object',
          properties: {
            promptTokens: { type: 'number' },
            completionTokens: { type: 'number' },
            totalTokens: { type: 'number' },
          },
        },
      },
    },
  })
  async chat(
    @Body()
    dto: {
      message: string;
      context?: Array<{ role: 'user' | 'assistant'; content: string }>;
    },
  ): Promise<{
    success: boolean;
    message: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    return this.ChatService.chat(dto.message, dto.context);
  }

  @Public()
  @Post('chat/stock')
  @ApiOperation({
    summary: '주식 전문 채팅',
    description: `
주식 및 투자 관련 전문적인 질문에 대해 AI가 답변합니다.
현재 조회 중인 종목 정보를 컨텍스트로 제공하면 더 정확한 분석을 받을 수 있습니다.
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: '주식 관련 질문',
          example: '삼성전자 매수해도 될까?',
        },
        stockContext: {
          type: 'object',
          description: '현재 조회 중인 종목 정보',
          properties: {
            code: { type: 'string', example: '005930' },
            name: { type: 'string', example: '삼성전자' },
            sector: { type: 'string', example: '반도체' },
            currentPrice: { type: 'number', example: 71000 },
            changeRate: { type: 'number', example: -1.2 },
          },
        },
        chatHistory: {
          type: 'array',
          description: '이전 대화 내역',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['user', 'assistant'] },
              content: { type: 'string' },
            },
          },
        },
      },
      required: ['message'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '주식 채팅 응답 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: '삼성전자는 현재 반도체 업황 회복기에 있습니다...',
        },
      },
    },
  })
  async stockChat(
    @Body()
    dto: {
      message: string;
      stockContext?: {
        code?: string;
        name?: string;
        sector?: string;
        currentPrice?: number;
        changeRate?: number;
      };
      chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    },
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.ChatService.stockChat(
      dto.message,
      dto.stockContext,
      dto.chatHistory,
    );
  }

  @Public()
  @Post('chat/generateSectorAnalysis')
  @ApiOperation({
    summary: '섹터 분석 생성',
    description: `
특정 섹터에 대한 시장 분석과 전망을 AI가 생성합니다.
한국 주식시장의 섹터별 현황과 투자 포인트를 제공합니다.
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sector: {
          type: 'string',
          description: '분석할 섹터명',
          example: '반도체',
        },
      },
      required: ['sector'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '섹터 분석 생성 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example:
            '반도체 섹터는 AI 수요 증가로 긍정적 전망이 지속되고 있습니다...',
        },
      },
    },
  })
  async generateSectorAnalysis(@Body() dto: { sector: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.ChatService.generateSectorAnalysis(dto.sector);
  }
}
