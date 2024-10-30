import {
    Injectable,
    HttpException,
    HttpStatus,
    UnauthorizedException,
    NotFoundException,
    BadRequestException,
    Inject
} from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from './user.entity';
import { Repository } from "typeorm";
import { BasicUserDataDto, userDataDto } from './user.dto';
import { plainToInstance } from "class-transformer";
import { RegisterDto } from 'src/auth/auth.dto';
import { QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { hashData } from 'src/common/utils';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JWTPayload } from 'src/auth/auth.dto';
import { createCookie, } from 'src/common/utils';
import { jwtConstants } from 'src/auth/constants';
@Injectable()
export class UserService {
    constructor(
        @InjectRepository(Users)
        private usersRepository: Repository<Users>,
        private jwtService: JwtService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    async resetPassword(userId: string, password: string) {
        const passwordHash = await hashData(password);
        await this.usersRepository.update(
            { id: userId },
            {
                password: passwordHash
            });
        return {
            message: "đặt lại mật khẩu thành công!"
        }
    }

    public createCookieResetPassword(userId: string, account: string) {
        const payload: JWTPayload = { sub: userId, account: account };
        const token = this.jwtService.sign(payload);
        const cookie = createCookie('resetPassword', token, `/user/password/forgot-password/reset`, jwtConstants.expirationTimeDefault);
        return cookie;
    }

    public async validateOTPResetPassword(otp: string, email: string): Promise<boolean> {
        const cacheOtp = await this.cacheManager.get(`otp-reset-password-${email}`);
        if (cacheOtp !== otp) {
            return false
        }
        if (cacheOtp === otp) {
            await this.cacheManager.del(`otp-reset-password-${email}`)
            return true
        }

        throw new HttpException(
            {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Đã xảy ra lỗi không mong muốn.',
                error: 'SERVER_ERROR',
            },
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    public async handleUpdatepasswordUser(userId: string, password: string, passwordNew: string) {
        try {
            const userData = await this.getById(userId)
            const isPasswordMatching = await bcrypt.compare(
                password,
                userData?.password || 'null'
            );
            if (!isPasswordMatching) {
                throw new BadRequestException('Mật khẩu cũ không đúng');
            }
            const passwordHash = await hashData(passwordNew);
            return await this.usersRepository.update(
                { id: userId },
                {
                    password: passwordHash
                });
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new HttpException(
                'Đã xảy ra lỗi không xác định',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    public async findUserByIdentifier(accountOrEmail: string) {
        try {
            const account = await this.usersRepository.findOne({
                where: [
                    { account: accountOrEmail },
                    { email: accountOrEmail }
                ],
                // có thể thêm 1 số thuộc tính tùy chỉnh để người dùng dễ nhận ra tài khoản của mình hơn (avatar, name...,nếu có)
                select: {
                    account: true,
                    email: true,
                    id: true
                }
            })
            if (!account) {
                throw new NotFoundException('User not found');
            }
            const payload = {
                sub: account.id,
                email: account.email,
                account: account.account
            }

            
            const token = this.jwtService.sign(payload);
            return {
                user: account,
                token: token,
                getOTPAPI: `/user/password/forgot-password/otp/${token}`
            }

        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            // Ném lại các lỗi khác (ví dụ lỗi HttpException)
            throw new HttpException(
                'Đã xảy ra lỗi không xác định',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async removeRefreshToken(userId: string) {
        try {
            return await this.usersRepository.update(
                { id: userId },
                {
                    refresh_token: null
                });
        } catch (error) {
            throw new HttpException(
                'Đã xảy ra lỗi không xác định',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async setRefreshToken(refreshTokenData: string, userId: string) {
        try {
            const refreshTokenHash = await hashData(refreshTokenData);
            await this.usersRepository.update(
                { id: userId },
                {
                    refresh_token: refreshTokenHash
                });
        } catch (error) {
            throw new HttpException(
                'Đã xảy ra lỗi không xác định',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async verifyRefreshToken(refreshToken: string, userId: string): Promise<userDataDto | null> {
        const user = await this.getById(userId);
        if (!user.refresh_token) {
            throw new UnauthorizedException();
        }
        const isRefreshTokenMatching = await bcrypt.compare(
            refreshToken,
            user.refresh_token
        );

        if (isRefreshTokenMatching) {
            return plainToInstance(userDataDto, user, {
                excludeExtraneousValues: true,
            })
        }
        return null
    }

    async create(dataUserNew: RegisterDto) {
        try {
            const newUser = await this.usersRepository.create(dataUserNew)
            await this.usersRepository.save(newUser)
            return newUser
        } catch (error) {
            // Kiểm tra nếu lỗi là do truy vấn cơ sở dữ liệu
            if (error instanceof QueryFailedError) {
                // Kiểm tra lỗi cụ thể, lỗi trùng lặp
                if ((error as any).driverError.errno == '1062') { // 23505 là mã lỗi trùng lặp
                    throw new HttpException(
                        'Tên tài khoản đã tồn tại hoạc email đã đang ký. Hãy chọn thông tin khác.',
                        HttpStatus.CONFLICT
                    );
                }
                throw new HttpException(
                    'Lỗi truy vấn cơ sở dữ liệu',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            // Xử lý các lỗi không xác định khác
            throw new HttpException(
                'Đã xảy ra lỗi không xác định',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

    }

    async getById(userId: string): Promise<BasicUserDataDto> {
        try {
            const account = await this.usersRepository.findOne({
                where: { id: userId },
                select: {
                    id: true,
                    account: true,
                    email: true,
                    password: true,
                    refresh_token: true
                }
            });

            if (!account) {
                throw new NotFoundException('User not found');
            }

            return plainToInstance(BasicUserDataDto, account, {
                excludeExtraneousValues: true,
            })

        } catch (error) {

            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            // Kiểm tra nếu lỗi là do truy vấn cơ sở dữ liệu
            if (error instanceof QueryFailedError) {
                throw new HttpException(
                    'Lỗi truy vấn cơ sở dữ liệu',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            // Ném lại các lỗi khác (ví dụ lỗi HttpException)
            throw new HttpException(
                'Đã xảy ra lỗi không xác định',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getByAccount(accountName: string): Promise<BasicUserDataDto> {
        try {
            const account = await this.usersRepository.findOne({
                where: { account: accountName },
                select: {
                    id: true,
                    account: true,
                    email: true,
                    password: true,
                    refresh_token: true
                }
            });
            return plainToInstance(BasicUserDataDto, account, {
                excludeExtraneousValues: true,
            })

        } catch (error) {
            // Kiểm tra nếu lỗi là do truy vấn cơ sở dữ liệu
            if (error instanceof QueryFailedError) {
                throw new HttpException(
                    'Lỗi truy vấn cơ sở dữ liệu',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            // Ném lại các lỗi khác (ví dụ lỗi HttpException)
            throw new HttpException(
                'Đã xảy ra lỗi không xác định',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}