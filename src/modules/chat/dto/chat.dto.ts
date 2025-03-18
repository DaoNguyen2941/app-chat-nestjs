
import { OmitType, PickType, } from '@nestjs/mapped-types'
import { Expose, Transform, Type } from "class-transformer";
import { IsString, IsEmail, IsNotEmpty, IsEnum, IsArray, IsNumber,  } from 'class-validator';
import { typeUser } from 'src/modules/user/user.dto';
import { MessageDataDto } from './message.dto'

export enum enumUserStatus {
    online = 'online',
    offline = 'offline'
  }

export class CreateChatDto2 {
    @Expose()
    @IsString()
    receiverId: string;
}

export class ResCreateChatDto {
    @Expose()
    id: string;

    @Expose()
    @Transform(({ obj }) => {
        if (!obj.sender || !obj.receiver || !obj.userId) return null;
        return obj.sender.id === obj.userId ? obj.receiver : obj.sender;
    })
    user: typeUser
}

export class ChatData {
    @Expose()
    @IsString()
    id: string;

    @Expose()
    @IsString()
    sender: typeUser;

    @Expose()
    @IsString()
    @Type(() => typeUser)
    receiver: typeUser;

    @Expose()
    @IsArray()
    @Type(() => MessageDataDto) 
    message: MessageDataDto[];
}

export class ChatDataDto extends PickType(ChatData, ['id', 'message'] as const ) {
    @Expose()
    @Transform(({ obj }) => {
        if (!obj.sender || !obj.receiver || !obj.userId) return null;
        return obj.sender.id === obj.userId ? obj.receiver : obj.sender;
    })
    user: typeUser;
}

export class Chats extends PickType(ChatData, ['id']) {
    user: typeUser
}

export class listChatDto {
    @Expose()
    @Transform(({ obj, value }) => {
        return obj.chat.id
    })
    id: string;

    @Expose()
    @Transform(({ obj, value }) => {
        // Xác định người còn lại trong cuộc trò chuyện
        const userId = obj.currentUserId; // Lấy userId từ context (truyền vào từ service)
        const otherUser = obj.chat.sender.id === userId ? obj.chat.receiver : obj.chat.sender;

        return {
            id: otherUser.id,
            account: otherUser.account,
            avatar: otherUser.avatar,
            name: otherUser.name
        };
    })
    user: typeUser;

    @Expose()
    @IsNumber()
    @Transform(({ obj, value }) => {
        return obj.unreadCount
    })
    unreadCount: number

    @Expose()
    @IsEnum(enumUserStatus)
    status: 'online' | 'offline';

    @Expose()
    lastSeen: Date | null
}

