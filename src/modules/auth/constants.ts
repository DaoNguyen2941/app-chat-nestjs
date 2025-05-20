import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
config();
export const jwtConstants = {
    secret:new ConfigService().get<string>('SECRET_JWT'),
    expirationTime: new ConfigService().get<number>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
    refreshTokenSecret: new ConfigService().get<string>('JWT_REFRESH_TOKEN_SECRET') ,
    expirationTimeDefault: new ConfigService().get<number>('JWT_EXPIRATION_TIME_DEAULT'),
    resetPasswordSecret: new ConfigService().get<string>('JWT_RESET_PASSWORD') ,
  }; 