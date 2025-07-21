import { Module } from '@nestjs/common';
import { StockModule } from './stock/stock.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database.module';
import { LoginModule } from './login/login.module';
import { JwtAuthModule } from './authguard/authguard.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StockModule,
    DatabaseModule,
    AuthModule,
    LoginModule,
    JwtAuthModule,
  ],
})
export class AppModule {}
