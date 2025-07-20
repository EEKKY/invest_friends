import { Module } from '@nestjs/common';
import { StockModule } from './stock/stock.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database.module';
import { LoginModule } from './login/login.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StockModule,
    DatabaseModule,
    LoginModule
  ],
})
export class AppModule {}
