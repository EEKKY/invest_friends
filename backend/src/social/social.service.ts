import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity, Social } from 'src/auth/entity/auth.entity';
import { JwtAuthService } from 'src/authguard/jwt.service';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { SocialUser } from './interface/social.interface';

@Injectable()
export class SocialService {
  logger = new Logger('sociallogin');
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

    let authUser = await this.authRepository.findOneBy({ userEmail: email }); //소셜은 Uid말고 메일로 조회

    if (!authUser) {
      //없을시 생성
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
        userPassword: null,
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
      this.logger.error('소셜 로그인 에러', error.stack);
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
      httpOnly: false, //펄스로 했음 이거 나중에 트루로 하고 api로 쏠 예정
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
