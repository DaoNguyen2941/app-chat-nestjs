import { IoAdapter } from '@nestjs/platform-socket.io';
import { JwtService } from '@nestjs/jwt';
import { ServerOptions } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { jwtConstants } from 'src/modules/auth/constants';
import { IExtendUserInSocket, IUserInSocket } from 'src/common/Interface';
import { ManagerClientSocketService } from 'src/redis/managerClient.service';
import { JWTDecoded } from 'src/modules/auth/auth.dto';

@Injectable()
export class WebSocketAdapter extends IoAdapter {
  private readonly logger = new Logger(WebSocketAdapter.name);
  private readonly jwtService = new JwtService;
 
  constructor(
    private readonly SocketClientService: ManagerClientSocketService,
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
        this.logger.warn(`Invalid token received from ${client.id}, disconnecting...`);
        client.disconnect();
        return;
      }

      client.user = payload;
      client.handshake.auth.token = newToken;

      this.logger.log(`🔄 Token updated for user ${payload.sub}`);

    } catch (error) {
      this.logger.error(`❌ Token update failed for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  async handleConnection(client: IExtendUserInSocket): Promise<void> {
    const token = client.handshake.auth?.token;
    if (!token) {
      this.logger.warn(`Client ${client.id} missing token, disconnecting...`);
      client.disconnect();
      return;
    }
    try {
      const payload: JWTDecoded = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret
      });
      if (!payload) {
        this.logger.warn(`Client ${client.id} provided invalid token`);
        client.disconnect();
        return;
      }
      client.user = payload

      const value: IUserInSocket = {
        sockeId: client.id,
        user: payload
      }

      await this.SocketClientService.addClientSocket(payload.sub, value);
      this.logger.log(`User ${payload.sub} connected with socket ${client.id}`);
      client.join(payload.sub)
    } catch (error) {
      this.logger.error(`❌ Token verification failed for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: IExtendUserInSocket): void {
    try {
      if (!client.user || !client.user.sub) {
        this.logger.warn(`Client ${client.id} disconnected without user data`);
        return;
      }
      this.SocketClientService.removeClientSocket(client.user.sub);
      this.logger.log(`❌ User ${client.user.sub} disconnected, socket: ${client.id}`);
    } catch (error) {
      this.logger.error(`❌ Error handling disconnect for socket ${client.id}: ${error.message}`);
    }
  }

}
