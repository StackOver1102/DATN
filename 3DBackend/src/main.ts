import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:4000',
      'http://frontend:3000',
      'http://dashboard:4000',
      'https://yourdomain.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  // Set global prefix for all routes
  app.setGlobalPrefix('api/v1');
  // Enable validation pipes globally
  app.useGlobalPipes(new ValidationPipe());

  // Apply JWT authentication globally
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Apply transform interceptor globally
  app.useGlobalInterceptors(new TransformInterceptor());

  // Apply exception filter globally (except for VQR module)
  const httpExceptionFilter = new HttpExceptionFilter();
  app.useGlobalFilters({
    catch(exception: any, host: any) {
      const ctx = host.switchToHttp();
      const req = ctx.getRequest();
      // Skip VQR module
      if (req.url.startsWith('/api/v1/vqr')) {
        return;
      }
      return httpExceptionFilter.catch(exception, host);
    }
  });

  // Tạo thư mục uploads nếu chưa tồn tại
  const uploadsDir = join(process.cwd(), 'uploads');
  const imagesDir = join(uploadsDir, 'images');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Phục vụ các file tĩnh từ thư mục uploads
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads',
  });

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('3D Backend API')
    .setDescription('API documentation for 3D Backend application')
    .setVersion('1.0')
    .addTag('3d-backend')
    .addBearerAuth() // Add bearer auth support to Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') || 5000;
  const host = configService.get<string>('HOST') || '0.0.0.0';
  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}`);
}
bootstrap();
