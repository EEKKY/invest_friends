import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { LoginService } from './login.service';
import { JwtAuthService } from 'src/authguard/jwt.service';
import { Public } from 'src/authguard/jwt.decorator';
import { RefreshDto } from 'src/authguard/refreshtoken/dto/refresh.dto';
import {
  RefreshResponse,
  TokenPairResponse,
} from 'src/authguard/interface/jwt.token.interface';

@Controller('login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  @Public()
  @Post()
  async login(@Body() loginDto: LoginDto): Promise<TokenPairResponse> {
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

    return this.jwtAuthService.generateTokenPair(user);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshDto): Promise<RefreshResponse> {
    return this.jwtAuthService.refreshAccessToken(refreshTokenDto.refreshToken);
  }
}
