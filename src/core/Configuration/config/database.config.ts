import { registerAs } from "@nestjs/config";
import { config } from 'dotenv';

config();
export default registerAs('db', () => ({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
  }));