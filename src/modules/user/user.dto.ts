
import { OmitType, PickType } from '@nestjs/mapped-types'
import { Expose, Transform  } from 'class-transformer';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { IsNotEqualTo } from 'src/common/decorate/IsNotEqualTo';
export class BasicUserDataDto
{
    @Expose()
    @IsString()
    @IsNotEmpty()
    id: string;

    @Expose()
    @IsString()
    @IsNotEmpty()
    avatar: string;

    @Expose()
    @IsString()
    @IsNotEmpty()
    name: string;
  
    @Expose()
    @IsString()
    @IsNotEmpty()
    account: string;
  
    @Expose()
    @IsString()
    @IsNotEmpty()
    password: string;

    @Expose()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @Expose()
    @IsString()
    refresh_token: string;
  }

  export class userDataDto extends OmitType(BasicUserDataDto, ['password', 'refresh_token',] as const) { };
  export class typeUser extends PickType(BasicUserDataDto, ['id', 'account', 'avatar', 'name',] as const) {}

  export class searchAccountOrEmailDto {
    @Expose()
    @IsString()
    @IsNotEmpty()
    keyword: string;
  }

  export class dataUpdatePasswordDto extends PickType(BasicUserDataDto, ['password'] as const) {
    @Expose()
    @IsString()
    @IsNotEmpty()
    @IsNotEqualTo('password', { message: 'Mật khẩu mới không được giống mật khẩu cũ' })
    passwordNew: string;
  }

  export class UserDataInReq extends Request {
    @Expose()
    @IsNotEmpty()
    user: userDataDto;
  }
  
  export class ConfirmOtpDto {
    @Expose()
    @IsNotEmpty()
    @IsString()
    OTP: string;
  } 

  export class resetPasswordDto {
    @Expose()
    @IsNotEmpty()
    @IsString()
    password: string;
  }

  export class SearchUserWithFriendStatusDto extends typeUser {
    @Expose()
    @Transform(({ obj }) => {
        if (!obj.friendId) return null; // Nếu chưa có bạn bè, trả về null
        return {
            id: obj.friendId,
            status: obj.status, // Trạng thái kết bạn
            senderId: obj.senderId // Ai là người gửi lời mời
        };
    })
    statusFriend: { id: string; status: string; senderId: string } | null;
}