import { Module, Global } from '@nestjs/common';
import { RedisModule, } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisCacheService } from './services/redisCache.service';
import { ManagerClientSocketService } from './services/managerClient.service';
import { GatewaysModule } from 'src/gateways/gateway.module';
import redisConfig from 'src/core/Configuration/config/redis.config';
@Global()
@Module({
  imports: [
    GatewaysModule,
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: `redis://${configService.get('redis.host')}:${configService.get('redis.port')}`,
      }),
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
