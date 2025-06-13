import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import databaseConfig from './config/database.config';
import mailerConfig from './config/mailer.config';
import redisConfig from './config/redis.config';
import CFConfig from './config/cf.config';
export const UseConfigModule = ConfigModule.forRoot({
    load: [databaseConfig, mailerConfig, redisConfig,CFConfig],
    isGlobal: true,
    cache: true,
    validationSchema: Joi.object({
      //http
      PORT: Joi.number().required().default(3002),
      //database
      DATABASE_HOST: Joi.string().required(),
      DATABASE_PORT: Joi.number().required(),
      DATABASE_NAME: Joi.string().required(),
      DATABASE_USER: Joi.string().required(),
      DATABASE_PASSWORD: Joi.string().required(),
      //email
      EMAIL_SERVICE: Joi.string().required(),
      EMAIL_USER: Joi.string().required(),
      EMAIL_PASSWORD: Joi.string().required(),
      MAIL_HOST:Joi.string().required(),
      MAIL_PORT: Joi.number().required(),
      MAIL_FROM: Joi.string().required(),
      //jwt
      SECRET_JWT: Joi.string().required(),
      JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
      JWT_RESET_PASSWORD:Joi.string().required(),
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.number().required(),
      JWT_EXPIRATION_TIME_DEAULT: Joi.number().required().default(900),
      //redis
      REDIS_HOST: Joi.string().required(),
      REDIS_PORT: Joi.number().required().default(6379),
      REDIS_DB: Joi.string(),
      //aws-s3
      CLOUDFLARE_ACCESS_KEY_ID: Joi.string().required(),
      CLOUDFLARE_SECRET_ACCESS_KEY:  Joi.string().required(),
      CLOUDFLARE_R2_BUCKET_NAME:  Joi.string().required(),
      CLOUDFLARE_ACCOUNT_ID: Joi.string().required(),
      ENDPOINT: Joi.string().required(),
      R2_PUBLIC_URL: Joi.string().required(),
    })
  })