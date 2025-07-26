import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { CreateUserInput, UpdateUserDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { AuthEntity } from './entity/auth.entity';
import { AuthGuard } from '@nestjs/passport';

import { Public } from 'src/authguard/jwt.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthService } from 'src/authguard/jwt.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: '구글 로그인',
    description: '구글 로그인을 위한 리다이렉션 API',
  })
  @ApiResponse({ status: 302, description: '구글 로그인 페이지로 리다이렉트' })
  async googleAuth(@Req() req) {
    console.log('googleAuth');
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: '구글 로그인 콜백',
    description: '구글 로그인 성공 후 처리',
  })
  @ApiResponse({
    status: 200,
    description: '성공적으로 프론트엔드로 리다이렉트',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async googleAuthRedirect(@Req() req, @Res() res) {
    console.log('googleAuthRedirect');
    const user = await this.service.socialLogin(req);
    if (user) {
      const tokenPair = await this.jwtAuthService.generateTokenPair(user); // 토큰 생성

      res.cookie('accessToken', tokenPair.accessToken, {
        httpOnly: true, // JavaScript에서 접근 불가 (XSS 방어)
        secure: this.service.configService.get('NODE_ENV') === 'production', // HTTPS에서만 전송
        sameSite: 'Lax', // 또는 'Strict', CSRF 방어
        maxAge: 3600000, // 1시간 (밀리초 단위) - 액세스 토큰 만료 시간에 맞춰 설정
      });

      res.cookie('refreshToken', tokenPair.refreshToken, {
        httpOnly: true, // JavaScript에서 접근 불가
        secure: this.service.configService.get('NODE_ENV') === 'production', // HTTPS에서만 전송
        sameSite: 'Lax', // 또는 'Strict'
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (밀리초 단위) - 리프레시 토큰 만료 시간에 맞춰 설정
        // path: '/api/auth', // 리프레시 토큰 재발급 엔드포인트 경로로 제한 (선택 사항)
      });

      res.redirect(
        `${this.service.configService.get(
          'FRONTEND_URL',
        )}/auth/callback?login=success`,
      );
    } else {
      res.redirect(
        `${this.service.configService.get(
          'FRONTEND_URL',
        )}/auth/callback?login=fail`,
      );
    }
  }

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({
    summary: '네이버 로그인',
    description: '네이버 로그인을 위한 리다이렉션 API',
  })
  @ApiResponse({
    status: 302,
    description: '네이버 로그인 페이지로 리다이렉트',
  })
  async naverAuth(@Req() req) {}

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({
    summary: '네이버 로그인 콜백',
    description: '네이버 로그인 성공 후 처리',
  })
  @ApiResponse({
    status: 200,
    description: '성공적으로 프론트엔드로 리다이렉트',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async naverAuthRedirect(@Req() req, @Res() res) {
    const user = await this.service.socialLogin(req);
    if (user) {
      const tokenPair = await this.jwtAuthService.generateTokenPair(user); // 토큰 생성

      res.cookie('accessToken', tokenPair.accessToken, {
        httpOnly: true, // JavaScript에서 접근 불가 (XSS 방어)
        secure: this.service.configService.get('NODE_ENV') === 'production', // HTTPS에서만 전송
        sameSite: 'Lax', // 또는 'Strict', CSRF 방어
        maxAge: 3600000, // 1시간 (밀리초 단위) - 액세스 토큰 만료 시간에 맞춰 설정
      });

      res.cookie('refreshToken', tokenPair.refreshToken, {
        httpOnly: true, // JavaScript에서 접근 불가
        secure: this.service.configService.get('NODE_ENV') === 'production', // HTTPS에서만 전송
        sameSite: 'Lax', // 또는 'Strict'
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (밀리초 단위) - 리프레시 토큰 만료 시간에 맞춰 설정
        // path: '/api/auth', // 리프레시 토큰 재발급 엔드포인트 경로로 제한 (선택 사항)
      });

      res.redirect(
        `${this.service.configService.get(
          'FRONTEND_URL',
        )}/auth/callback?login=success`,
      );
    } else {
      res.redirect(
        `${this.service.configService.get(
          'FRONTEND_URL',
        )}/auth/callback?login=fail`,
      );
    }
  }

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({
    summary: '카카오 로그인',
    description: '카카오 로그인을 위한 리다이렉션 API',
  })
  @ApiResponse({
    status: 302,
    description: '카카오 로그인 페이지로 리다이렉트',
  })
  async kakaoAuth(@Req() req) {}

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({
    summary: '카카오 로그인 콜백',
    description: '카카오 로그인 성공 후 유저 정보를 반환합니다.',
  })
  @ApiResponse({ status: 200, description: '유저 정보 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async kakaoAuthRedirect(@Req() req, @Res() res) {
    const user = await this.service.socialLogin(req);
    if (user) {
      const tokenPair = await this.jwtAuthService.generateTokenPair(user); // 토큰 생성

      res.cookie('accessToken', tokenPair.accessToken, {
        httpOnly: true, // JavaScript에서 접근 불가 (XSS 방어)
        secure: this.service.configService.get('NODE_ENV') === 'production', // HTTPS에서만 전송
        sameSite: 'Lax', // 또는 'Strict', CSRF 방어
        maxAge: 3600000, // 1시간 (밀리초 단위) - 액세스 토큰 만료 시간에 맞춰 설정
        // path: '/',
      });

      res.cookie('refreshToken', tokenPair.refreshToken, {
        httpOnly: true, // JavaScript에서 접근 불가
        secure: this.service.configService.get('NODE_ENV') === 'production', // HTTPS에서만 전송
        sameSite: 'Lax', // 또는 'Strict'
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (밀리초 단위) - 리프레시 토큰 만료 시간에 맞춰 설정
        path: '/api/callback', // 리프레시 토큰 재발급 엔드포인트 경로로 제한 (선택 사항)
      });
      res.redirect(
        `${this.service.configService.get(
          'FRONTEND_URL',
        )}/auth/callback?login=success`,
      );
    } else {
      res.redirect(
        `${this.service.configService.get(
          'FRONTEND_URL',
        )}/auth/callback?login=fail`,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: '사용자 목록 조회' })
  @ApiResponse({ status: 200, type: [AuthEntity] })
  @ApiBearerAuth()
  findAll(): Promise<AuthEntity[]> {
    return this.service.findUserAll();
  }

  @Get(':uid')
  @ApiOperation({ summary: '사용자 상세히 조회' })
  @ApiResponse({ status: 200, type: [AuthEntity] })
  @ApiBearerAuth()
  findUserOne(@Param('uid') uid: string): Promise<AuthEntity> {
    return this.service.findUserOne(uid);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, type: AuthEntity })
  @ApiBearerAuth()
  create(@Body() dto: CreateUserInput): Promise<AuthEntity> {
    return this.service.createUser(dto);
  }

  @Patch(':uid')
  @ApiOperation({ summary: '사용자 정보 수정' })
  @ApiResponse({ status: 200, type: AuthEntity })
  @ApiBearerAuth()
  update(
    @Param('uid') uid: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<AuthEntity> {
    return this.service.updateUser(uid, updateUserDto);
  }

  @Delete(':uid')
  @ApiOperation({ summary: '사용자 삭제' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  remove(@Param('uid') uid: string): Promise<void> {
    return this.service.userDelete(uid);
  }
}
