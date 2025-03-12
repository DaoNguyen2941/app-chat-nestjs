import { Module } from '@nestjs/common';
import { RedisModule, } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { ManagerClientSocketService } from './managerClient.service';
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule để lấy biến môi trường
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        host: configService.get('redis.host'),
        port: configService.get<number>('redis.port', 6379),
        db: configService.get<number>('redis.db'),
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [RedisModule, RedisService, ManagerClientSocketService], 
  providers: [RedisService, ManagerClientSocketService]
})
export class CustomRedisModule {}
