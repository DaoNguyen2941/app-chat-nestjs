import { SharedBullAsyncConfiguration } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const BullConfig: SharedBullAsyncConfiguration = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    // Lấy các giá trị từ ConfigService
    const host = configService.get<string>('redis.host');
    const port = configService.get<number>('redis.port');
    const db = configService.get<number>('redis.db');

    // Thêm dòng log tại đây để kiểm tra
    console.log(`[BullConfig] Kết nối Redis Host: ${host}, Port: ${port}, DB: ${db}`);

    return {
      redis: {
        host: host,
        port: port,
        db: db,
      },
    };
  },
};
