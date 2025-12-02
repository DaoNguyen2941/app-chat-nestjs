import { Module, Global } from '@nestjs/common';
import { RedisModule, } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from './services/redisCache.service';
import { ManagerClientSocketService } from './services/managerClient.service';
import { GatewaysModule } from 'src/gateways/gateway.module';

@Global()
@Module({
  imports: [
    GatewaysModule,
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('redis.host');
        const port = configService.get<string>('redis.port');
        const password = configService.get<string>('redis.password');
        const url = password
          ? `redis://:${password}@${host}:${port}`
          : `redis://${host}:${port}`
        return {
          type: 'single',
          url,
        };
      },
    }),
  ],
  exports: [
    RedisCacheService,
    ManagerClientSocketService,
    // PubService,
  ],
  providers: [
    RedisCacheService,
    ManagerClientSocketService,
    // SubService,
    // PubService,
    // ChatListener,
    // FriendListener,
  ]
})
export class CustomRedisModule { }
