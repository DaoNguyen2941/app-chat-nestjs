
import { OmitType, PickType } from '@nestjs/mapped-types'
import { Expose, Transform } from 'class-transformer';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { IsNotEqualTo } from 'src/common/decorate/IsNotEqualTo';
import { ApiProperty } from '@nestjs/swagger';

export class BasicUserDataDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '12345', description: 'ID của người dùng' })

  id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'Ảnh đại diện' })
  avatar: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Tên người dùng' })
  name: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'nguyenvana', description: 'Tài khoản đăng nhập' })
  account: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'StrongPassword123', description: 'Mật khẩu' })
  password: string;

  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'user@example.com', description: 'Email người dùng' })
  email: string;

  @Expose()
  @IsString()
  @ApiProperty({ example: 'refresh_token_xyz', description: 'Refresh token' })
  refresh_token: string;
}


export class NameUserDto extends PickType(BasicUserDataDto, ['name']) { }
export class userDataDto extends OmitType(BasicUserDataDto, ['password', 'refresh_token',] as const) { };
export class typeUser extends PickType(BasicUserDataDto, ['id', 'avatar', 'name',] as const) { }

export class searchAccountOrEmailDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'abc', description: 'Từ khó tìm kiếm' })
  keyword: string;
}

export class dataUpdatePasswordDto extends PickType(BasicUserDataDto, ['password'] as const) {
  @IsString()
  @IsNotEmpty()
  @IsNotEqualTo('password', { message: 'Mật khẩu mới không được giống mật khẩu cũ' })
  @ApiProperty({ example: 'newPassword', description: 'Mật khẩu mới' })
  newPassword: string;
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
  @ApiProperty({ example: '123456', description: 'Mã xác nhận được gửi tới email người dùng' })
  OTP: string;
}

export class resetPasswordDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'password', description: 'Mật khẩu mới sau khi đặt lại' })
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
  @ApiProperty({ example: '', description: 'Thông tin trạng tái bạn bè' })
  statusFriend: { id: string; status: string; senderId: string } | null;
}