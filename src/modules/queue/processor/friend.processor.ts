import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { FriendGateway } from 'src/gateways/friend.gateway';
import { DataEventRequestDto } from 'src/modules/friend/friend.dto';
import { JOB_FRIEND } from '../queue.constants';

@Processor(JOB_FRIEND.NAME)
export class FriendProcessor {
    constructor(
        private readonly friendGateway: FriendGateway,
    ) {}

    @Process(JOB_FRIEND.FRIEND_REQUEST)
   async receiveFriendRequest(Job: Job<DataEventRequestDto>) {    
       return await this.friendGateway.handleEventSendRequestFriend(Job.data)
    }

}