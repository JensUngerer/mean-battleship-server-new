import { Communication } from './communication';
import { Socket } from "socket.io";
import { ConfigSocketIo } from '../../common/src/config/configSocketIo';
import { SocketIoSendTypes } from '../../common/src/communication/socketIoSendTypes';
import { IMessage } from '../../common/src/communication/message/iMessage';
import { ICoordinatesMessage } from '../../common/src/communication/message/iCoordinatesMessage';
import { SocketIoReceiveTypes } from '../../common/src/communication/socketIoReceiveTypes';
import { ITileStateMessage } from '../../common/src/communication/message/iTileStateMessage';

export class MessageForwarder {

    // private socketIdUserId: { [key: string]: string } = {};
    // private socketIdSocket: { [key: string]: Socket } = {};
    constructor(private communication: Communication, private port: number) { }

    // public shutdown() {
    //     for (const socketId in this.socketIdSocket) {
    //         if (this.socketIdSocket.hasOwnProperty(socketId)) {
    //             const socket: Socket = this.socketIdSocket[socketId];
    //             socket.disconnect(true);
    //         }
    //     }
    // }

    public registerOnSocket(userId: string, socket: any) {
        // this.socketIdSocket[socketId] = socket;

        socket.on(ConfigSocketIo.WS_CLOSE_ID, () => {
            // DEBUGGING:
            console.log('client disconnected on port:' + this.port);

            this.communication.removeUser(userId);
        });

        socket.on(ConfigSocketIo.WS_ON_MESSAGE_ID, (message: any) => {
            // DEBUGGING:
            console.log('incoming:' + message);
            const incomingMessage = JSON.parse(message);

            switch (incomingMessage.type) {
                case SocketIoSendTypes.StartGame:
                    this.debugPrintMessage(incomingMessage);
                    const userId: string = incomingMessage.sourceUserId;
                    // this.communication.emit(incomingMessage, socketId);

                    this.communication.addUser(userId);
                    break;
                case SocketIoSendTypes.Coordinates:
                    this.debugPrintMessage(incomingMessage);
                    // this.communication.emit(incomingMessage, socketId);
                    incomingMessage.targetUserId = this.communication.getTargetUser(incomingMessage.sourceUserId);
                    incomingMessage.type = SocketIoReceiveTypes.Coordinates;
                    this.communication.emit(incomingMessage.targetUserId, incomingMessage);
                    break;
                case SocketIoSendTypes.TileState:
                    this.debugPrintMessage(incomingMessage);
                    // this.communication.emit(incomingMessage, socketId);
                    incomingMessage.targetUserId = this.communication.getTargetUser(incomingMessage.sourceUserId);
                    incomingMessage.type = SocketIoReceiveTypes.TileState;
                    this.communication.emit(incomingMessage.targetUserId, incomingMessage);
                    break;
                case SocketIoSendTypes.RemainingTileState:
                    this.debugPrintMessage(incomingMessage);
                    // this.communication.emit(incomingMessage, socketId);
                    incomingMessage.targetUserId = this.communication.getTargetUser(incomingMessage.sourceUserId);
                    incomingMessage.type = SocketIoReceiveTypes.RemainingTileState;
                    this.communication.emit(incomingMessage.targetUserId, incomingMessage);
                    break;
                case SocketIoSendTypes.GameWon:
                    this.debugPrintMessage(incomingMessage);
                    // this.communication.emit(incomingMessage, socketId);
                    incomingMessage.targetUserId = this.communication.getTargetUser(incomingMessage.sourceUserId);
                    incomingMessage.type = SocketIoReceiveTypes.GameWon;
                    this.communication.emit(incomingMessage.targetUserId, incomingMessage);
                    const gameLostMsg: IMessage = {
                        sourceUserId: incomingMessage.targetSocketId,
                        targetUserId: incomingMessage.sourceUserId,
                        type: SocketIoReceiveTypes.GameLost
                    };
                    this.communication.emit(gameLostMsg.targetUserId, gameLostMsg);
                    break;
                default:
                    console.log(JSON.stringify(incomingMessage, null, 4));
                    break;
            }
        });
    }

    private debugPrintMessage(msg: IMessage) {
        console.error('incoming-message:');
        console.error(JSON.stringify(msg, null, 4));
    }
}
