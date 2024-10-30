import {
    Controller,
    Request,
    Get,
    Post,
    Body,
    UseGuards,
    HttpException,
    HttpStatus,
} from "@nestjs/common";
import { UserService } from './user.service';
import { CustomUserInRequest } from "src/auth/auth.dto";
import {
    userDataDto,
    searchAccountOrEmailDto,
    dataUpdatePasswordDto,
    UserDataInReq,
    ConfirmOtpDto,
    resetPasswordDto,
} from "./user.dto";
import { plainToInstance } from "class-transformer";
import { SkipAuth } from "src/common/decorate/skipAuth";
import { MailerService } from 'src/mailer/mailer.service';
import { ParamTokenGuard } from "./guard/analysisParam.guard";
import JwtResetPasswordGuard from "./guard/jwt-resetPassword.guard";
@Controller('/user')
export class UserController {
    constructor(
        private userService: UserService,
        private readonly mailerService: MailerService,
    ) { }

    @SkipAuth()
    @UseGuards(JwtResetPasswordGuard)
    @Post('/password/forgot-password/reset')
    async resetPassword(@Body() data: resetPasswordDto, @Request() request: CustomUserInRequest) {
        const { password } = data;
        const { user } = request
        const dataUpdate = await this.userService.resetPassword(user.id, password)
        request.res.clearCookie('resetPassword', {
            path: '/user/password/forgot-password/reset'
        });
        return dataUpdate
    }

    @SkipAuth()
    @UseGuards(ParamTokenGuard)
    @Post('/password/forgot-password/otp/validate/:token')
    async otpValidate(@Body() data: ConfirmOtpDto, @Request() request: CustomUserInRequest) {
        const { OTP } = data
        const { user } = request
        const isValidOtp = await this.userService.validateOTPResetPassword(OTP, user.email);
        if (!isValidOtp) {
            throw new HttpException({
                status: HttpStatus.NOT_ACCEPTABLE,
                message: 'OTP không đúng hoạc đã hết hạn!',
                error: 'BAD REQUEST'
            },
                HttpStatus.NOT_ACCEPTABLE
            )
        }
        const cookie = this.userService.createCookieResetPassword(user.id, user.account);
        request.res.setHeader('Set-Cookie', cookie)
        return {
            messsage: "Xác thực OTP thanhd công. Có thể đặt lại mật khẩu ngay bây giờ!"
        }
    }


    @SkipAuth()
    @UseGuards(ParamTokenGuard)
    @Get('/password/forgot-password/otp/:token')
    async getOTPForgotPassword(@Request() request: UserDataInReq) {
        const email = request.user.email
        this.mailerService.sendEmailOTPChangePassword(email);
        return {
            message: `Đã gửi mã OTP đặt lại mật khẩu đến email ${email}`
        }
    }

    @SkipAuth()
    @Post('/search-and-retrieve')
    async searchAccount(@Body() data: searchAccountOrEmailDto) {
        return await this.userService.findUserByIdentifier(data.keyword)
    }

    @Post('/password/change')
    async updatePassword(@Body() data: dataUpdatePasswordDto, @Request() req: UserDataInReq) {
        const { user } = req;
        const { password, passwordNew } = data
        await this.userService.handleUpdatepasswordUser(user.id, password, passwordNew);
        return {
            message: "thay đổi mật khẩu thành công!"
        }
    }

    @Get('/profile')
    async getProfile(@Request() request: CustomUserInRequest): Promise<userDataDto> {
        const userData = await this.userService.getById(request.user.id)

        return plainToInstance(userDataDto, userData, {
            excludeExtraneousValues: true,
        })
    }


}
