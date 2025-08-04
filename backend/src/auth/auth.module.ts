import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from './entity/auth.entity';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthModule } from 'src/authguard/authguard.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AuthEntity]),
    JwtAuthModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], //재사용 대비
})
export class AuthModule {}
