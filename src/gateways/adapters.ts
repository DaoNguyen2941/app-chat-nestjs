import { IoAdapter } from '@nestjs/platform-socket.io';
import { JwtService } from '@nestjs/jwt';
import { ServerOptions } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { jwtConstants } from 'src/modules/auth/constants';
import { IExtendUserInSocket, IUserInSocket } from 'src/common/Interface';
import { ManagerClientSocketService } from 'src/redis/services/managerClient.service';
import { JWTDecoded } from 'src/modules/auth/auth.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JOB_USER } from 'src/modules/queue/queue.constants';
import { UserService } from 'src/modules/user/user.service';
@Injectable()
export class WebSocketAdapter extends IoAdapter {
  private readonly logger = new Logger(WebSocketAdapter.name);

  constructor(
    private readonly SocketClientService: ManagerClientSocketService,
    private readonly jwtService: JwtService, 
    @InjectQueue(JOB_USER.NAME) private readonly userQueue: Queue, 
  ) {
    console.log('WebSocketAdapter initialized')
    super();
  }
  createIOServer(port: number, options?: ServerOptions) {
    console.log('create server socket post ' + port);
    
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    server.on('connection', (client: IExtendUserInSocket) => {
      this.handleConnection(client);


      client.on('updateToken', (newToken: string) => {
        this.handleUpdateToken(client, newToken);
      })

      // Đăng ký sự kiện disconnect
      client.on('disconnect', () => {
        this.handleDisconnect(client);
      });
    });
    return server;
  }

  async handleUpdateToken(client: IExtendUserInSocket, newToken: string) {
    try {
      const payload: JWTDecoded = await this.jwtService.verifyAsync(newToken, {
        secret: jwtConstants.secret
      });

      if (!payload) {
        client.disconnect();
        return;
      }

      client.user = payload;
      client.handshake.auth.token = newToken;
    } catch (error) {
      client.disconnect();
    }
  }

  async handleConnection(client: IExtendUserInSocket): Promise<void> {
    console.log(123);
    
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload: JWTDecoded = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret
      });
      if (!payload) {
        client.disconnect();
        return;
      }
      client.user = payload

      const value: IUserInSocket = {
        sockeId: client.id,
        user: payload
      }
      const [newClient, removieLastSeen] = await Promise.all([
        this.SocketClientService.addClientSocket(payload.sub, value),
        this.SocketClientService.removieLastSeenClientSocket(payload.sub)
      ])
      if (removieLastSeen === 0) {
        await this.userQueue.add(JOB_USER.DELETE_LAST_SEEN, {userId: client.id})
      }
      client.join(payload.sub)
    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: IExtendUserInSocket): Promise<void> {
    
    try {
      if (!client.user || !client.user.sub) {
        return;
      }
      console.log(`usser ${client.user.sub} disconnect`);
      const time = new Date();
      const value = {
        userId: client.user.sub,
        time: time
      }
      await this.userQueue.add(JOB_USER.UPDATE_LAST_SEEN, value, { delay: 1000 * 60 * 1 })
      await this.SocketClientService.setLastSeenClientSocket(client.user.sub, time)
      await this.SocketClientService.removeClientSocket(client.user.sub);
    } catch (error) {
      this.logger.error(`❌ Error handling disconnect for socket ${client.id}: ${error.message}`);
    }
  }

}
