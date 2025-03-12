import { registerAs } from "@nestjs/config";

export default registerAs('redis', () => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT,
    db: process.env.REDIS_DB
  }));