// src/common/guards/is-group-manager.guard.ts
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { ChatGroupService } from 'src/modules/chat/service/chatGroup.service';
import { Request } from 'express';
import { userDataDto } from 'src/modules/user/user.dto';
@Injectable()
export class IsGroupManagerGuard implements CanActivate {
    constructor(
        private readonly chatGroupService: ChatGroupService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request & { user: userDataDto }>();
        const user = req.user;
        const groupId = req.params.id;

        if (!user || !groupId) {
            throw new ForbiddenException('Thiếu thông tin xác thực hoặc groupId');
        }

        const group = await this.chatGroupService.findByIdWithManager(groupId);
        if (!group) {
            throw new ForbiddenException('Nhóm không tồn tại');
        }

        if (group.manager.id !== user.id) {
            throw new ForbiddenException('Bạn không phải là quản trị viên của nhóm này');
        }

        return true;
    }
}
