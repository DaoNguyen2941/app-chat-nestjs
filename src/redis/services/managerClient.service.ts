import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/redis/services/redisCache.service';
import { IExtendUserInSocket, IUserInSocket } from 'src/common/Interface';
import { UserStatus } from 'src/modules/chat/dto/chat.dto';

@Injectable()
export class ManagerClientSocketService {
  private readonly SESSION_PREFIX = 'ws_session:';
  private readonly LAST_SEEN_PREFIX = 'last_seen:';

  constructor(private readonly cacheService: RedisCacheService) {}

  async getLastSeenClientSocket(userId:string) {
    const data = await this.cacheService.getHsetCache(this.LAST_SEEN_PREFIX, userId);
    if (!data) {
      return null
    }
    return new Date(data);
  }

  async setLastSeenClientSocket(userId:string, time:Date) {
    const value = {
      userId,
      time: time.toISOString() 
    }
    await this.cacheService.setHsetCache(this.LAST_SEEN_PREFIX, value)
  }

  async removieLastSeenClientSocket(userId:string,) {
    await this.cacheService.deleteHsetCache(this.LAST_SEEN_PREFIX, userId)
  }
  
  async addClientSocket(userId: string, value: IUserInSocket): Promise<void> {
    await this.cacheService.setCache(`${this.SESSION_PREFIX}${userId}`, value); 
  }

  async UserStatus(userId: string): Promise<UserStatus> {
    const session = await this.cacheService.getCache(`${this.SESSION_PREFIX}${userId}`);
    return session ? UserStatus.online : UserStatus.offline // Nếu có session => online, nếu không => offline
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
