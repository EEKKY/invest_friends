import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { SocialService } from './social.service';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'src/authguard/jwt.decorator';
import { Request, Response } from 'express';

@Controller('sociallogin')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @UseGuards(AuthGuard('google'))
  @Get('google')
  async googleAuth(): Promise<void> { //여기에서 리다이렉트 시작하고
    //엔드 포인트 보다 패스 포트가 옵스 URL로 리다이렉트 처리해줌
    return;
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google')) //여기에서 유저 정보를 검증함
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.socialService.handleSocialLoginCallback(req, res);
  }

  @UseGuards(AuthGuard('naver'))
  @Get('naver')
  async naverAuth(): Promise<void> {
    return;
  }

  @Public()
  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.socialService.handleSocialLoginCallback(req, res);
  }

  @UseGuards(AuthGuard('kakao'))
  @Get('kakao')
  async kakaoAuth(): Promise<void> {
    return;
  }

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
