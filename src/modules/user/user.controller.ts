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
    typeUser
} from "./user.dto";
import { plainToInstance } from "class-transformer";
import { SkipAuth } from "src/common/decorate/skipAuth";
import { ParamTokenGuard } from "./guard/analysisParam.guard";
import JwtResetPasswordGuard from "./guard/jwt-resetPassword.guard";
import { IParamsKeyWord, IParamsId } from "src/common/interface/Interface";
import { FileInterceptor } from "@nestjs/platform-express";
// npm install --save-dev @types/express @types/multer
import { Express } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('user')
@ApiTags('Users')
export class UserController {
    constructor(
        private readonly userService: UserService,
    ) { }

    @Post(`/avatar`)
    @ApiOperation({ summary: 'Thay đổi avatar' })
    // @ApiResponse({ status: 200, description: 'Thành công' })
    @UseInterceptors(FileInterceptor('file'))
    updateAvatarUser(@Request() request: CustomUserInRequest, @UploadedFile(
        new ParseFilePipeBuilder()
            .addFileTypeValidator({
                fileType: 'image'
            })
            .addMaxSizeValidator({ maxSize: 2_000_000 })
            .build({
                errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
            }),
    ) file: Express.Multer.File,) {
        const { user } = request
        return this.userService.uploadAvatar(file, user.id)
    }

    @Patch(`/name`)
    @ApiOperation({ summary: 'Cập nhập tên người dùng' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    updateNameUser(@Request() request: CustomUserInRequest, @Body() data: NameUserDto) {
        const { user } = request
        const { name } = data
        return this.userService.setNameUser(user.id, name)
    }

    @Get(`/search/:keyword`)
    @ApiOperation({ summary: 'Tìm kiếm người dùng' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    async searchUser(@Param() param: IParamsKeyWord, @Request() request: CustomUserInRequest) {
        const { user } = request
        const userList = await this.userService.SearchUsersAndFriendStatus(param.keyword, user.id);
        return userList
    }

    @SkipAuth()
    @UseGuards(JwtResetPasswordGuard)
    @ApiOperation({ summary: 'Đặt lại mật khẩu' })
    @ApiResponse({ status: 200, description: 'Thành công' })
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
    @ApiOperation({ summary: 'xác nhận mã OTP' })
    @ApiResponse({ status: 200, description: 'Thành công' })
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
    @ApiOperation({ summary: 'Lấy mã OTP về email' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @Get('/identify/forgot-password/otp/:token')
    async getOTPForgotPassword(@Request() request: UserDataInReq) {
        const email = request.user.email
        this.userService.sendEmailOTPChangePassword(email);
        return {
            message: `Đã gửi mã OTP đặt lại mật khẩu đến email ${email}`
        }
    }

    @SkipAuth()
    @ApiOperation({ summary: 'tìm tài khoản để tiến hành nhận dạng' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @Post('/identify')
    async searchAccount(@Body() data: searchAccountOrEmailDto) {
        return await this.userService.findUserByIdentifier(data.keyword)
    }

    @ApiOperation({ summary: 'Đổi mật khẩu' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @Post('/password/change')
    async updatePassword(@Body() data: dataUpdatePasswordDto, @Request() req: UserDataInReq) {
        const { user } = req;
        const { password, newPassword } = data
        await this.userService.changeUserPassword(user.id, password, newPassword);
        return {
            message: "thay đổi mật khẩu thành công!"
        }
    }

    @ApiOperation({ summary: 'Lấy thông tin người dùng' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @Get('/profile')
    async getProfile(@Request() request: CustomUserInRequest): Promise<userDataDto> {
        const userData = await this.userService.getById(request.user.id)
        return plainToInstance(userDataDto, userData, {
            excludeExtraneousValues: true,
        })
    }

    @ApiOperation({ summary: 'Lấy thông tin người dùng' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @Get('/:id')
    async getUser(@Param() param: IParamsId): Promise<typeUser> {
        return await this.userService.getUserDataById(param.id)
    }
}
