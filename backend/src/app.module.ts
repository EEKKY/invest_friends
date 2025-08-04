import { Module } from '@nestjs/common';
import { ChartModule } from './stock/chart/chart.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database.module';
import { ConfigModule } from '@nestjs/config';
import { LoginModule } from './login/login.module';
import { JwtAuthModule } from './authguard/authguard.module';
import { SocialModule } from './social/social.module';
import { AxiosWrapperModule } from './common/http-service/axios-wrapper.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ChartModule,
    AuthModule,
    DatabaseModule,
    AxiosWrapperModule, //예전 파일 모듈로 되어 있길래 바꿔놓음
    LoginModule,
    JwtAuthModule,
    SocialModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
