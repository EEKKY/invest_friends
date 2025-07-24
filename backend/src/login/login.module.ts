import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginController } from './login.controller';
import { AuthEntity } from 'src/auth/entity/auth.entity';
import { LoginService } from './login.service';
import { JwtAuthModule } from 'src/authguard/authguard.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuthEntity]), JwtAuthModule],
  controllers: [LoginController],
  providers: [LoginService],
})
export class LoginModule {}
