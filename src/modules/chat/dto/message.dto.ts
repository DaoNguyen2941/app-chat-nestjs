
import { OmitType, PickType, } from '@nestjs/mapped-types'
import { Expose, Transform, Type, } from 'class-transformer';
import { IsString, IsEmail, IsNotEmpty, IsObject, IsOptional, IsNumber, Min, Max, IsDate } from 'class-validator';
import { Chat } from '../entity/chat.entity';
import { typeUser } from 'src/modules/user/user.dto';
import { PaginationDto } from './chat.dto';

export class GetMessagesQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  })
  @IsDate()
  startCursor: Date;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : 20)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit: number;
}

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

export class MessageDataDto extends PickType(BasicMessageDataDto, ['id', 'content', 'created_At', 'author'] as const) { }

export class MessagePaginationDto {
    @Expose()
    @Type(() => MessageDataDto)
    messages: MessageDataDto[];

    @Expose()
    @Type(() => PaginationDto)
    pagination: PaginationDto;
}