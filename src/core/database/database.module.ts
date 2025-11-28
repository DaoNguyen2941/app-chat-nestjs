import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import dataSource from './typeOrm.config';

export const UseTypeOrmModule = TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: async () => ({
        ...dataSource.options,
      }),
})