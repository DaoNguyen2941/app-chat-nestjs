import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env' });
const configService = new ConfigService();
import { CreateTableGroupInvitations1742747077532 } from './migrations/1742747077532-CreateTableGroupInvitations';
const dataSource = new DataSource({
  type: 'mysql',  
  host: configService.get<string>('DATABASE_HOST'),
  port: configService.get<number>('DATABASE_PORT'),
  username: configService.get<string>('DATABASE_USER'),
  password: configService.get<string>('DATABASE_PASSWORD'),
  database: configService.get<string>('DATABASE_NAME'),
  entities: [
    "dist/**/*.entity{.ts,.js}",
    "dist/**/entity/*.entity{.ts,.js}",
  ],
  migrations: [CreateTableGroupInvitations1742747077532],
  migrationsRun: true,
  synchronize: false,  // Chỉ đặt thành true trong môi trường phát triển,nếu dùng migration thì không để true
});

export default dataSource;
