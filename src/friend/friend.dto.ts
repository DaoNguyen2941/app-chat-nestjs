import {
    IsEmail,
    IsNotEmpty,
    Length,
    IsString,
    IsObject,
    IsEnum,
    validate,
    IsPhoneNumber,
    IsDate,
    IsBoolean,
    isString,
    isEnum
} from 'class-validator';
import { Expose, Transform, plainToInstance } from 'class-transformer';
import { StatusFriend } from './constants';
import { OmitType, PickType } from '@nestjs/mapped-types'
import { typeUser } from "src/user/user.dto";

export class BasicFriendDto {
    @Expose()
    @IsString()
    @IsNotEmpty()
    id: string;

    @Expose()
    @IsObject()
    sender: typeUser;

    @Expose()
    @IsObject()
    receiver: typeUser;

    @Expose()
    @IsEnum(StatusFriend)
    status: string;
}

export class updateFriendDto extends PickType(
    BasicFriendDto, ["status", "id"] as const
) { }

export class FrienDataDto extends PickType (
    BasicFriendDto, [`id`, 'status'] as const
) {
    @Transform(({ obj }) => plainToInstance(typeUser, obj.receiver))
    @Expose()
    receiver: typeUser;
}

export class CreateFriendDto {
    @Expose()
    @IsString()
    receiverId : string
}

export class ListFriendDto extends PickType(
    BasicFriendDto, ["id", "status",] as const
) {
    @Transform(({ obj }) => plainToInstance(typeUser, obj.receiver,
        { excludeExtraneousValues: true }
    ))
    @Expose()
    user: typeUser;
}

export class FriendRequestDto extends PickType(
    BasicFriendDto, ["id", "status",] as const
) {
    @Transform(({ obj }) => plainToInstance(typeUser, obj.sender,
        { excludeExtraneousValues: true }
    ))
    @Expose()
    sender: typeUser;
}