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
            // TODO: process 'add user' == StartGame ...
            console.log('incoming:' + message);
        });

        // socket.on(SocketIoSendTypes.StartGame, (incomingMessage: IMessage) => {
        //     this.debugPrintMessage(incomingMessage);
        //     const userId: string = incomingMessage.sourceUserId;
        //     // this.communication.emit(incomingMessage, socketId);
            
        //     this.socketIdUserId[userId] = userId;
        //     this.communication.addUser(userId, socketId, incomingMessage);
        // });

        // socket.on(SocketIoSendTypes.Coordinates, (incomingMessage: ICoordinatesMessage) => {
        //     this.debugPrintMessage(incomingMessage);
        //     // this.communication.emit(incomingMessage, socketId);
        //     incomingMessage.type = SocketIoReceiveTypes.Coordinates;
        //     this.communication.emit(incomingMessage, socketId);
        // });

        // socket.on(SocketIoSendTypes.TileState, (incomingMessage: ITileStateMessage) => {
        //     this.debugPrintMessage(incomingMessage);
        //     // this.communication.emit(incomingMessage, socketId);
        //     incomingMessage.type = SocketIoReceiveTypes.TileState;
        //     this.communication.emit(incomingMessage, socketId);
        // });

        // socket.on(SocketIoSendTypes.RemainingTileState, (incomingMessage: ITileStateMessage) => {
        //     this.debugPrintMessage(incomingMessage);
        //     // this.communication.emit(incomingMessage, socketId);

        //     incomingMessage.type = SocketIoReceiveTypes.RemainingTileState;
        //     this.communication.emit(incomingMessage, socketId);
        // });

        // socket.on(SocketIoSendTypes.GameWon, (incomingMessage: IMessage) => {
        //     this.debugPrintMessage(incomingMessage);
        //     // this.communication.emit(incomingMessage, socketId);

        //     incomingMessage.type = SocketIoReceiveTypes.GameWon;
        //     this.communication.emit(incomingMessage, socketId);
        // });
    }

    private debugPrintMessage(msg: IMessage) {
        console.error('incoming-message');
        console.error(JSON.stringify(msg, null, 4));
    }
}
