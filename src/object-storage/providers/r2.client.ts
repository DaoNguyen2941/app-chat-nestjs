import { Provider } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export const R2ClientProvider: Provider = {
  provide: 'R2_S3_CLIENT',
  useFactory: (configService: ConfigService) => {

    const accessKeyId = configService.get<string>('cfR2.accessId');
    const secretAccessKey = configService.get<string>('cfR2.secretKey');
    const accountId = configService.get<string>('cfR2.accountId');

    if (!accessKeyId || !secretAccessKey || !accountId) {
      throw new Error('Missing Cloudflare R2 configuration in environment variables');
    }

    return new S3Client({
      region: 'auto',
      endpoint: configService.get<string>('cfR2.endpoint'),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  },
  inject: [ConfigService],
};
