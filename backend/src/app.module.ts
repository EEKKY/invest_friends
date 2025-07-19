import { Module } from '@nestjs/common';
import { StockModule } from './stock/stock.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database.module';
import { AxiosFilterModule } from './common/axios/error_handler/axios-filter.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    StockModule,
    AuthModule,
    DatabaseModule,
    AxiosFilterModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
