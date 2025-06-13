import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Friend } from './friend.entity';
import { UserService } from 'src/modules/user/user.service';
import { plainToInstance } from "class-transformer";
import { FrienDataDto, ListFriendDto, FriendRequestDto, DataEventRequestDto } from "./friend.dto";
import { EventEmitter2 } from '@nestjs/event-emitter';
// import { PubService } from "src/redis/pubVsSub/service/pubService";
import { EVENT_FRIEND } from "src/redis/redis.constants";
import {
    Injectable,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    NotFoundException,
    BadRequestException
} from "@nestjs/common";
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JOB_FRIEND } from "../queue/queue.constants";
import { ManagerClientSocketService } from 'src/redis/services/managerClient.service';

@Injectable()
export class FriendService {
    constructor(
        @InjectRepository(Friend)
        private friendRepository: Repository<Friend>,
        private userService: UserService,
        @InjectQueue(JOB_FRIEND.NAME) private readonly friendQueue: Queue,
        private readonly managerClientSocketService: ManagerClientSocketService,
        // private readonly eventEmitter: EventEmitter2,
        // private readonly pubService: PubService,

    ) { }

    async delete(friendsId: string) {
        const friend = await this.friendRepository.findOne({ where: { id: friendsId } });
        if (!friend) {
            throw new NotFoundException('không hợp lệ');
        }
        // Tiến hành xóa
        const result = await this.friendRepository.delete(friendsId);
        if (result.affected === 0) {
            throw new BadRequestException('Hủy lời mời thất bại');
        }

        return result;
    }


    async update(friendsId: string, status: string) {
        try {
            const dataUpdate = await this.friendRepository.update(friendsId, { status: status })
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

    async getFriendRequests(userId: string): Promise<FriendRequestDto[]> {
        try {
            const DataReqFriend = await this.friendRepository
                .createQueryBuilder("friend")
                .leftJoinAndSelect("friend.sender", "sender")
                .where("friend.receiver.id = :userId AND friend.status = :status", { userId, status: "Pending" })
                .select([
                    "friend.status",
                    "friend.id",
                    "sender.id",
                    "sender.avatar",
                    "sender.name",
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

    async getFriendsList(userId: string): Promise<ListFriendDto[]> {
        try {
            const friendData = await this.friendRepository.find({
                where: [
                    { sender: { id: userId }, status: 'Accepted' },
                    { receiver: { id: userId }, status: 'Accepted' },
                ],
                relations: ['sender', 'receiver'],
                select: {
                    id: true,
                    status: true,
                    sender: {
                        id: true,
                        account: true,
                        avatar: true,
                        name: true,
                        lastSeen: true,
                    },
                    receiver: {
                        id: true,
                        account: true,
                        avatar: true,
                        name: true,
                        lastSeen: true,

                    },
                },
            });

            const friendList = await Promise.all(friendData.map(async (friend) => {
                const { sender, receiver, ...rest } = friend;
                const targetUser = sender.id === userId ? receiver : sender;

                const [lastSeenFromSocket, userStatus] = await Promise.all([
                    this.managerClientSocketService.getLastSeenClientSocket(targetUser.id),
                    this.managerClientSocketService.UserStatus(targetUser.id),
                ]);

                return {
                    ...rest,
                    receiver: targetUser,
                    isOnline: userStatus === 'online' ? true : false,
                    lastSeen: lastSeenFromSocket || targetUser.lastSeen,
                };
            }));

            return plainToInstance(ListFriendDto, friendList, {
                excludeExtraneousValues: true,
            });
        } catch (error) {
            throw new HttpException(
                'Đã xảy ra lỗi không xác định',
                HttpStatus.INTERNAL_SERVER_ERROR,
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
                id: true,
            }
        })
        return friend
    }

    async getFriendById(friendId: string) {
        try {
            const friend = await this.friendRepository.findOne({
                where: { id: friendId },
                relations: ["sender", "receiver"],
                select: {
                    id: true,
                    status: true,
                    sender: {
                        id: true,
                        account: true,
                        avatar: true,
                        name: true
                    },
                    receiver: {
                        id: true,
                        account: true,
                        avatar: true,
                        name: true
                    }
                }
            })
            if (!friend) {
                throw new NotFoundException('Friend not found');
            }
            return friend

        } catch (error) {
            throw new InternalServerErrorException('Error fetching friend details');
        }
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
            const dataFriend = await this.getFriendById(friend.id)
            const reqFriend: FriendRequestDto = plainToInstance(FriendRequestDto, dataFriend, {
                excludeExtraneousValues: true
            });
            const dataReqFriend: DataEventRequestDto = {
                reqFriend,
                receiverId
            }
            this.friendQueue.add(JOB_FRIEND.FRIEND_REQUEST, dataReqFriend)
            // this.pubService.publishEvent(EVENT_FRIEND.FRIEND_REQUEST, dataReqFriend)
            // this.eventEmitter.emit('friend-request', dataReqFriend);
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
