import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ChatGateway } from 'src/gateways/chat.gateway';
import { OutgoingMessageDataDto, OutgoingMessageGroupDataDto } from 'src/modules/chat/dto/message.dto';
import { JOB_CHAT } from '../queue.constants';

@Processor(JOB_CHAT.NAME)
export class ChatProcessor {
    private readonly logger = new Logger(ChatProcessor.name);
    constructor(
        private readonly chatGateway: ChatGateway,
    ) { }

    @Process(JOB_CHAT.NEW_GROUP_CHAT)
    async newGroupChat(job: Job<{userIds: string[]}>) {
        return await this.chatGateway.handleEventNewGroup(job.data.userIds)
    }

    @Process(JOB_CHAT.INVITE_TO_GROUP)
    async inviteToGroup(job: Job<{inviteeIds: string[]}>) {
        return await this.chatGateway.handeleInveteGroup(job.data.inviteeIds)
    }

    @Process(JOB_CHAT.NEW_MESSAGE)
    async handleSendMessage(job: Job<OutgoingMessageDataDto>) {
        return await this.chatGateway.handleEventSenderMessage(job.data)
    }

    @Process(JOB_CHAT.NEW_MESSAGE_GROUP)
    async handleSendMessageGroup(job: Job<OutgoingMessageGroupDataDto>) {
        return await this.chatGateway.handleEventSenderMessageGroup(job.data)
    }

}