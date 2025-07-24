import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity } from 'src/auth/entity/auth.entity';
import { Repository } from 'typeorm';
import { RefreshDto } from './dto/refresh.dto';
import { JwtConfig, ReJwtPayload } from '../interface/jwt.token.interface';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('JWT_CONFIG') private readonly jwtConfig: JwtConfig,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
  ) {}

  async generatRefreshToken(user: AuthEntity): Promise<RefreshDto> {
    const payload: ReJwtPayload = {
      userUid: user.userUid,
      userEmail: user.userEmail,
      userNick: user.userNick,
    };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtConfig.refreshToken.secret,
      expiresIn: this.jwtConfig.refreshToken.expiresIn,
    });

    return {
      refreshToken,
      expiresIn: this.jwtConfig.refreshToken.expiresIn,
    };
  }

  verifyRefreshToken(token: string): ReJwtPayload {
    try {
      return this.jwtService.verify(token, {
        secret: this.jwtConfig.refreshToken.secret,
      });
    } catch {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }
  }
  async getUserFromRefreshToken(refreshToken: string): Promise<AuthEntity> {
    const payload = this.verifyRefreshToken(refreshToken);
    const user = await this.authRepository.findOne({
      where: { userUid: payload.userUid },
    });
    if (!user) {
      throw new UnauthorizedException('유저를 찾을 수 없습니다');
    }
    if (user.deleteAt !== null) {
      throw new UnauthorizedException('탈퇴한 사용자 입니다');
    }
    return user;
  }
}
