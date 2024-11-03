import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const UseTypeOrmModule = TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => (
        {
        type: 'mysql',
        host: configService.get<string>('db.host'),
        port: configService.get<number>('db.port'),
        username: configService.get<string>('db.user'),
        password: configService.get<string>('db.password'),
        database: configService.get<string>('db.database'),
        autoLoadEntities: true,
        synchronize: false,
    }
),
})