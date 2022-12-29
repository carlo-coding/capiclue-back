import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import {
  MessageBody,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets/decorators';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { IUserAuthPayload } from 'src/auth/user.auth.payload';
import { JoinChatDto } from './dto/JoinChatDto';
import { SendMessageDto } from './dto/SendMessageDto';
import { LeaveChatDto } from './dto/LeaveChatDto';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets/errors';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  Server: Server;
  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  private getUserFromClient(client: Socket) {
    const token = client.request.headers.authorization;
    let info: IUserAuthPayload;
    try {
      info = this.jwtService.verify(token);
    } catch (err) {
      throw new WsException('Token expired');
    }
    if (info === null) {
      throw new WsException('Not authorized');
    }
    return info;
  }

  @SubscribeMessage('event_leave')
  handleChatLeave(
    @MessageBody() data: LeaveChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`chat_${data.chatId}`);
  }

  @SubscribeMessage('event_join')
  async handleChatJoin(
    @MessageBody() data: JoinChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.getUserFromClient(client);
    const chatId = await this.chatService.getChatId(user.userId, data.friendId);
    client.join(`chat_${chatId}`);
    client.emit('event_chatId', { chatId });
  }

  @SubscribeMessage('event_send')
  async listenForMessages(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.getUserFromClient(client);
    const message = await this.chatService.saveMessage(data, user.userId);
    this.Server.to(`chat_${data.chatId}`).emit('event_receive', message);
  }
}
