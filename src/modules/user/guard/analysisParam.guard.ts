import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtConstants } from 'src/modules/auth/constants';

@Injectable()
export class ParamTokenGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    canActivate(context: ExecutionContext): boolean {
        const request: Request = context.switchToHttp().getRequest();

        const token = request.params.token
        if (!token) {
            return false; 
        }

        try {
            const decoded = this.jwtService.verify(token, { secret: jwtConstants.secret });
            request.user = decoded; 
            return true;
        } catch (error) {
            return false; 
        }

    }
}
