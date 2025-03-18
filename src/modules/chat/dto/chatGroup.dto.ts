import { OmitType, PickType, } from '@nestjs/mapped-types'
import { Expose, Transform, Type } from "class-transformer";
import { IsString, IsArray, IsNotEmpty, ArrayNotEmpty } from 'class-validator';
import { typeUser } from 'src/modules/user/user.dto';
import { MessageDataDto } from './message.dto';

export class ChatGroupData {
    @Expose()
    @IsString()
    id: string;

    @Expose()
    @IsString()
    @IsNotEmpty()
    name: string;

    @Expose()
    @Type(() => typeUser)
    manager: typeUser;

    @Expose()
    @ArrayNotEmpty()
    @Type(() => typeUser)
    member: typeUser[];

    @Expose()
    @IsArray()
    @Type(() => MessageDataDto)
    message: MessageDataDto[];
}

export class CreateChatGroupDto  extends PickType(ChatGroupData,['name']){
    @IsArray()
    @ArrayNotEmpty()
    members: string[];
}