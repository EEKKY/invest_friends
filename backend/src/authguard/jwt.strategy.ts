import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthEntity } from 'src/auth/entity/auth.entity';
import { Repository } from 'typeorm';
import { JwtPayload } from './jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'JWT_KEY',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthEntity> {
    const { userUid } = payload;

    const user = await this.authRepository.findOne({
      where: { userUid },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    if (user.deleteAt !== null) {
      throw new UnauthorizedException('탈퇴한 사용자입니다');
    }

    return user;
  }
}
