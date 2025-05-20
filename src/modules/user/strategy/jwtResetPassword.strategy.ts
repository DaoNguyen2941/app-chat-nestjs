
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JWTDecodedResetPassword } from 'src/modules/auth/auth.dto';
import { jwtConstants } from 'src/modules/auth/constants';

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
            secretOrKey: jwtConstants.resetPasswordSecret,
        });
    }

    async validate(payload: JWTDecodedResetPassword) {
        const user = { id: payload.sub};
        return user;
    }
}