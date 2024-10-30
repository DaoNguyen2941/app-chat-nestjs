
import { OmitType, PickType } from '@nestjs/mapped-types'
import { Expose} from 'class-transformer';
import { IsString, IsEmail, IsNotEmpty, IsNumber } from 'class-validator';
import { userDataDto } from 'src/user/user.dto';
import { Response } from 'express';
export class RegisterDto {

  @Expose()
  @IsNotEmpty()
  @IsString()
  account: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  password: string;

  @Expose()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class JWTPayload {
  @Expose()
  @IsNotEmpty()
  @IsString()
  account: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  sub: string;
}

export class JWTDecoded extends JWTPayload {
  @Expose()
  @IsNotEmpty()
  @IsNumber()
  iat: number;

  @Expose()
  @IsNotEmpty()
  @IsNumber()
  exp: number;
}

export class CustomUserInRequest extends Request {
  @Expose()
  @IsNotEmpty()
  user: userDataDto;

  @Expose()
  res: Response;
}

export class LoginResponseDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  access_token: string;

  @Expose()
  @IsNotEmpty()
  @IsNotEmpty()
  userData: userDataDto
}

export class RegisterResponseDto extends OmitType(RegisterDto, ['password'] as const) { }

export class ConfirmOtpDto extends PickType(RegisterDto, ['email'] as const) {
  @Expose()
  @IsString()
  OTP: string;
}