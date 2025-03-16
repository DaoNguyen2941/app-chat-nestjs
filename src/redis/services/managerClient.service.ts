import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/redis/services/redisCache.service';
import { IExtendUserInSocket, IUserInSocket } from 'src/common/Interface';
import { enumUserStatus } from 'src/modules/chat/dto/chat.dto';
@Injectable()
export class ManagerClientSocketService {
  private readonly SESSION_PREFIX = 'ws_session:';
  private readonly LAST_SEEN_PREFIX = 'last_seen:';
  constructor(private readonly cacheService: RedisCacheService) {}

  async getLastSeenClientSocket(userId:string) {
    const data = await this.cacheService.getCache(`${this.LAST_SEEN_PREFIX}${userId}`);
    if (!data) {
      return null
    }
    return data
  }

  async setLastSeenClientSocket(userId:string, time: Date) {
    console.log('set hast last seen ' + userId);
    await this.cacheService.setCache(`${this.LAST_SEEN_PREFIX}${userId}`, time.toISOString())
  }

    /** 
   * @returns dữ liệu đầu ra là số lượng cache bị xóa
   */
  async removieLastSeenClientSocket(userId:string,): Promise<number> {
    console.log(`delete last meen userId ${userId}`);
    return await this.cacheService.deleteCache(`${this.LAST_SEEN_PREFIX}${userId}`)
  }

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
