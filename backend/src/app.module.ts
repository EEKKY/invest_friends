import { Module } from '@nestjs/common';
import { StockModule } from './stock/stock.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StockModule,
    DatabaseModule,
    AuthModule,
  ],
})
export class AppModule {}
