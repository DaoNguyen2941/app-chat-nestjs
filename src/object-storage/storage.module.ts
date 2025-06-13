import { Module } from '@nestjs/common';
import { R2ClientProvider } from './providers/r2.client';
import { StorageService } from './storage.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Files } from './entity/file.entity';
 
@Module({
  imports: [
    TypeOrmModule.forFeature([Files]),
  ],
  providers: [R2ClientProvider, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
