import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from 'src/redis/services/redisCache.service';
import { IUserInSocket } from 'src/common/interface/Interface';
import { enumUserStatus } from 'src/modules/chat/dto/chat.dto';
@Injectable()
export class ManagerClientSocketService {
  private readonly logger = new Logger(ManagerClientSocketService.name);
  private readonly SESSION_PREFIX = 'ws_session:';
  private readonly LAST_SEEN_PREFIX = 'last_seen:';
  constructor(private readonly cacheService: RedisCacheService) { }

  async getLastSeenClientSocket(userId: string) {
    const data = await this.cacheService.getCache<{ lastSeen: string }>(`${this.LAST_SEEN_PREFIX}${userId}`);
    if (!data) {
      return null
    }
    return new Date(data.lastSeen)
  }

  async setLastSeenClientSocket(userId: string, time: Date) {
    const value: { lastSeen: string } = {
      lastSeen: time.toISOString()
    }
    await this.cacheService.setCache(`${this.LAST_SEEN_PREFIX}${userId}`, value)
  }

  /** 
 * @returns dữ liệu đầu ra là số lượng cache bị xóa
 */
  async removieLastSeenClientSocket(userId: string,): Promise<number> {
    return await this.cacheService.deleteCache(`${this.LAST_SEEN_PREFIX}${userId}`)
  }

  async UserStatus(userId: string): Promise<enumUserStatus> {
    const session = await this.cacheService.getCache<IUserInSocket>(`${this.SESSION_PREFIX}${userId}`);
    return session ? enumUserStatus.online : enumUserStatus.offline // Nếu có session => online, nếu không => offline
  }

  async addClientSocket(userId: string, value: IUserInSocket): Promise<void> {
    await this.cacheService.setCache(`${this.SESSION_PREFIX}${userId}`, value); // Hết hạn sau 1 giờ
  }

  async getSocketInfo(userId: string): Promise<IUserInSocket | null> {
    return await this.cacheService.getCache<IUserInSocket>(`${this.SESSION_PREFIX}${userId}`);
  }

  async getSocketInfos(userId: string[]): Promise<(IUserInSocket[] | null)[]> {
    const listKey = userId.map((id) => `${this.SESSION_PREFIX}${id}`)
    return await this.cacheService.mGetCache<IUserInSocket[]>(listKey);
  }

  async removeClientSocket(userId: string): Promise<void> {
    try {
      await this.cacheService.deleteCache(`${this.SESSION_PREFIX}${userId}`);
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa socket session cho userId: ${userId}`,
        error.stack || error.message,
      );
    }
  }

  async isClientConnected(userId: string): Promise<boolean> {
    return await this.cacheService.exists(`${this.SESSION_PREFIX}${userId}`);
  }
}
