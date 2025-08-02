import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { SocialService } from './social.service';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'src/authguard/jwt.decorator';
import { Request, Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('소셜 로그인')
@Controller('sociallogin')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @ApiOperation({ summary: 'Google로그인 시작' })
  @ApiResponse({
    status: 302,
    description: 'Google OAuth 리다이렉트',
  })
  @UseGuards(AuthGuard('google'))
  @Get('google')
  async googleAuth(): Promise<void> {
    //여기에서 리다이렉트 시작하고
    //엔드 포인트 보다 패스 포트가 옵스 URL로 리다이렉트 처리해줌
    return;
  }

  @ApiOperation({ summary: 'Google 로그인 콜백처리' })
  @ApiResponse({
    status: 302,
    description: '로그인 성공 시 프론트엔드로 리다이렉트',
  })
  @ApiResponse({
    status: 400,
    description: '소셜 로그인 실패',
  })
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google')) //여기에서 유저 정보를 검증함
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.socialService.handleSocialLoginCallback(req, res);
  }

  @ApiOperation({ summary: 'Naver 로그인 시작' })
  @ApiResponse({
    status: 302,
    description: 'Naver OAuth 리다이렉트',
  })
  @UseGuards(AuthGuard('naver'))
  @Get('naver')
  async naverAuth(): Promise<void> {
    return;
  }

  @ApiOperation({ summary: 'Naver 로그인 콜백 처리' })
  @ApiResponse({
    status: 302,
    description: '로그인 성공 시 프론트엔드로 리다이렉트',
  })
  @ApiResponse({
    status: 400,
    description: '소셜 로그인 실패',
  })
  @Public()
  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.socialService.handleSocialLoginCallback(req, res);
  }

  @ApiOperation({ summary: 'Kakao로그인 시작' })
  @ApiResponse({
    status: 302,
    description: 'Kakao OAuth 리다이렉트',
  })
  @UseGuards(AuthGuard('kakao'))
  @Get('kakao')
  async kakaoAuth(): Promise<void> {
    return;
  }

  @ApiOperation({ summary: 'Kakao로그인 콜백 처리' })
  @ApiResponse({
    status: 302,
    description: '로그인 성공 시 프론트엔드로 리다이렉트',
  })
  @ApiResponse({
    status: 400,
    description: '소셜 로그인 실패',
  })
  @Public()
  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.socialService.handleSocialLoginCallback(req, res);
  }
}
