import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from 'src/auth/entity/auth.entity';
import { JwtStrategy } from './jwt.strategy';
import { AccessTokenService } from './accesstoken/access.token.service';
import { RefreshTokenService } from './refreshtoken/refresh.token.service';
import { JwtAuthService } from './jwt.service';
import { JwtConfig } from './interface/jwt.token.interface';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'JWT_KEY',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h',
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([AuthEntity]),
  ],
  providers: [
    AccessTokenService,
    RefreshTokenService,
    JwtStrategy,
    JwtAuthService,
    {
      provide: 'JWT_CONFIG',
      useFactory: (configService: ConfigService): JwtConfig => ({
        accessToken: {
          secret: configService.get<string>('JWT_SECRET') || 'JWT_KEY',
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h',
        },
        refreshToken: {
          secret:
            configService.get<string>('JWT_REFRESH_SECRET') ||
            'JWT_REFRESH_KEY',
          expiresIn:
            configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
        },
      }),
      inject: [ConfigService],
    },
  ],
  exports: [
    AccessTokenService,
    RefreshTokenService,
    JwtAuthService,
    PassportModule,
    'JWT_CONFIG',
  ],
})
export class JwtAuthModule {}
