import {
    Controller,
    Post,
    Body,
    Request,
    HttpException,
    HttpStatus,
    Get,
    Patch,
    Param,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { UserDataInReq } from 'src/user/user.dto';
import { CreateFriendDto, FrienDataDto, FriendRequestDto, updateFriendDto } from './friend.dto';
import { IParamsId } from 'src/common/Interface';
@Controller('friend')
export class FriendController {
    constructor(
        private readonly friendService: FriendService
    ) { }

    @Patch("requests/:id/accepted")
    async update(@Param() param: IParamsId) {
        return await this.friendService.update(param.id,'Accepted')
    }

    @Get("requests/lists")
    async getFriendRequest(@Request() request: UserDataInReq): Promise<FriendRequestDto[]> {
        const { user } = request
        return await this.friendService.getFriendRequests2(user.id);
    };

    @Post(`create`)
    async createFriend(@Body() data: CreateFriendDto, @Request() request: UserDataInReq): Promise<FrienDataDto> {
        const { user } = request
        const { receiverId } = data
        if (user.id !== receiverId) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                error: 'request denied'
            },
                HttpStatus.BAD_REQUEST
            )
        } else {
            return await this.friendService.createFriend(user.id, receiverId)
        }
    }

    @Get('lists')
    async getFriend(@Request() request: UserDataInReq): Promise<any> {
        const { user } = request
        console.log(user);
        
        return await this.friendService.getFriendsList(user.id);
    };
}
