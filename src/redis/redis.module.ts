import { Module, Global } from '@nestjs/common';
import { RedisModule, } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisCacheService } from './services/redisCache.service';
import { ManagerClientSocketService } from './services/managerClient.service';
import { GatewaysModule } from 'src/gateways/gateway.module';
@Global()
@Module({
  imports: [
    GatewaysModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        host: configService.get('redis.host'),
        port: configService.get<number>('redis.port', 6379),
        db: configService.get<number>('redis.db'),
      }),
      inject: [ConfigService],

    }),
  ],
  exports: [
    RedisCacheService,
    ManagerClientSocketService,
  ],
  providers: [
    RedisCacheService,

    {
      provide: ManagerClientSocketService,
      useClass: ManagerClientSocketService,
    },
  ]
})
export class CustomRedisModule { }
