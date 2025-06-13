
import { OmitType, PickType, } from '@nestjs/mapped-types'
import { Expose, Transform, Type } from "class-transformer";
import { IsString, IsBoolean, IsNotEmpty, IsEnum, IsArray, IsNumber, } from 'class-validator';
import { typeUser } from 'src/modules/user/user.dto';
import { MessageDataDto } from './message.dto'
import { plainToInstance } from 'class-transformer';

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
    @Type(() => typeUser)
    sender: typeUser;

    @Expose()
    @Type(() => typeUser)
    receiver: typeUser;

    @Expose()
    @IsArray()
    @Type(() => MessageDataDto)
    message: MessageDataDto[];

    @Expose()
    @IsEnum(enumUserStatus)
    status: 'online' | 'offline';

    @Expose()
    lastSeen: Date | null

    @Expose()
    @IsBoolean()
    isGroup: boolean;

    @Expose()
    @Type(() => typeUser)
    members: typeUser[];

    @Expose()
    name: string | null
}

export class ChatDataDto extends PickType(ChatData, ['id', 'isGroup', 'name', 'members'] as const) {
    @Expose()
    @Transform(({ obj }) => {
        if (!obj.sender || !obj.receiver || !obj.userId) return null;
        const userRaw = obj.sender.id === obj.userId ? obj.receiver : obj.sender;
        return plainToInstance(typeUser, userRaw, { excludeExtraneousValues: true });
    })
    user: typeUser;

    @Expose()
    @Transform(({ obj }) => {
        const messages = obj.message || obj.messages || [];
        return messages.map((msg: any) =>
            plainToInstance(MessageDataDto, msg, { excludeExtraneousValues: true })
        );
    })
    @Type(() => MessageDataDto)
    message: MessageDataDto[];

}

export class Chats extends PickType(ChatData, ['id']) {
    user: typeUser
}

export class ChatGroupDto {
    @Expose()
    @IsString()
    id: string;

    @Expose()
    @IsString()
    name: string;

    @Expose()
    @IsArray()
    @IsString()
    memberAvatars: string[];

}

export class listChatDto {
    @Expose()
    @Transform(({ obj, value }) => {
        if (obj.IsGroup) {
            return obj.chatGroup.id
        }
        return obj.chat.id
    })
    id: string;

    @Expose()
    @Transform(({ obj, value }) => {
        if (obj.chat) {
            // Xác định người còn lại trong cuộc trò chuyện
            const userId = obj.currentUserId; // Lấy userId từ context (truyền vào từ service)
            const otherUser = obj.chat.sender.id === userId ? obj.chat.receiver : obj.chat.sender;
            return {
                id: otherUser.id,
                avatar: otherUser.avatar,
                name: otherUser.name
            };
        }
        return null
    })
    user: typeUser | null;

    @Expose()
    @IsNumber()
    @Transform(({ obj, value }) => {
        return obj.unreadCount
    })
    unreadCount: number

    @Expose()
    @Transform(({ obj, value }) => {
        if (obj.chatGroup) {
            return obj.chatGroup

        }
        return null
    })
    chatGroup: ChatGroupDto | null

    @Expose()
    @IsEnum(enumUserStatus)
    status: 'online' | 'offline';

    @Expose()
    lastSeen: Date | null

    @Expose()
    @IsBoolean()
    IsGroup: boolean

}

