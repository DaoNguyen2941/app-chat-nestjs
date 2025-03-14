import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ChatListener } from '../listeners/chat.listener';
import { FriendListener } from '../listeners/friend.listener';
import { EVENT_FRIEND, EVENT_CHAT } from 'src/redis/redis.constants';

@Injectable()
export class SubService implements OnModuleInit, OnModuleDestroy {
    private subscriber: Redis;

    constructor(
        @InjectRedis() private readonly redis: Redis,
        private readonly chatListener: ChatListener,
        private readonly friendListener: FriendListener,
    ) {
        this.subscriber = this.redis.duplicate(); // Kết nối riêng để subscribe
    }

    async onModuleInit() {
        this.subscribeToEvents();
    }

    private subscribeToEvents() {
        this.subscribe(EVENT_CHAT.NEW_MESSAGE, this.chatListener.receiveMessages.bind(this.chatListener));
        this.subscribe(EVENT_FRIEND.FRIEND_REQUEST, this.friendListener.receiveFriendRequest.bind(this.friendListener));
    }

    private async subscribe<T>(event: string, callback: (data: T) => void) {
        await this.subscriber.subscribe(event);
        this.subscriber.on('message', async (channel, messageData) => {
            if (channel === event) {
                try {
                    const parsedMessageData: T = JSON.parse(messageData); // Ép kiểu dữ liệu về T
                    callback(parsedMessageData);
                } catch (error) {
                    console.error(`❌ Failed to parse message from ${channel}:`, error);
                }
            }
        });
    }

    async onModuleDestroy() {
        await this.subscriber.quit();
    }
}
