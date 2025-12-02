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
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('redis.host');
        const port = config.get<number>('redis.port');
        const password = config.get<string>('redis.password');
        const db = config.get<number>('redis.db') ?? 0;

        const url = password
          ? `redis://:${password}@${host}:${port}/${db}`
          : `redis://${host}:${port}/${db}`;

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
