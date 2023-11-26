import { IMessage } from './../../common/src/communication/message/iMessage';
import { SocketIoReceiveTypes } from './../../common/src/communication/socketIoReceiveTypes';
import socketIo from 'socket.io';
import * as jsonrpclite from 'jsonrpc-lite';
import { WebSocketServer, ServerOptions } from 'ws';
import { ConfigSocketIo } from '../../common/src/config/configSocketIo';
import http from 'http';
import { resolve } from 'path';

export class Communication {
  private readonly NO_GAME_PARTNER_FOUND = '';
  private readonly NO_MATCHING_GAME_PARTNER = '';
  private userIdSocketId: any = {};
  private usersMap: any = {};
  private webSocketServers: { [key: string]: WebSocketServer } = {};

  constructor(private io: socketIo.Server) { }

  public closeConnections() {
    return new Promise((resolve: (data: any) => void) => {
      const userIds = Object.keys(this.webSocketServers);
      let index = 0;
      const loop = () => {
        if (index > userIds.length) {
          resolve(true);
          return;
        }
        const userId = userIds[index];
        // https://stackoverflow.com/questions/48753517/node-websockets-ws-wss-how-to-tell-if-i-closed-the-connection-or-they-did
        if (!userId){
          console.error('no user:' + userId);
          index++;
          loop();
          return;
        }
        const server = this.webSocketServers[userId];
        if (!server) {
          console.error('no server');
          index++;
          loop();
          return;
        }
        server.close(
          // ()=> {
          //   index++;
          //   loop();
          // }
          // (error?: any) => {
          //   console.error('error when closing:' + userId)
          //   console.error(JSON.stringify(error, null, 4));
          // }
        );
        console.log('closed connection for:' + userId);
        index++;
        loop();
      };
      // inital call
      loop();
    });
  }

  createWebsocketHostFor(userId: any, randomPort: number) {
    // https://github.com/bnielsen1965/ws-handshake/blob/master/wsserver.js
    const httpServer = http.createServer({

    });
    //  const url = ConfigSocketIo.SOCKET_IO_SERVER_URL_WS;
    // const url = ConfigSocketIo.SOCKET_IO_SERVER_URL_WS + ':' + randomPort;
    const config: ServerOptions = {
      // path: url,
      // port: randomPort,
      noServer: true
    };
    const ws = new WebSocketServer(config);
    console.log(JSON.stringify(config));
    ws.on(ConfigSocketIo.WS_CONNECT_ID, (innerWs: any) => {
      console.log('connected client on:' + randomPort);
      if (!userId) {
        console.error('there is no userid');
        return;
      }
      this.webSocketServers[userId] = innerWs;
      innerWs.on(ConfigSocketIo.WS_ON_MESSAGE_ID, (rawMessage: any) => {
        const parsedMessage = JSON.parse(rawMessage);
        console.log(JSON.stringify(parsedMessage));
        innerWs.send(JSON.stringify({ message: 'pong' }));
      });
    });
    httpServer.on('upgrade', (request, socket, head) => {
      // https://github.com/websockets/ws
      ws.handleUpgrade(request, socket, head, (innerWs) => {
        ws.emit('connection', innerWs, request);
      });
    });
    httpServer.listen(randomPort, 'localhost');
  }

  public emitRequest(msg: IMessage, socketId: string) {
    // this.debugPrint(msg);

    msg.targetUserId = this.getTargetUser(msg.sourceUserId);
    // http://stackoverflow.com/questions/24041220/sending-message-to-a-specific-id-in-socket-io-1-0
    const targetSocketId: string = this.userIdSocketId[msg.targetUserId as string];
    const jsonrpcMessage = jsonrpclite.request(socketId, 'post', msg);
    console.log(msg.type);
    console.log(JSON.stringify(jsonrpcMessage, null, 4));
    this.io.to(targetSocketId).emit(msg.type, jsonrpcMessage);
  }


  public emitResponse(msg: IMessage, socketId: string) {
    // this.debugPrint(msg);

    msg.targetUserId = this.getTargetUser(msg.sourceUserId);
    // http://stackoverflow.com/questions/24041220/sending-message-to-a-specific-id-in-socket-io-1-0
    const targetSocketId: string = this.userIdSocketId[msg.targetUserId as string];
    const jsonrpcMessage = jsonrpclite.success(socketId, 'OK');
    console.log(msg.type);
    console.log(JSON.stringify(jsonrpcMessage, null, 4));
    this.io.to(targetSocketId).emit(msg.type, jsonrpcMessage);
  }

  public addUser(userId: string, socketId: string, incomingMsg: IMessage) {
    this.userIdSocketId[userId] = socketId;
    const foundGamePartnerId = this.searchMatchingGamePartner(userId);
    if (foundGamePartnerId === this.NO_GAME_PARTNER_FOUND) {
      this.usersMap[userId] = this.NO_MATCHING_GAME_PARTNER;
    } else {
      const beginningUserByGamble = this.gambleBeginningUser(
        userId,
        foundGamePartnerId
      );
      const msg: IMessage = {
        type: SocketIoReceiveTypes.BeginningUser,
        targetUserId: beginningUserByGamble,
        sourceUserId: userId
      };
      this.emitRequest(msg, socketId);
    }
  }

  public removeUser(userId: string) {
    const gamePartnerUserId = this.usersMap[userId];
    delete this.usersMap[userId];
    if (this.usersMap.hasOwnProperty(gamePartnerUserId)) {
      this.usersMap[gamePartnerUserId] = this.NO_MATCHING_GAME_PARTNER;
    }
    if (this.userIdSocketId[userId]) {
      delete this.userIdSocketId[userId];
    }
  }

  public getTargetUser(sourceUser: string) {
    return this.usersMap[sourceUser];
  }

  private gambleBeginningUser(userId: string, foundGamePartner: string) {
    const gamePartners = [userId, foundGamePartner];
    const randomBoolean = Math.random() >= 0.5;
    const randomInt = randomBoolean ? 1 : 0;
    return gamePartners[randomInt];
  }

  private searchMatchingGamePartner(incomingUserId: string): string {
    for (const outGoingUserId in this.usersMap) {
      if (this.usersMap.hasOwnProperty(outGoingUserId)) {
        if (this.usersMap[outGoingUserId] === this.NO_MATCHING_GAME_PARTNER) {
          this.usersMap[outGoingUserId] = incomingUserId;
          this.usersMap[incomingUserId] = outGoingUserId;
          return outGoingUserId;
        }
      }
    }
    return this.NO_GAME_PARTNER_FOUND;
  }

  private debugPrint(msg: IMessage) {
    console.log('outgoing-message:')
    console.log(JSON.stringify(msg, null, 4));
  }
}
