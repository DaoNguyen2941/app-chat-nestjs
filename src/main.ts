import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const appOptions = { cors: true };
  const app = await NestFactory.create(AppModule,appOptions);
  const configService = app.get(ConfigService);
  app.use(cookieParser());
  const PORT = configService.get('PORT') || 3000;

  app.useGlobalPipes(new ValidationPipe({
    // xóa bỏ thuộc tính ko xác định của req (không có trong dto)
     whitelist: true,
    // ngừng sử lý req khi có các thuộc tính không xác định và gửi về lỗi
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`)
  });
}

bootstrap();
