import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Friend } from './friend.entity';
import { UserService } from 'src/user/user.service';
import { plainToInstance } from "class-transformer";
import { FrienDataDto, ListFriendDto, FriendRequestDto, updateFriendDto } from "./friend.dto";

import {
    Injectable,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    NotFoundException
} from "@nestjs/common";
import { error } from "console";

@Injectable()
export class FriendService {
    constructor(
        @InjectRepository(Friend)
        private friendRepository: Repository<Friend>,
        private userService: UserService
    ) { }

    
    async update(friendsId: string, status: string) {
        try {
            const dataUpdate = await this.friendRepository.update(friendsId, { status: status})
            if (dataUpdate.affected === 0) {
                throw new HttpException({
                    status: HttpStatus.BAD_REQUEST,
                    error: 'request denied'
                },
                    HttpStatus.BAD_REQUEST
                )
            }
            return dataUpdate
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException();
        }
    }

    async UpdateFriendstatus(friendId: string, status: string) {
        try {
            const friendData = await this.friendRepository.findOne({
                where: { id: friendId }
            });
            if (!friendData) {
                throw new HttpException({
                    status: HttpStatus.NOT_FOUND,
                    error: 'Friend not found',
                }, HttpStatus.NOT_FOUND);
            }
            friendData.status = status;
            const updatedFriend = await this.friendRepository.save(friendData);
            return updatedFriend;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException();
        }
    }

    async getFriendRequests2(userId: string): Promise<FriendRequestDto[]> {
        try {
            const DataReqFriend = await this.friendRepository
                .createQueryBuilder("friend")
                .leftJoinAndSelect("friend.sender", "sender")
                .where("friend.receiver.id = :userId AND friend.status = :status", { userId, status: "Pending" })
                .select([
                    "friend.status",
                    "friend.id",
                    "sender.id",
                    "sender.account",
                ])
                .getMany();
            return plainToInstance(FriendRequestDto, DataReqFriend, {
                excludeExtraneousValues: true
            })
        } catch (error) {
            throw new InternalServerErrorException();
        }

    }

    async getFriendRequests(userId: string): Promise<FriendRequestDto[]> {
        const friendRequests = await this.friendRepository.find({
            where: {
                receiver: { id: userId },
                status: "Pending",
            },
            // relations: {
            //     sender: true,
            // },
            select: {
                status: true,
                id: true,
                sender: {
                    id: true,
                    account: true,
                }
            }
        })
        return plainToInstance(FriendRequestDto, friendRequests, {
            excludeExtraneousValues: true
        })
    }


    async getFriendsList(userId: string) {
        try {
            const friendData = await this.friendRepository.find({
                where: [
                    { sender: { id: userId }, status: "Accepted" },
                    { receiver: { id: userId }, status: "Accepted" },
                ],
                relations: ['sender', 'receiver'],
                select: {
                    id: true,
                    status: true,
                    sender: {
                        id: true,
                        account: true,
                    },
                    receiver: {
                        id: true,
                        account: true,
                    }
                }
            })
console.log(friendData);

            const friendList = friendData.map((friend) => {
                const { sender, receiver, ...rest } = friend;
                return {
                    ...rest,
                    receiver: friend.sender.id === userId ? receiver : sender,
                };
            });
            console.log(friendList);
            

            return plainToInstance(ListFriendDto, friendList, {
                excludeExtraneousValues: true
            })
        } catch (error) {
            throw new HttpException(
                'Đã xảy ra lỗi không xác định',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private async checkExistence(senderId: string, receiverId: string) {
        const friend = this.friendRepository.findOne({
            where: [
                { sender: { id: senderId }, receiver: { id: receiverId } },
                { sender: { id: senderId }, receiver: { id: receiverId } }
            ],
            select: {
                id: true
            }
        })
        return friend
    }

    async createFriend(userId: string, receiverId: string): Promise<FrienDataDto> {
        try {
            await this.userService.getById(receiverId);
            const checkFriend = await this.checkExistence(userId, receiverId)
            if (checkFriend) {
                throw new HttpException({
                    status: HttpStatus.CONFLICT,
                    message: 'tài nguyên đã tồn tại!',
                    error: 'BAD REQUEST',
                }, HttpStatus.CONFLICT);
            }
            const newFriend = this.friendRepository.create({
                sender: { id: userId },
                receiver: { id: receiverId }
            })
            const friend = await this.friendRepository.save(newFriend);
            return plainToInstance(FrienDataDto, friend, {
                excludeExtraneousValues: true
            });
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Đã xảy ra lỗi không xác định',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
