import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get('KAKAO_CLIENT_ID'),
      clientSecret: configService.get('KAKAO_CLIENT_SECRET'),
      callbackURL: 'http://localhost:3000/auth/kakao/callback',
      scope: ['account_email'],
    } as any);
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { id, username, _json } = profile;
    const user = {
      provider: 'kakao',
      providerId: id,
      name: username,
      email: _json.kakao_account.email,
    };
    return user;
  }
}
