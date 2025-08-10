import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        synchronize: true, // 개발 중엔 true, 운영에서는 반드시 false
        logging: true,
        autoLoadEntities: true, // entity 자동 인식 (권장)
        retryAttempts: 0, // DB 연결 재시도 하지 않음
      }),
    }),
  ],
})
export class DatabaseModule {}
