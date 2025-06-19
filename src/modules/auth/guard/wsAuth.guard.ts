import { Injectable } from '@nestjs/common';
import { ExecutionContext, CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { WsException } from '@nestjs/websockets'; 
import { JWTDecoded } from '../auth.dto';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth.token; 
    if (!token) {
      client.disconnect(true);
      throw new WsException('Token not found');
    }
    try {
      const decoded: JWTDecoded = this.jwtService.verify(token); 
      client.handshake.auth.user = decoded; 
      return true;
    } catch (error) {
      client.disconnect(true);
      throw new WsException('Invalid or expired token');
    }
  }
}
