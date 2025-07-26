import { Injectable } from '@nestjs/common';
import { AccessTokenService } from './accesstoken/access.token.service';
import { RefreshTokenService } from './refreshtoken/refresh.token.service';
import { AuthEntity } from 'src/auth/entity/auth.entity';
import {
  RefreshResponse,
  TokenPairResponse,
} from './interface/jwt.token.interface';

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  // 토큰 생성
  async generateTokenPair(user: AuthEntity): Promise<TokenPairResponse> {
    const accessTokenResponse =
      await this.accessTokenService.generateAccessToken(user);
    const refreshToeknResponse =
      await this.refreshTokenService.generatRefreshToken(user);

    return {
      accessToken: accessTokenResponse.accessToken,
      refreshToken: refreshToeknResponse.refreshToken,
      tokenType: accessTokenResponse.tokenType,
      expiresIn: accessTokenResponse.expiresIn,
    };
  }

  // 토큰 갱신
  async refreshAccessToken(refreshToken: string): Promise<RefreshResponse> {
    const user =
      await this.refreshTokenService.getUserFromRefreshToken(refreshToken);
    const accessTokenResponse =
      await this.accessTokenService.generateAccessToken(user);

    return {
      accessToken: accessTokenResponse.accessToken,
      tokenType: accessTokenResponse.tokenType,
      expiresIn: accessTokenResponse.expiresIn,
    };
  }
}
