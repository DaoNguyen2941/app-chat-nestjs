import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService {
  constructor(@InjectRedis() private readonly redis: Redis) {}


  async getHsetCache(key: string, value: string,) {
    return await this.redis.hget(key, value)
  }

    /** 
   * Lưu cache vào Redis 
   * @param key - Khóa lưu cache
   * @param value - thuộc tính của value cần xóa
   */
  async deleteHsetCache(key: string, value: string,): Promise<number> {
    return await this.redis.hdel(key, value)
  }
    /** 
   * Lưu cache vào Redis 
   * @param key - Khóa lưu cache
   * @param value - Dữ liệu cần lưu
   */
  async setHsetCache(key: string, value: object,) {
    await this.redis.hset(key,value)
  }

  /** 
   * Lưu cache vào Redis 
   * @param key - Khóa lưu cache
   * @param value - Dữ liệu cần lưu
   * @param ttl - Thời gian hết hạn (giây) (mặc định: 1 giờ)
   */
  async setCache(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  /** 
   * Lấy cache từ Redis 
   * @param key - Khóa cần lấy dữ liệu
   * @returns Dữ liệu đã lưu hoặc null nếu không tồn tại
   */
  async getCache<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /** 
   * Xóa cache theo key 
   * @param key - Khóa cần xóa
   */
  async deleteCache(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /** 
   * Kiểm tra khóa có tồn tại trong Redis không 
   * @param key - Khóa cần kiểm tra
   * @returns `true` nếu tồn tại, `false` nếu không
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result > 0;
  }

  /** 
   * Đếm số lượng key trong Redis 
   * @returns Tổng số lượng key đang lưu
   */
  async countKeys(): Promise<number> {
    const keys = await this.redis.keys('*');
    return keys.length;
  }
}
