import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database.module';
import { ConfigModule } from '@nestjs/config';
import { LoginModule } from './login/login.module';
import { JwtAuthModule } from './authguard/authguard.module';
import { SocialModule } from './social/social.module';
import { KisModule } from './stock/chart/kis/kis.module';
import { DartModule } from './stock/chart/dart/dart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    KisModule,
    AuthModule,
    DatabaseModule,
    LoginModule,
    JwtAuthModule,
    SocialModule,
    DartModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
