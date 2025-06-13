import { OmitType, PickType, } from '@nestjs/mapped-types'
import { Expose, Transform, Type } from "class-transformer";
import { IsString, IsBoolean, IsNotEmpty, IsEnum, IsArray, IsNumber, } from 'class-validator';
import { ChatGroupInfoDto } from './chatGroup.dto';
import { typeUser } from 'src/modules/user/user.dto';

export enum enumInvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected'
}

export class InvitationStatusDto {
    @IsEnum(enumInvitationStatus, { message: 'Trạng thái không hợp lệ' })
    status: enumInvitationStatus;
}

export class GroupInvitationsData {
    @Expose()
    @IsString()
    id: string;

    @Expose()
    @IsEnum(enumInvitationStatus)
    status: enumInvitationStatus;

    @Expose()
    @Type(() => typeUser)
    invitedBy: typeUser;

    @Expose()
    @Type(() => ChatGroupInfoDto)
    chatGroup: ChatGroupInfoDto;

    @Expose()
    expiredAt: Date | null;

    @Expose()
    invitee: typeUser;
}

export class PendingInvitationDto extends PickType(GroupInvitationsData,
    ['id', 'status', 'invitedBy', 'chatGroup', 'expiredAt']) { }