import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
 
@Injectable()
export default class JwtResetPasswordGuard extends AuthGuard('jwt-reset-password') {}