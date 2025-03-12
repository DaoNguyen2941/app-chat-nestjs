
import { OmitType, PickType, } from '@nestjs/mapped-types'
import { Expose, Transform, Type } from "class-transformer";
import { IsString, IsEmail, IsNotEmpty, IsObject, IsArray, IsNumber,  } from 'class-validator';
import { any } from 'joi';
import { typeUser } from 'src/modules/user/user.dto';
import { MessageData } from './message.dto'


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
    @Type(() => MessageData)  // Bổ sung Type cho mảng
    message: MessageData[];
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
}

