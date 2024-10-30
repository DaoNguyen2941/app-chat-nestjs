import {
  Controller,
  Body,
  Post,
  UseGuards,
  Request,
  Get,
  HttpCode,
} from "@nestjs/common";

import {
  RegisterDto,
  RegisterResponseDto,
  ConfirmOtpDto,
  CustomUserInRequest,

} from "./auth.dto";
import { AuthService } from "./auth.service";
import { SkipAuth } from "src/common/decorate/skipAuth";
import { LocalAuthGuard } from "./guard/local-auth.guard";
import JwtRefreshGuard from "./guard/Jwt-Refresh.guard";
import { UserService } from "src/user/user.service";
import { userDataDto } from "src/user/user.dto";
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) { }

  @HttpCode(200)
  @Post('/logout')
  async logour(@Request() request: CustomUserInRequest) {
    await this.userService.removeRefreshToken(request.user.id)
    request.res.clearCookie('Refresh', {
      path: '/auth/refresh'
    });
    request.res.clearCookie('Authentication');
    return {
      message: 'logout successfully'
    }
  }


  @SkipAuth()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() request: CustomUserInRequest): Promise<userDataDto> {
    const { user } = request;
    const accessTokenCookie = this.authService.createAuthCookie(user.id, user.account);
    const { RefreshTokenCookie, refreshToken } = this.authService.createRefreshCookie(user.id, user.account)
    await this.userService.setRefreshToken(refreshToken, user.id);
    request.res.setHeader('Set-Cookie', [accessTokenCookie, RefreshTokenCookie]);
    return user;
  }

  @SkipAuth()
  @UseGuards(JwtRefreshGuard)
  @Get('/refresh')
  refresh(@Request() request: CustomUserInRequest) {
    const { user } = request;
    const accessTokenCookie = this.authService.createAuthCookie(user.id, user.account);
    request.res.setHeader('Set-Cookie', accessTokenCookie);
    return ({
      message: 'Token refreshed successfully',
    });
  }

  @SkipAuth()
  @Post('/register')
  async register(@Body() data: RegisterDto): Promise<RegisterResponseDto> {
    const userNew = await this.authService.register(data)
    await this.authService.authGmail(data.email)
    return userNew
  }

  @SkipAuth()
  @Post('/verify-otp')
  async confirm(@Body() confirmOtpData: ConfirmOtpDto) {
    return await this.authService.verifyOTP(confirmOtpData)
  }

}
