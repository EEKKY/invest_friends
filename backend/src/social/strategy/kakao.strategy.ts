import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { KakaoStrategyUser, KakaoUser } from '../interface/social.interface';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private readonly configService: ConfigService) {
    const options: KakaoStrategyUser = {
      clientID: configService.get('KAKAO_CLIENT_ID'),
      clientSecret: configService.get('KAKAO_CLIENT_SECRET'),
      callbackURL: 'http://localhost:3000/sociallogin/kakao/callback',
      scope: ['account_email'],
    };
    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<KakaoUser> {
    const { username, _json } = profile;
    const user: KakaoUser = {
      provider: 'kakao',
      name: username || '',
      email: _json?.kakao_account?.email || '',
    };
    return user;
  }
}
