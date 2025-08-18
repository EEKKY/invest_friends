import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { JwtAuthGuard } from './authguard/jwt.auth';
// import { GlobalExceptionFilter } from './common/http-service/error_handler/global-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global exception filter
  // app.useGlobalFilters(new GlobalExceptionFilter());

  //사용법:@Public()
  // const reflector = app.get(Reflector);
  // app.useGlobalGuards(new JwtAuthGuard(reflector));

  // set swagger in development mode
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Invest Friends API')
      .setDescription('투자 친구들 - 한국 주식시장 분석 및 재무제표 시각화 API')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('agentica', '🤖 AI 자연어 API - Agentica를 통한 자연어 처리')
      .addTag('auth', '인증 관련 API')
      .addTag('login', '로그인/토큰 관리')
      .addTag('social', '소셜 로그인')
      .addTag('kis', 'KIS 증권 API')
      .addTag('chart', '차트 데이터')
      .addTag('dart', 'DART 재무제표')
      .addServer('http://localhost:3000', 'Local Development Server')
      .addServer('https://api.investfriends.kr', 'Production Server')
      .setContact(
        'Invest Friends Team',
        'https://investfriends.kr',
        'support@investfriends.kr'
      )
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
