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
import { UserService } from "src/modules/user/user.service";

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) { }


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
  async login(@Request() request: CustomUserInRequest): Promise<any> {
    const { user } = request;
    const { accessTokenCookie, token } = this.authService.createAuthCookie(user.id, user.account, user.avatar);
    const { RefreshTokenCookie, refreshToken } = this.authService.createRefreshCookie(user.id, user.account, user.avatar)
    await this.userService.setRefreshToken(refreshToken, user.id);
    request.res.setHeader('Set-Cookie', [accessTokenCookie, RefreshTokenCookie]);
    return {
      user: user,
      token: token
    };
  }

  @SkipAuth()
  @UseGuards(JwtRefreshGuard)
  @Get('/refresh')
  refresh(@Request() request: CustomUserInRequest) {
    const { user } = request;
    const { accessTokenCookie, token } = this.authService.createAuthCookie(user.id, user.account, user.avatar);
    request.res.setHeader('Set-Cookie', accessTokenCookie);
    return ({
      token: token,
      message: 'Token refreshed successfully',
    });
  }

  @SkipAuth()
  @Post('/register')
  async register2(@Body() data: RegisterDto): Promise<RegisterResponseDto> {
    const userNew = await this.authService.register(data)
    await this.authService.emailAuthentication(data.email)
    return userNew
  }

  @SkipAuth()
  @Post('/register/verify-otp')
  async confirmOtp2(@Body() confirmOtpData: ConfirmOtpDto) {
    return await this.authService.verifyOTP2(confirmOtpData)
  }

}
