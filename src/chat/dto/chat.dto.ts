
import { OmitType, PickType } from '@nestjs/mapped-types'
import { Expose } from 'class-transformer';
import { IsString, IsEmail, IsNotEmpty, IsObject, isString } from 'class-validator';

export class CreateChatDto {
    @Expose()
    @IsString()
    contenMessage: string;
   
    @Expose()
    @IsString()
    receiverId: string;
}