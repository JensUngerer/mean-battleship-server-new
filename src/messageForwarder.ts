import { Communication } from './communication';
import { Socket } from "socket.io";
import { ConfigSocketIo } from '../../common/src/config/configSocketIo';
import { SocketIoSendTypes } from '../../common/src/communication/socketIoSendTypes';
import { IMessage } from '../../common/src/communication/message/iMessage';
import { ICoordinatesMessage } from '../../common/src/communication/message/iCoordinatesMessage';
import { SocketIoReceiveTypes } from '../../common/src/communication/socketIoReceiveTypes';
import { ITileStateMessage } from '../../common/src/communication/message/iTileStateMessage';

export class MessageForwarder {

    private socketIdUserId: { [key: string]: string } = {};
    private socketIdSocket: { [key: string]: Socket } = {};
    constructor(private communication: Communication, private port: number) { }

    public shutdown() {
        for (const socketId in this.socketIdSocket) {
            if (this.socketIdSocket.hasOwnProperty(socketId)) {
                const socket: Socket = this.socketIdSocket[socketId];
                socket.disconnect(true);
            }
        }
    }

    public registerOnSocket(socketId: string, socket: Socket) {
        this.socketIdSocket[socketId] = socket;

        socket.on(ConfigSocketIo.SOCKET_IO_DISCONNECT_ID, () => {
            // DEBUGGING:
            console.log('client disconnected on port:' + this.port);

            this.communication.removeUser(this.socketIdUserId[socketId]);
            delete this.socketIdUserId[socketId];
        });

        socket.on(SocketIoSendTypes.StartGame, (incomingMessage: IMessage) => {
            // this.debugPrintMessage(incomingMessage);
            const userId: string = incomingMessage.sourceUserId;
            this.socketIdUserId[userId] = userId;
            this.communication.addUser(userId, socketId);
        });

        socket.on(SocketIoSendTypes.Coordinates, (incomingMessage: ICoordinatesMessage) => {
            // this.debugPrintMessage(incomingMessage);
            incomingMessage.type = SocketIoReceiveTypes.Coordinates;
            this.communication.emit(incomingMessage);
        });

        socket.on(SocketIoSendTypes.TileState, (incomingMessage: ITileStateMessage) => {
            // this.debugPrintMessage(incomingMessage);
            incomingMessage.type = SocketIoReceiveTypes.TileState;
            this.communication.emit(incomingMessage);
        });

        socket.on(SocketIoSendTypes.RemainingTileState, (incomingMessage: ITileStateMessage) => {
            // this.debugPrintMessage(incomingMessage);
            incomingMessage.type = SocketIoReceiveTypes.RemainingTileState;
            this.communication.emit(incomingMessage);
        });

        socket.on(SocketIoSendTypes.GameWon, (incomingMessage: IMessage) => {
            // this.debugPrintMessage(incomingMessage);
            incomingMessage.type = SocketIoReceiveTypes.GameWon;
            this.communication.emit(incomingMessage);
        });
    }

    private debugPrintMessage(msg: IMessage) {
        console.error('incoming-message');
        console.error(JSON.stringify(msg, null, 4));
    }
}
