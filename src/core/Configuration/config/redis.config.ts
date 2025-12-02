import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT!, 10),
  db: parseInt(process.env.REDIS_DB!, 10) || 0,
  password: process.env.password || null
}));
