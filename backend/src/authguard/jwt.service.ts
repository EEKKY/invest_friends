import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity } from 'src/auth/entity/auth.entity';
import { Repository } from 'typeorm';

export interface JwtPayload {
  userUid: string;
  userEmail: string;
  userNick: string;
}

export interface TokenRespones {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
}

@Injectable()
export class CustomJwtService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
  ) {}

  async generateToken(user: AuthEntity): Promise<TokenRespones> {
    const payload: JwtPayload = {
      userUid: user.userUid,
      userEmail: user.userEmail,
      userNick: user.userNick,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '1h',
    };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('토큰 검증');
    }
  }

  async getUserToken(token: string): Promise<AuthEntity> {
    const payload: JwtPayload = this.jwtService.verify(token);
    const user = await this.authRepository.findOne({
      where: { userUid: payload.userUid },
    });

    if (!user) {
      throw new UnauthorizedException('유저 없음');
    }

    return user;
  }

  async RefreshToekn(user: AuthEntity): Promise<string> {
    const payload: JwtPayload = {
      userUid: user.userUid,
      userEmail: user.userEmail,
      userNick: user.userNick,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }
}
