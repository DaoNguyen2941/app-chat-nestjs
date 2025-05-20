import {
    Controller,
    Request,
    Get,
    Post,
    Body,
    UseGuards,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    UseInterceptors,
    UploadedFile,
    ParseFilePipeBuilder,
} from "@nestjs/common";
import { UserService } from './user.service';
import { CustomUserInRequest } from "src/modules/auth/auth.dto";
import {
    userDataDto,
    searchAccountOrEmailDto,
    dataUpdatePasswordDto,
    UserDataInReq,
    ConfirmOtpDto,
    resetPasswordDto,
    NameUserDto,
} from "./user.dto";
import { plainToInstance } from "class-transformer";
import { SkipAuth } from "src/common/decorate/skipAuth";
import { ParamTokenGuard } from "./guard/analysisParam.guard";
import JwtResetPasswordGuard from "./guard/jwt-resetPassword.guard";
import { IParamsKeyWord } from "src/common/Interface";
import { FileInterceptor } from "@nestjs/platform-express";
// npm install --save-dev @types/express @types/multer
import { Express } from 'express';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
    ) { }

    @Post(`/avatar`)
    @UseInterceptors(FileInterceptor('file'))
    updateAvatarUser(@Request() request: CustomUserInRequest, @UploadedFile(
        new ParseFilePipeBuilder()
            .addFileTypeValidator({
                fileType: 'image'
            })
            // .addMaxSizeValidator({
            //   maxSize: 1000
            // })
            .build({
                errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
            }),
    ) file: Express.Multer.File,) {
        console.log(file);
        return file
    }

    @Patch(`/name`)
    updateNameUser(@Request() request: CustomUserInRequest, @Body() data: NameUserDto) {
        const { user } = request
        const { name } = data
        return this.userService.setNameUser(user.id, name)
    }

    @Get(`/search/:keyword`)
    async searchUser(@Param() param: IParamsKeyWord, @Request() request: CustomUserInRequest) {
        const { user } = request
        const userList = await this.userService.SearchUsersAndFriendStatus(param.keyword, user.id);
        return userList
    }

    @SkipAuth()
    @UseGuards(JwtResetPasswordGuard)
    @Post('/identify/forgot-password/reset')
    async resetPassword(@Body() data: resetPasswordDto, @Request() request: CustomUserInRequest) {
        const { password } = data;
        const { user } = request
        const dataUpdate = await this.userService.resetPassword(user.id, password)
        request.res.clearCookie('resetPassword', {
            path: '/user/identify/forgot-password/reset'
        });
        return dataUpdate
    }

    @SkipAuth()
    @UseGuards(ParamTokenGuard)
    @Post('/identify/forgot-password/otp/validate/:token')
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
        const cookie = this.userService.createCookieResetPassword(user.id);
        request.res.setHeader('Set-Cookie', cookie)
        return {
            messsage: "Xác thực OTP thành công. Có thể đặt lại mật khẩu ngay bây giờ!"
        }
    }


    @SkipAuth()
    @UseGuards(ParamTokenGuard)
    @Get('/identify/forgot-password/otp/:token')
    async getOTPForgotPassword(@Request() request: UserDataInReq) {
        const email = request.user.email
        this.userService.sendEmailOTPChangePassword(email);
        return {
            message: `Đã gửi mã OTP đặt lại mật khẩu đến email ${email}`
        }
    }

    @SkipAuth()
    @Post('/identify')
    async searchAccount(@Body() data: searchAccountOrEmailDto) {
        return await this.userService.findUserByIdentifier(data.keyword)
    }

    @Post('/password/change')
    async updatePassword(@Body() data: dataUpdatePasswordDto, @Request() req: UserDataInReq) {
        const { user } = req;
        const { password, newPassword } = data
        await this.userService.changeUserPassword(user.id, password, newPassword);
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
