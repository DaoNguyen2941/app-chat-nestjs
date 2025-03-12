import { Module, OnModuleInit  } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { DataSource } from 'typeorm';

import dataSource from './typeOrm.config';

export const UseTypeOrmModule = TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async () => ({
        ...dataSource.options,
      }),
})

// @Module({
//   imports: [
//     ConfigModule.forRoot({ isGlobal: true }), // Đảm bảo ConfigModule hoạt động trên toàn ứng dụng
//     TypeOrmModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         type: 'mysql',
//         host: configService.get<string>('DATABASE_HOST'),
//         port: configService.get<number>('DATABASE_PORT'),
//         username: configService.get<string>('DATABASE_USER'),
//         password: configService.get<string>('DATABASE_PASSWORD'),
//         database: configService.get<string>('DATABASE_NAME'),
//         autoLoadEntities: true,
//         synchronize: true, 
//         logging: true,
//       }),
//     }),
//   ],
// })
// export class UseTypeOrmModule implements OnModuleInit {
//   constructor(private dataSource: DataSource) {}

//   async onModuleInit() {
//     try {
//       console.log('Checking database connection...');
//       await this.dataSource.initialize();
//       console.log('Database connection established successfully');
//     } catch (error) {
//       console.error('Error connecting to the database:', error);
//     }
//   }
// }