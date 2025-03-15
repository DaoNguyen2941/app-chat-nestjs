import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import {  JOB_USER } from '../queue.constants';
import { UserService } from 'src/modules/user/user.service';
import { ManagerClientSocketService } from 'src/redis/services/managerClient.service';

@Processor(JOB_USER.NAME)
export class UserProcessor {
    constructor(
        private readonly userService: UserService,
        private readonly managerClientSocketService: ManagerClientSocketService,

    ) { }

    @Process(JOB_USER.UPDATE_LAST_SEEN)
    async handleSendMessage(job: Job<{userId:string, time: Date}>) {
        const {userId, time} = job.data
        const userStatus = await this.managerClientSocketService.UserStatus(userId);
        const dataLastSeen= await this.managerClientSocketService.getLastSeenClientSocket(userId)
        if (userStatus === 'offline' && !dataLastSeen ) {
            return await this.userService.setLastSeen(userId, time)
        }
    }

}