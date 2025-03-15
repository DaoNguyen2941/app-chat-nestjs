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
import { Users } from './entity/user.entity';
import { Repository, Like } from "typeorm";
import { BasicUserDataDto, userDataDto } from './user.dto';
import { plainToInstance } from "class-transformer";
import { RegisterDto } from 'src/modules/auth/auth.dto';
import { QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { hashData } from 'src/common/utils';
import { JwtService } from '@nestjs/jwt';
import { JWTPayload } from 'src/modules/auth/auth.dto';
import { createCookie, } from 'src/common/utils';
import { jwtConstants } from 'src/modules/auth/constants';
import { SearchUserWithFriendStatusDto } from './user.dto';
import { RedisCacheService } from 'src/redis/services/redisCache.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { generateOtp } from 'src/common/utils';
import { JOB_Mail } from '../queue/queue.constants';
@Injectable()
export class UserService {
    constructor(
        @InjectRepository(Users)
        private usersRepository: Repository<Users>,
        private jwtService: JwtService,
        @InjectQueue(JOB_Mail.NAME) private readonly mailQueue: Queue,
        private readonly redisCacheService: RedisCacheService,
    ) { }

    async sendEmailOTPChangePassword(email: string) {
        try {
            const otp = await generateOtp(6);
            const value = {
                otp
            }
            await this.redisCacheService.setCache(`otp reset password ${email}`, value, 300);
            await this.mailQueue.add(JOB_Mail.SEND_OTP_PASSWORD, { to: email, otp });
            return;
        } catch (error) {
            throw error
        }
    }

    async setLastSeen(userId: string, time: Date | null) {
        try {
           return await this.usersRepository
            .createQueryBuilder()
            .update(Users)
            .set({ lastSeen: time })
            .where("id = :userId", { userId })
            .execute();            
        } catch (error) {
            console.error(`❌ Lỗi khi cập nhật lastSeen cho userId: ${userId}`, error);
        }
    }

    async getUserDataById(userId: string): Promise<BasicUserDataDto> {
        try {
            const account = await this.usersRepository.findOne({
                where: { id: userId },
                select: {
                    id: true,
                    account: true,
                    email: true,
                    avatar: true,
                    name: true
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

    async searchUser(keyword: string) {
        const user = await this.usersRepository.find({
            where: {
                account: Like(`%${keyword}%`)
            },
            select: {
                id: true,
                account: true,
                name: true,
                avatar: true
            }
        })
        return user
    }

    async SearchUsersAndFriendStatus(keyword: string, userId: string): Promise<SearchUserWithFriendStatusDto[]> {
        const users = await this.usersRepository
            .createQueryBuilder("user")
            .leftJoin(
                "friend",
                "f",
                "(f.senderId = :userId AND f.receiverId = user.id) OR (f.senderId = user.id AND f.receiverId = :userId)",
                { userId }
            )
            .where("user.account LIKE :keyword", { keyword: `%${keyword}%` })
            .select([
                "user.id AS id", 
                "user.account AS account",
                "user.name AS name",
                "user.avatar AS avatar",
                "f.status AS status", 
                "f.senderId AS senderId", 
                "f.id AS friendId"
            ])
            .getRawMany();

        return plainToInstance(SearchUserWithFriendStatusDto, users, {
            excludeExtraneousValues: true
        });
    }


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

    public createCookieResetPassword(userId: string, account: string, avatar: string) {
        const payload: JWTPayload = { sub: userId, account: account, avatar: avatar };
        const token = this.jwtService.sign(payload);
        const cookie = createCookie('resetPassword', token, `/user/password/forgot-password/reset`, jwtConstants.expirationTimeDefault);
        return cookie;
    }

    public async validateOTPResetPassword(otp: string, email: string): Promise<boolean> {
        try {
            const cacheOtp: { otp: string } | null = await this.redisCacheService.getCache(`otp reset password ${email}`);
            if (cacheOtp?.otp !== otp) {
                return false
            }
            if (cacheOtp.otp === otp) {
                await this.redisCacheService.deleteCache(`otp reset password ${email}`)
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
            const a = await this.usersRepository.save(newUser)
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
                    refresh_token: true,
                    avatar: true
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
                    refresh_token: true,
                    name: true,
                    avatar: true
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

    async getByEmail(email: string): Promise<BasicUserDataDto> {
        try {
            const account = await this.usersRepository.findOne({
                where: { email: email },
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