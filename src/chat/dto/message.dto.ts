
import { OmitType, PickType } from '@nestjs/mapped-types'
import { Expose } from 'class-transformer';
import { IsString, IsEmail, IsNotEmpty, IsObject } from 'class-validator';
import { Users } from 'src/user/user.entity';
import { Chat } from '../chat.entity';
import { create } from 'domain';
class BasicMessageDataDto {
    @Expose()
    @IsString()
    id: string;

    @Expose()
    @IsString()
    content : string;

    @Expose()
    @IsObject()
    author: Users

    @Expose()
    @IsObject()
    chat: Chat

}

export class createMesagerDto extends PickType(BasicMessageDataDto, [`content`]) {
    @Expose()
    @IsString()
    authorId: string;

    @Expose()
    @IsString()
    chatId: string;

}