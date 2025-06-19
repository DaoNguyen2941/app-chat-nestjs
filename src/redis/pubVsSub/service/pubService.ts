import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class PubService {
    constructor(@InjectRedis() private readonly redis: Redis) {}
    
    async publishEvent<T>(event: string, data: T) {
        const messageData = JSON.stringify(data);
        await this.redis.publish(event, messageData);
    }
}
