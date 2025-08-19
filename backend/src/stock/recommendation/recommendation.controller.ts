import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service';
import { 
  SectorRecommendationResponseDto,
  AvailableSectorsResponseDto 
} from './dto/recommendation.dto';

@ApiTags('recommendation')
@Controller('recommendation')
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
  ) {}

  @Get('sector')
  @ApiOperation({ 
    summary: '섹터별 종목 추천',
    description: '특정 섹터의 추천 종목을 조회합니다. 재무 데이터와 시장 데이터를 기반으로 3개 종목을 추천합니다.'
  })
  @ApiQuery({
    name: 'sector',
    required: true,
    description: '추천받을 섹터 (예: 2차전지, 반도체, AI/클라우드 등)',
    example: '2차전지',
  })
  @ApiResponse({
    status: 200,
    description: '섹터별 추천 종목 조회 성공',
    type: SectorRecommendationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 섹터명',
  })
  async getRecommendationsBySector(
    @Query('sector') sector: string,
  ): Promise<SectorRecommendationResponseDto> {
    try {
      if (!sector || sector.trim() === '') {
        throw new HttpException(
          '섹터를 입력해주세요',
          HttpStatus.BAD_REQUEST
        );
      }

      const recommendations = await this.recommendationService.getRecommendationsBySector(sector);
      return recommendations;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      if (error.message.includes('찾을 수 없습니다')) {
        throw new HttpException(
          error.message,
          HttpStatus.BAD_REQUEST
        );
      }

      console.error('Recommendation error:', error);
      throw new HttpException(
        '추천 종목 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sectors')
  @ApiOperation({ 
    summary: '사용 가능한 섹터 목록 조회',
    description: '추천 가능한 모든 섹터 목록을 조회합니다.'
  })
  @ApiResponse({
    status: 200,
    description: '섹터 목록 조회 성공',
    type: AvailableSectorsResponseDto,
  })
  async getAvailableSectors(): Promise<AvailableSectorsResponseDto> {
    const sectors = await this.recommendationService.getAvailableSectors();
    return { sectors };
  }
}