import { registerAs } from "@nestjs/config";
import { config } from 'dotenv';

config();
export default registerAs('mailer', () => ({
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD
  }));