import { Module } from '@nestjs/common';
import { ChartModule } from './stock/chart/chart.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database.module';
import { ConfigModule } from '@nestjs/config';
import { LoginModule } from './login/login.module';
import { JwtAuthModule } from './authguard/authguard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ChartModule,
    AuthModule,
    DatabaseModule,
    LoginModule,
    JwtAuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
