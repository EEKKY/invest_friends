import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity, Social } from 'src/auth/entity/auth.entity';
import { JwtAuthService } from 'src/authguard/jwt.service';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';

interface SocialUser {
  email: string;
  provider: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    private readonly configService: ConfigService,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  async socialLogin(req: Request): Promise<AuthEntity> {
    const user = req.user as SocialUser;
    if (!user) {
      throw new BadRequestException('소셜 유저 정보가 없습니다.');
    }

    const { email, provider, name, firstName } = user;
    const displayName = name || firstName || email.split('@')[0];

    let authUser = await this.authRepository.findOne({
      where: { userEmail: email },
    });

    if (!user) {
      let socialProvider: Social;
      switch (provider) {
        case 'google':
          socialProvider = Social.GOOGLE;
          break;
        case 'kakao':
          socialProvider = Social.KAKAO;
          break;
        case 'naver':
          socialProvider = Social.NAVER;
          break;
        default:
          throw new BadRequestException(
            `지원하지 않는 소셜 로그인: ${provider}`,
          );
      }

      const newUser = this.authRepository.create({
        userEmail: email,
        userNick: displayName,
        social: socialProvider,
      });
      authUser = await this.authRepository.save(newUser);
    }

    return authUser;
  }

  async handleSocialLoginCallback(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.socialLogin(req);
      await this.setAuthCookiesAndRedirect(res, user, true);
    } catch (error) {
      console.error('Social login error:', error);
      await this.redirectToFrontend(res, false);
    }
  }

  private async setAuthCookiesAndRedirect(
    res: Response,
    user: AuthEntity,
    success: boolean,
  ): Promise<void> {
    if (success && user) {
      const tokenPair = await this.jwtAuthService.generateTokenPair(user);

      this.setSecureCookie(res, 'accessToken', tokenPair.accessToken, 3600000); // 1시간
      this.setSecureCookie(
        res,
        'refreshToken',
        tokenPair.refreshToken,
        7 * 24 * 60 * 60 * 1000,
      ); // 7일
    }

    await this.redirectToFrontend(res, success);
  }

  private setSecureCookie(
    res: Response,
    name: string,
    value: string,
    maxAge: number,
  ): void {
    res.cookie(name, value, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge,
    });
  }

  private async redirectToFrontend(
    res: Response,
    success: boolean,
  ): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const status = success ? 'success' : 'fail';
    res.redirect(`${frontendUrl}/auth/callback?login=${status}`);
  }
}
