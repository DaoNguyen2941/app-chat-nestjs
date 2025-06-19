import { IoAdapter } from '@nestjs/platform-socket.io';
import { JwtService } from '@nestjs/jwt';
import { ServerOptions } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { jwtConstants } from 'src/modules/auth/constants';
import { IExtendUserInSocket, IUserInSocket } from 'src/common/interface/Interface';
import { ManagerClientSocketService } from 'src/redis/services/managerClient.service';
import { JWTDecoded } from 'src/modules/auth/auth.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JOB_USER } from 'src/modules/queue/queue.constants';

@Injectable()
export class WebSocketAdapter extends IoAdapter {
  private readonly logger = new Logger(WebSocketAdapter.name);
  private readonly jwtService = new JwtService;

  constructor(
    private readonly SocketClientService: ManagerClientSocketService,
    @InjectQueue(JOB_USER.NAME) private readonly userQueue: Queue,
    private app: any
  ) {
    super(app);
  }
  createIOServer(port: number, options?: ServerOptions) {
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
      const [newClient, numberRemovieLastSeen] = await Promise.all([
        this.SocketClientService.addClientSocket(payload.sub, value),
        this.SocketClientService.removieLastSeenClientSocket(payload.sub)
      ])
      if (numberRemovieLastSeen === 0) {
        await this.userQueue.add(JOB_USER.DELETE_LAST_SEEN, { userId: payload.sub })
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
      // userId:string, time: Date}
      const time = new Date;
      const value = {
        userId: client.user.sub,
        time: time
      }
      await Promise.all([
        this.SocketClientService.setLastSeenClientSocket(client.user.sub, time),
        this.SocketClientService.removeClientSocket(client.user.sub)
      ])
      this.userQueue.add(JOB_USER.UPDATE_LAST_SEEN, value, { delay: 1000 * 60 * 60 })
    } catch (error) {
      this.logger.error(`❌ Error handling disconnect for socket ${client.id}: ${error.message}`);
    }
  }

}
