
import { ConfigService } from '@nestjs/config';
import { registerAs } from "@nestjs/config";
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from "typeorm";
import { CreateDatabase1730436286298 } from './migrations/1730436286298-CreateDatabase';
dotenvConfig({ path: '.env' });
const configService = new ConfigService();

const config = {
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
  migrations: [CreateDatabase1730436286298],
  autoLoadEntities: true,
  synchronize: false,
}

export default registerAs('typeorm', () => config)
export const connectionSource = new DataSource(config as DataSourceOptions);