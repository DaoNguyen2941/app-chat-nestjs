import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser'
import { WebSocketAdapter } from './gateways/adapters';
import { INestApplication } from '@nestjs/common';
import { ManagerClientSocketService } from './redis/services/managerClient.service';
async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  const configService = app.get(ConfigService);
  const clientSocket = app.get(ManagerClientSocketService);
  const webSocketAdapter = app.get(WebSocketAdapter); // Lấy instance từ DI
  app.useWebSocketAdapter(webSocketAdapter);  app.use(cookieParser());
  const PORT = configService.get('PORT') || 3001;
  app.useGlobalPipes(new ValidationPipe({
    // xóa bỏ thuộc tính ko xác định của req (không có trong dto)
    whitelist: true,
    // ngừng sử lý req khi có các thuộc tính không xác định và gửi về lỗi
    forbidNonWhitelisted: true,
    transform: true,
  }));
  await app.listen(PORT, () => {
    console.log(`app listening on port ${PORT} ❤️`)
  })
}
bootstrap();

