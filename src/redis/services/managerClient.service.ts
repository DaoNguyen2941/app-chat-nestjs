import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/redis/services/redisCache.service';
import { IExtendUserInSocket, IUserInSocket } from 'src/common/Interface';
import { enumUserStatus } from 'src/modules/chat/dto/chat.dto';
@Injectable()
export class ManagerClientSocketService {
  private readonly SESSION_PREFIX = 'ws_session:'; // Tiền tố cho session WebSocket

  constructor(private readonly cacheService: RedisCacheService) {}

  async UserStatus(userId: string): Promise<enumUserStatus> {
    const session = await this.cacheService.getCache<IUserInSocket>(`${this.SESSION_PREFIX}${userId}`);
    console.log(session);
    
    return session ? enumUserStatus.online : enumUserStatus.offline // Nếu có session => online, nếu không => offline
  }

  async addClientSocket(userId: string, value: IUserInSocket): Promise<void> {
    await this.cacheService.setCache(`${this.SESSION_PREFIX}${userId}`, value); // Hết hạn sau 1 giờ
  }

  async getSocketInfo(userId: string): Promise<IUserInSocket | null> {
    return await this.cacheService.getCache<IUserInSocket>(`${this.SESSION_PREFIX}${userId}`);
  }

  async removeClientSocket(userId: string): Promise<void> {
    try {
      await this.cacheService.deleteCache(`${this.SESSION_PREFIX}${userId}`);
    } catch (error) {
      console.log(error);
    }
  }

  async isClientConnected(userId: string): Promise<boolean> {
    return await this.cacheService.exists(`${this.SESSION_PREFIX}${userId}`);
  }
}
