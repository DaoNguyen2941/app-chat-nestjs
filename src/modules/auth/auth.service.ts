import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from "class-transformer";
import { RegisterDto, RegisterResponseDto, ConfirmOtpDto, JWTPayload } from './auth.dto';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { BasicUserDataDto, userDataDto } from 'src/modules/user/user.dto';
import { hashData } from 'src/common/utils';
import { createCookie, } from 'src/common/utils';
import { generateOtp } from 'src/common/utils';
import { RedisCacheService } from 'src/redis/services/redisCache.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JOB_Mail } from '../queue/queue.constants';
@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UserService,
        @InjectQueue(JOB_Mail.NAME) private readonly mailQueue: Queue,
        private readonly redisCacheService: RedisCacheService,
        private jwtService: JwtService,
    ) { }


    public createAuthCookie(userData: userDataDto) {
        const payload: JWTPayload = {
            sub: userData.id,
            account: userData.account,
            avatar: userData.avatar,
            name: userData.name
        };
        const token = this.jwtService.sign(payload);
        const cookie = createCookie('Authentication', token, '/', jwtConstants.expirationTimeDefault)
        return {
            accessTokenCookie: cookie,
            token: token
        }
    }

    public createRefreshCookie(userData: userDataDto) {
        const payload: JWTPayload = {
            sub: userData.id,
            account: userData.account,
            avatar: userData.avatar,
            name: userData.name
        };
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: `${jwtConstants.expirationTime}s`,
            secret: jwtConstants.refreshTokenSecret,
        });
        const RefreshTokenCookie = createCookie('Refresh', refreshToken, '/auth/refresh', jwtConstants.expirationTime)
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

    async emailAuthentication(email: string) {
        try {
            const otp = await generateOtp(6);
            const value = {
                otp
            }
            await this.redisCacheService.setCache(`otp ${email}`, value, 300);
            await this.mailQueue.add('send-otp-email-verification', { to: email, otp });
            return;
        } catch (error) {
            throw error
        }
    }

    async verifyOTP(dataOTP: ConfirmOtpDto): Promise<RegisterResponseDto> {
        try {
            const userNew: RegisterDto | null = await this.redisCacheService.getCache(`newAccount ${dataOTP.email}`)
            const userOtp: { otp: string } | null = await this.redisCacheService.getCache(`otp ${dataOTP.email}`)
            if (userNew === null) {
                throw new HttpException({
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    message: 'Phiên Đã Hết Hạn!',
                    error: 'BAD REQUEST'
                },
                    HttpStatus.UNPROCESSABLE_ENTITY
                )
            }

            if (dataOTP.OTP !== userOtp?.otp) {
                throw new HttpException({
                    status: HttpStatus.NOT_ACCEPTABLE,
                    message: 'OTP không đúng hoạc đã hết hạn!',
                    error: 'BAD REQUEST'
                },
                    HttpStatus.NOT_ACCEPTABLE
                )
            }

            if (dataOTP.OTP === userOtp.otp) {
                const user = await this.usersService.create(userNew)
                await this.redisCacheService.deleteCache(`newAccount ${dataOTP.email}`)
                await this.redisCacheService.deleteCache(`otp ${dataOTP.email}`)

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
            if (error instanceof HttpException) {
                throw error;
            } else {
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

    public async register(userData: RegisterDto): Promise<RegisterResponseDto> {
        try {
            const dataAccont = await this.usersService.getByAccount(userData.account)
            const dataEmail = await this.usersService.getByEmail(userData.email)
            const cacheUserData = await this.redisCacheService.getCache(`newAccount ${userData.email}`)
            if (dataEmail || cacheUserData) {
                throw new HttpException({
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    message: 'email đã đang ký, hãy dùng email khác!',
                    error: 'BAD REQUEST'
                },
                    HttpStatus.UNPROCESSABLE_ENTITY
                )
            }

            if (dataAccont) {
                throw new HttpException({
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    message: 'Tài khoản đã tồn tại, hãy lấy tên tài khoản khác!',
                    error: 'BAD REQUEST'
                },
                    HttpStatus.UNPROCESSABLE_ENTITY
                )
            }
            userData.password = await hashData(userData.password)
            // lưu tạm user vào cache (10p)
            await this.redisCacheService.setCache(`newAccount ${userData.email}`, userData, 600)

            return plainToInstance(RegisterResponseDto, userData, {
                excludeExtraneousValues: true,
            })

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
