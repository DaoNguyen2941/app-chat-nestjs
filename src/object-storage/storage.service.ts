import { Injectable, Inject, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import { Files } from './entity/file.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {

  constructor(
    @InjectRepository(Files)
    private filesRepository: Repository<Files>,
    @Inject('R2_S3_CLIENT') private readonly s3: S3Client,
    private readonly configService: ConfigService,
  ) { }

async getUserAvatar(userId: string): Promise<Files | null> {
  try {
    const file = await this.filesRepository.findOne({
      where: {
        author: { id: userId },
      },
    });

    return file;
  } catch (error) {
    console.error('Failed to get user avatar:', error);
    throw new InternalServerErrorException('Failed to retrieve user avatar');
  }
}


  async uploadImage(file: Express.Multer.File, userId: string, key?: string,) {
    try {
      const bucketName = this.configService.get('cfR2.bucketName');
      const endpoint = this.configService.get('cfR2.endpoint');
      const publicUrl = this.configService.get('cfR2.publicUrl');
      const finalKey =
        key ||
        `images/${new Date().toISOString().split('T')[0]}/${uuidv4()}-${file.originalname}`;

      const upload = await this.s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: finalKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const url = `${publicUrl}/${finalKey}`;

      const dataFile = this.filesRepository.create({
        key: finalKey,
        url: url,
        mimetype: file.mimetype,
        size: file.size,
        originalName: file.originalname,
        author: { id: userId },
      });

      const savedFile = await this.filesRepository.save(dataFile);
      return savedFile;

    } catch (error) {
      console.error('Upload image failed:', error);
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.configService.get('cfR2.bucketName'),
      Key: key,
    }));
    await this.filesRepository.delete({key: key})
  }
}
