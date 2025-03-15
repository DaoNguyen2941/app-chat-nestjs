import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser'
import { WebSocketAdapter } from './gateways/adapters';
import { ManagerClientSocketService } from './redis/services/managerClient.service';
import { JwtService } from '@nestjs/jwt';
import { Queue } from 'bull';
import { JOB_USER } from './modules/queue/queue.constants';
async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  const configService = app.get(ConfigService);
  const socketClientService = app.get(ManagerClientSocketService);
const jwtService = app.get(JwtService);
const userQueue = app.get<Queue>(`BullQueue_${JOB_USER.NAME}`);
const wsAdapter = new WebSocketAdapter(socketClientService, jwtService, userQueue);

app.useWebSocketAdapter(wsAdapter);
  app.use(cookieParser());
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

