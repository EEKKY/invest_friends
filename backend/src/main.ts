import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { JwtAuthGuard } from './authguard/jwt.auth';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  //사용법:@Public()
  // const reflector = app.get(Reflector);
  // app.useGlobalGuards(new JwtAuthGuard(reflector));

  // set swagger in development mode
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Invest friends API')
      .setDescription('The invest friends API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
