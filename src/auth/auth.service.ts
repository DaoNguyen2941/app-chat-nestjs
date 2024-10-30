import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from "class-transformer";
import { RegisterDto, RegisterResponseDto, ConfirmOtpDto, JWTPayload } from './auth.dto';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MailerService } from 'src/mailer/mailer.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { BasicUserDataDto, userDataDto } from 'src/user/user.dto';
import { hashData } from 'src/common/utils';
import { createCookie, } from 'src/common/utils';
import { generateOtp } from 'src/common/utils';
@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UserService,
        private readonly mailerService: MailerService,
        private jwtService: JwtService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }


    public createAuthCookie(userId: string, account: string): string {
        const payload: JWTPayload = { sub: userId, account: account };
        const token = this.jwtService.sign(payload);
        const cookie = createCookie('Authentication',token,'/',jwtConstants.expirationTimeDefault)
        return cookie
    }

    public createRefreshCookie(userId: string, account: string) {
        const payload: JWTPayload = { sub: userId, account: account };
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: `${jwtConstants.expirationTime}s`,
            secret: jwtConstants.refreshTokenSecret,
        });
        const RefreshTokenCookie = createCookie('Refresh',refreshToken,'/auth/refresh',jwtConstants.expirationTime)
        return {
            RefreshTokenCookie,
            refreshToken
        }
    }

    async validateUser(username: string, pass: string): Promise<userDataDto | null> {
            const userData: BasicUserDataDto = await this.usersService.getByAccount(username)
            const isPasswordMatching = await bcrypt.compare(
                pass,
                userData?.password || 'null'
            );
    
            if (userData && isPasswordMatching) {
                return plainToInstance(userDataDto, userData, {
                    excludeExtraneousValues: true,
                })
            }
            return null;
    }

    async verifyOTP(dataOTP: ConfirmOtpDto): Promise<RegisterResponseDto> {
        try {
            const userNew: RegisterDto | undefined = await this.cacheManager.get(`userNew ${dataOTP.email}`)
            const userOtp = await this.cacheManager.get(`otp ${dataOTP.email}`)

            if (userNew === undefined) {
                throw new HttpException({
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    message: 'Phiên Đã Hết Hạn!',
                    error: 'BAD REQUEST'
                },
                    HttpStatus.UNPROCESSABLE_ENTITY
                )
            }

            if (dataOTP.OTP !== userOtp) {
                throw new HttpException({
                    status: HttpStatus.NOT_ACCEPTABLE,
                    message: 'OTP không đúng hoạc đã hết hạn!',
                    error: 'BAD REQUEST'
                },
                    HttpStatus.NOT_ACCEPTABLE
                )
            }

            if (dataOTP.OTP === userOtp) {
                const user = await this.usersService.create(userNew)
                await this.cacheManager.del(`userNew ${dataOTP.email}`)
                await this.cacheManager.del(`otp ${dataOTP.email}`)
                return plainToInstance(RegisterResponseDto, user, {
                    excludeExtraneousValues: true,
                })
            }
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Đã xảy ra lỗi không mong muốn.',
                    error: 'SERVER_ERROR',
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );

        } catch (error) {
            // Xử lý lỗi một cách tổng quát
            if (error instanceof HttpException) {
                // Nếu lỗi là HttpException, ném lại nó để NestJS xử lý
                throw error;
            } else {
                // Xử lý các lỗi không mong muốn khác
                throw new HttpException(
                    {
                        status: HttpStatus.INTERNAL_SERVER_ERROR,
                        message: 'Đã xảy ra lỗi không mong muốn trong quá trình xác thực OTP.',
                        error: 'SERVER_ERROR',
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

        }
    }

    public async authGmail(email: string) {
        try {
            const otp = await generateOtp(6);
            await this.cacheManager.set(`otp ${email}`, otp, 300000)
            const text = `Your OTP code is: ${otp}. It will expire after 5 minutes. Please do not share this code with anyone.`;
            return await this.mailerService.sendMail({
                to: email,
                subject: `Your OTP - ${otp}`,
                text,
            });
        } catch (error) {
            if (error instanceof Error) {
                // Xử lý lỗi khi gửi email
                if (error.message.includes('sendMail')) {
                    throw new HttpException(
                        'Lỗi gửi email, vui lòng thử lại sau.',
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }
            }
            // Nếu không phải lỗi cụ thể, ném lại lỗi chung
            throw new HttpException(
                'Đã xảy ra lỗi không xác định khi xác thực.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

    }


    public async register(userData: RegisterDto): Promise<RegisterResponseDto> {
        try {
            const dataAccont = await this.usersService.getByAccount(userData.account)
            const cacheUserData = await this.cacheManager.get(`userNew ${userData.email}`)
            // kiểm tra tài khoản đã tồn tại hay chưa
            if (dataAccont === null && cacheUserData === undefined) {
                userData.password = await hashData(userData.password)
                // lưu tạm user vào cache (10p)
                await this.cacheManager.set(`userNew ${userData.email}`, userData, 600000);
                return plainToInstance(RegisterResponseDto, userData, {
                    excludeExtraneousValues: true,
                })
            }
            throw new HttpException({
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                message: 'Tài khoản đã tồn tại, hãy lấy tên tài khoản khác!',
                error: 'BAD REQUEST'
            },
                HttpStatus.UNPROCESSABLE_ENTITY
            )

        } catch (error) {
            if (error instanceof HttpException) {
                // Nếu là lỗi đã ném ra HttpException, ném lại
                throw error;
            }
            // Xử lý lỗi khác (lỗi không xác định)
            throw new HttpException(
                'Đã xảy ra lỗi không xác định trong quá trình đăng ký.',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

    }
}
