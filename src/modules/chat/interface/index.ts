import { MessageDataDto } from "../dto/message.dto";

export interface IGroupConversationResult {
    newChatUserIds: string[];
    usersWithExistingChat: string[];
  }
  
  interface OutgoingMessageBase {
    messageData: MessageDataDto;
    chatId: string;
    isGroup: boolean;
  }
  
  export interface IOutgoingMessageData extends OutgoingMessageBase {
    receiverId: string;
    isNewChat: boolean;
  }
  
  export interface IOutgoingMessageGroupData extends OutgoingMessageBase {
    receiverId: IGroupConversationResult;
  }