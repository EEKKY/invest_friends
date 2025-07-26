import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from './entity/auth.entity';
import { GoogleStrategy } from './strategy/google.strategy';
import { KakaoStrategy } from './strategy/kakao.strategy';
import { NaverStrategy } from './strategy/naver.strategy';
// import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthModule } from 'src/authguard/authguard.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AuthEntity]),
    JwtAuthModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, KakaoStrategy, NaverStrategy],
})
export class AuthModule {}
