import { Socket } from 'socket.io';
import { JWTDecoded } from 'src/modules/auth/auth.dto';
export interface IParamsId {
  id: string;
}

export interface IParamsUserId {
  userId: string;
}

export interface IParamsKeyWord {
  keyword: string;
}

export interface IExtendUserInSocket extends Socket {
  user: JWTDecoded
}

export interface IUserInSocket {
  user: JWTDecoded
  sockeId:string
}