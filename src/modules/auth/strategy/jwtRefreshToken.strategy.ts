
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { UserService } from 'src/modules/user/user.service';
import { JWTDecoded } from '../auth.dto';
import { jwtConstants } from '../constants';
import { userDataDto } from 'src/modules/user/user.dto';
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';

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
    if (!refreshToken) {    
      throw new UnauthorizedException('Refresh token not found');
    }
    let user: userDataDto | null;    
    try {
      user = await this.userService.verifyRefreshToken(refreshToken, payload.sub);
    } catch (error) {
      throw new ForbiddenException('Invalid refresh token');
    }
    if (!user) {
      throw new UnauthorizedException('User not found for this refresh token');
    }
    return user;
  }
}