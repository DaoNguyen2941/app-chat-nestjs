import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser'
import { WebSocketAdapter } from './gateways/adapters';
import { INestApplication } from '@nestjs/common';
import { ManagerClientSocketService } from './redis/services/managerClient.service';
import { Queue } from 'bull';
import { JOB_USER } from './modules/queue/queue.constants';
import { QueueModule } from './modules/queue/queue.module';
import { getQueueToken } from '@nestjs/bull';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  const configService = app.get(ConfigService);
  const clientSocket = app.get(ManagerClientSocketService);
  // const userQueue = app.get<Queue>(JOB_USER.NAME)
  const userQueue = app.select(QueueModule).get<Queue>(getQueueToken(JOB_USER.NAME));

  app.useWebSocketAdapter(new WebSocketAdapter(clientSocket, userQueue, app));
  app.use(cookieParser());
  const PORT = configService.get('PORT') || 3001;
  app.useGlobalPipes(new ValidationPipe({
    // xóa bỏ thuộc tính ko xác định của req (không có trong dto)
    whitelist: true,
    // ngừng sử lý req khi có các thuộc tính không xác định và gửi về lỗi
    forbidNonWhitelisted: true,
    transform: true,
  }));
  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
    
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(PORT, () => {
    console.log(`app listening on port ${PORT} ❤️`)
  })
}
bootstrap();

