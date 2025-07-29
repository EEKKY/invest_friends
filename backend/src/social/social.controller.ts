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
  async googleAuth(): Promise<void> {}

  @Public()
  @Get('google/callback')
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.socialService.handleSocialLoginCallback(req, res);
  }

  @UseGuards(AuthGuard('naver'))
  @Get('naver')
  async naverAuth(): Promise<void> {}

  @Public()
  @Get('naver/callback')
  async naverAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.socialService.handleSocialLoginCallback(req, res);
  }

  @UseGuards(AuthGuard('kakao'))
  @Get('kakao')
  async kakaoAuth(): Promise<void> {}

  @Public()
  @Get('kakao/callback')
  async kakaoAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.socialService.handleSocialLoginCallback(req, res);
  }
}
