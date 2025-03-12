import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { IExtendUserInSocket, IUserInSocket } from 'src/common/Interface';

@Injectable()
export class ManagerClientSocketService {
  private readonly SESSION_PREFIX = 'ws_session:'; // Tiền tố cho session WebSocket

  constructor(private readonly redisService: RedisService) {}

  async addClientSocket(userId: string, value: IUserInSocket): Promise<void> {
    await this.redisService.setCache(`${this.SESSION_PREFIX}${userId}`, value); // Hết hạn sau 1 giờ
  }

  async getSocketInfo(userId: string): Promise<IUserInSocket | null> {
    return await this.redisService.getCache<IUserInSocket>(`${this.SESSION_PREFIX}${userId}`);
  }

  async removeClientSocket(userId: string): Promise<void> {
    try {
      await this.redisService.deleteCache(`${this.SESSION_PREFIX}${userId}`);
    } catch (error) {
      console.log(error);
    }
  }

  async isClientConnected(userId: string): Promise<boolean> {
    return await this.redisService.exists(`${this.SESSION_PREFIX}${userId}`);
  }
}
