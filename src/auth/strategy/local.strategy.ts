import { Strategy } from 'passport-local';
import { PassportStrategy, } from '@nestjs/passport';
import { Injectable, UnauthorizedException, } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { userDataDto } from 'src/user/user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "local") {
  constructor(private authService: AuthService) {
    super({ usernameField: 'account', passwordField: 'password', })
  }

  async validate(account: string, password: string,): Promise<userDataDto> {
    const user: userDataDto | null = await this.authService.validateUser(account, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}