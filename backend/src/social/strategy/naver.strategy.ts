import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-naver';
import { ConfigService } from '@nestjs/config';
import { NaverUser } from '../interface/social.interface';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get('NAVER_CLIENT_ID'),
      clientSecret: configService.get('NAVER_CLIENT_SECRET'),
      callbackURL: 'http://localhost:3000/sociallogin/naver/callback',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<NaverUser> {
    const { id, displayName, _json } = profile;
    const user: NaverUser = {
      provider: 'naver',
      providerId: id,
      name: displayName || '',
      email: _json?.email || '',
    };
    return user;
  }
}
