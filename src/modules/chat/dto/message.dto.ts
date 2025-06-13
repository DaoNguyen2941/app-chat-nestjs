
import { OmitType, PickType, } from '@nestjs/mapped-types'
import { Expose, Transform, Type } from 'class-transformer';
import { IsString, IsEmail, IsNotEmpty, IsObject } from 'class-validator';
import { Chat } from '../entity/chat.entity';
import { typeUser } from 'src/modules/user/user.dto';
import { plainToInstance } from 'class-transformer';

class BasicMessageDataDto {
    @Expose()
    @IsString()
    id: string;

    @Expose()
    @IsString()
    content: string;

    @Expose()
    @IsObject()
    @Type(() => typeUser)
    author: typeUser

    @Expose()
    @IsObject()
    chat: Chat

    @Expose()
    created_At: Date
}

export class createMesagerDto extends PickType(BasicMessageDataDto, [`content`]) { }

export class MessageDataDto extends PickType(BasicMessageDataDto, ['id', 'content', 'created_At', 'author'] as const) {}