
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from 'src/user/user.service';
import { JWTDecoded } from '../auth.dto';
import { jwtConstants } from '../constants';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token'
) {
  constructor(
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => {
        return request?.cookies?.Refresh;        
      }]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.refreshTokenSecret,
      passReqToCallback: true,
    });
  }
 
  async validate(request: Request, payload: JWTDecoded) {
        const refreshToken = request.cookies?.Refresh;
    return this.userService.verifyRefreshToken(refreshToken, payload.sub);
  }
}