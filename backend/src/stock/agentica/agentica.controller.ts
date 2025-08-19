import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { AgenticaService } from './agentica.service';
import { Public } from '../../authguard/jwt.decorator';

/**
 * Agentica 메시지 요청 DTO
 */
export class AgenticaMessageDto {
  @ApiProperty({
    description: '자연어로 작성된 요청 메시지',
    example: '삼성전자 주가 알려줘',
    examples: [
      '삼성전자 주가 알려줘',
      '005930 최근 한달 차트 보여줘',
      'SK하이닉스 재무제표 조회해줘',
      'KOSPI 지수 현재 얼마야?',
      '삼성전자와 SK하이닉스 주가 비교해줘',
    ],
  })
  message: string;
}

/**
 * Agentica 응답 DTO
 */
export class AgenticaResponseDto {
  @ApiProperty({
    description: '처리 성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '처리된 데이터',
    example: {
      stck_prpr: '78900',
      prdy_vrss: '1100',
      prdy_ctrt: '1.41',
    },
    required: false,
  })
  data?: any;

  @ApiProperty({
    description: '응답 메시지',
    example: '삼성전자 주가 정보',
  })
  message: string;

  @ApiProperty({
    description: '에러 메시지',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: '사용 가능한 명령 예시',
    required: false,
    example: ['삼성전자 주가 알려줘', '005930 차트 보여줘'],
  })
  examples?: string[];
}

@ApiTags('agentica')
@Controller('agentica')
export class AgenticaController {
  constructor(private readonly agenticaService: AgenticaService) {}

  @Public()
  @Post('chat')
  @ApiOperation({
    summary: '자연어로 API 호출',
    description: `
    Agentica를 사용하여 자연어 메시지를 백엔드 API 호출로 자동 변환합니다.

    **지원되는 명령 예시:**
    - 주가 조회: "삼성전자 주가 알려줘", "005930 현재가는?"
    - 차트 데이터: "삼성전자 일봉 차트", "최근 한달 차트 보여줘"
    - 재무제표: "SK하이닉스 재무제표", "삼성전자 실적 조회"
    - 지수 조회: "KOSPI 지수 현재 얼마야?", "KOSDAQ 지수 보여줘"
    - 비교 분석: "삼성전자와 SK하이닉스 비교", "반도체 관련주 분석"

    **작동 원리:**
    1. 자연어 메시지를 받아서 의도를 파악
    2. Swagger 문서를 기반으로 적절한 API 찾기
    3. 필요한 파라미터를 자동으로 추출하여 API 호출
    4. 결과를 구조화된 형태로 반환
    `,
  })
  @ApiBody({
    type: AgenticaMessageDto,
    description: '자연어 요청 메시지',
  })
  @ApiResponse({
    status: 200,
    type: AgenticaResponseDto,
    description: 'API 호출 성공',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 - 메시지를 이해할 수 없음',
  })
  @ApiResponse({
    status: 500,
    description: '서버 오류 - Agentica 처리 실패',
  })
  async processMessage(
    @Body() dto: AgenticaMessageDto,
  ): Promise<AgenticaResponseDto> {
    return this.agenticaService.processMessage(dto.message);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Agentica 서비스 상태 확인',
    description: 'Agentica 에이전트가 초기화되었는지 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '서비스 상태',
    schema: {
      type: 'object',
      properties: {
        initialized: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Agentica service is ready' },
      },
    },
  })
  getStatus(): { initialized: boolean; message: string } {
    const initialized = this.agenticaService.isInitialized();
    return {
      initialized,
      message: initialized
        ? 'Agentica service is ready'
        : 'Agentica service is not initialized. Check OPENAI_API_KEY in environment variables.',
    };
  }

  @Post('chat/auth')
  @UseGuards()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '인증된 자연어 API 호출',
    description:
      '인증된 사용자의 자연어 요청을 처리합니다. JWT 토큰이 필요합니다.',
  })
  @ApiBody({
    type: AgenticaMessageDto,
    description: '자연어 요청 메시지',
  })
  @ApiResponse({
    status: 200,
    type: AgenticaResponseDto,
    description: 'API 호출 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 - 유효한 JWT 토큰이 필요합니다',
  })
  async processAuthenticatedMessage(
    @Body() dto: AgenticaMessageDto,
    @Request() req: any,
  ): Promise<AgenticaResponseDto> {
    const userId = req.user?.id;
    return this.agenticaService.processMessage(dto.message, userId);
  }
}
