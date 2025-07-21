import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { LoginService } from './login.service';
import { CustomJwtService } from 'src/authguard/jwt.service';
import { Public } from 'src/authguard/jwt.decorator';

@Controller('login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly customJwtService: CustomJwtService,
  ) {}

  @Public()
  @Post()
  async login(@Body() loginDto: LoginDto) {
    const user = await this.loginService.findUserByEmail(loginDto.userEmail);
    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    const isPasswordValid = await this.loginService.valiPassword(
      loginDto.userPassword,
      user.userPassword,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    return this.customJwtService.generateToken(user);
  }
}
