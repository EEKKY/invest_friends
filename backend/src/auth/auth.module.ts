import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from './entity/auth.entity';
import { AtuhService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthModule } from 'src/authguard/authguard.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuthEntity]), JwtAuthModule],
  controllers: [AuthController],
  providers: [AtuhService],
})
export class AuthModule {}
