
import { OmitType, PickType,  } from '@nestjs/mapped-types'
import { Expose, Transform, Type } from 'class-transformer';
import { IsString, IsEmail, IsNotEmpty, IsObject } from 'class-validator';
import { Users } from 'src/modules/user/entity/user.entity';
import { Chat } from '../entity/chat.entity';
import { create } from 'domain';
import { typeUser } from 'src/modules/user/user.dto';

class BasicMessageDataDto {
    @Expose()
    @IsString()
    id: string;

    @Expose()
    @IsString()
    content : string;

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

export class createMesagerDto extends PickType(BasicMessageDataDto, [`content`]) {}

export class MessageDataDto extends PickType(BasicMessageDataDto, ['id', 'author', 'content','created_At']) {};

export class OutgoingMessageDataDto {
    messageData: MessageDataDto;
    chatId:string;
    receiverId:string;
    isNewChat: boolean
}