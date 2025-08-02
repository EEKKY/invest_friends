import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { SocialService } from './social.service';
import { AuthEntity } from 'src/auth/entity/auth.entity';
import { JwtAuthModule } from 'src/authguard/authguard.module';
import { SocialController } from './social.controller';
import { GoogleStrategy } from './strategy/google.strategy';
import { KakaoStrategy } from './strategy/kakao.strategy';
import { NaverStrategy } from './strategy/naver.strategy';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([AuthEntity]),
    JwtAuthModule,
  ],
  controllers: [SocialController],
  providers: [SocialService, GoogleStrategy, KakaoStrategy, NaverStrategy],
  exports: [SocialService],
})
export class SocialModule {}
