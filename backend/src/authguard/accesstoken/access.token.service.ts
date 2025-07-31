import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity } from 'src/auth/entity/auth.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenResponseDto } from './dto/access.dto';
import { JwtConfig, JwtPayload } from '../interface/jwt.token.interface';

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('JWT_CONFIG') private readonly jwtConfig: JwtConfig,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
  ) {}

  async generateAccessToken(user: AuthEntity): Promise<AccessTokenResponseDto> {
    const payload: JwtPayload = {
      userUid: user.userUid,
      userEmail: user.userEmail,
    };

    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtConfig.accessToken.expiresIn,
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token, {
        secret: this.jwtConfig.accessToken.secret,
      });
    } catch {
      throw new UnauthorizedException('액세스 토큰이 유효하지 않습니다.');
    }
  }

  async getUserFromAccessToken(token: string): Promise<AuthEntity> {
    const payload: JwtPayload = this.verifyAccessToken(token);
    const user = await this.authRepository.findOne({
      where: { userUid: payload.userUid },
    });

    if (!user) {
      throw new UnauthorizedException('유저를 찾을 수 없습니다');
    }

    if (user.deleteAt !== null) {
      throw new UnauthorizedException('탈퇴한 사용자 입니다.');
    }
    return user;
  }
}
