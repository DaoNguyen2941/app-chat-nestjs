import { IsEnum } from 'class-validator';

export enum enumInvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected'
}

export class InvitationStatusDto {
    @IsEnum(enumInvitationStatus, { message: 'Trạng thái không hợp lệ' })
    status: enumInvitationStatus;
}
