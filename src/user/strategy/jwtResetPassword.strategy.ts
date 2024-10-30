
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JWTDecoded } from 'src/auth/auth.dto';
import { jwtConstants } from 'src/auth/constants';

@Injectable()
export class JwtResetPasswordStrategy extends PassportStrategy(
    Strategy,
    'jwt-reset-password'
) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => {                
                return request?.cookies?.resetPassword;
            }]),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    async validate(payload: JWTDecoded) {
        const user = { id: payload.sub, account: payload.account };
        return user;
    }
}