import jsonrpc, { IParsedObject, RequestObject } from 'jsonrpc-lite';
import { CommunicationType } from '../../common/src/communication/communicationType';
import { IMessage } from '../../common/src/communication/message/iMessage';
import { SocketIoReceiveTypes } from '../../common/src/communication/socketIoReceiveTypes';
import { SocketIoSendTypes } from '../../common/src/communication/socketIoSendTypes';
import { ConfigSocketIo } from '../../common/src/config/configSocketIo';
import { ICommunicationContainer } from './../../common/src/communication/message/iCommunicationContainer';
import { Communication } from './communication';

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

        socket.on(ConfigSocketIo.WS_ON_MESSAGE_ID, (message: string) => {
            // DEBUGGING:
            // console.log('incoming:' + message);
            // console.log(JSON.stringify(jsonrpc.parse(message)));

            const parsedMsg = JSON.parse(message);
            // console.log(JSON.stringify(parsedMsg, null, 4));
            const jsonRpcParsed = jsonrpc.parseObject(parsedMsg) as IParsedObject;;
            if (jsonRpcParsed.type === 'invalid') {
                console.error('incoming message is not a valid JSON-RPC - message');
                return;
            }
            const requestObject = jsonRpcParsed.payload as RequestObject;
            const incomingMessage = requestObject.params as ICommunicationContainer;
            // TODO: Forward to client
            // const successResponse = jsonrpc.success(requestObject.id, '');

            // console.log(JSON.stringify(incomingMessage, null, 4));
            try {
                // const incomingMessage = JSON.parse(message);
                // const incomingMessage = jsonrpc.parseJsonRpcString(parseJson(message)) as IParsedObject;
                // const incomingMessage = jsonrpc.parse(message) as IParsedObject;
                // console.log(JSON.stringify(incomingMessage, null, 4));

                // const requestObject: RequestObject = incomingMessage.payload as RequestObject;
                // const success = jsonrpc.success(requestObject.id, '');
                
                // // const parsedObject: IParsedObject | IParsedObject[] = jsonrpc.parseObject(incomingMessage);
                // // const jsonRpcMessage = parsedObject.payload as any;
                // console.log(JSON.stringify(success, null, 4));
            } catch (error: any) {
                console.log('error:'+ JSON.stringify(error, null, 4));
            }
        
            
            switch (incomingMessage.type) {
                case CommunicationType.AddUser:
                    const userId: string = incomingMessage.sourceUserId;
                    this.communication.addUser(userId);
                    break;
                case CommunicationType.Coordinates:
                    incomingMessage.targetUserId = this.communication.getTargetUser(incomingMessage.sourceUserId);
                    this.communication.emit(incomingMessage.targetUserId, incomingMessage);
                    break;
                case CommunicationType.TileState:
                    incomingMessage.targetUserId = this.communication.getTargetUser(incomingMessage.sourceUserId);
                    this.communication.emit(incomingMessage.targetUserId, incomingMessage);
                    break;
                case CommunicationType.RemainingTileState:
                    incomingMessage.targetUserId = this.communication.getTargetUser(incomingMessage.sourceUserId);
                    this.communication.emit(incomingMessage.targetUserId, incomingMessage);
                    break;
                case CommunicationType.GameWon:
                    incomingMessage.targetUserId = this.communication.getTargetUser(incomingMessage.sourceUserId);
                    incomingMessage.type = CommunicationType.GameWon;
                    this.communication.emit(incomingMessage.targetUserId, incomingMessage);
                    
                    const gameLostMsg: ICommunicationContainer = {
                        sourceUserId: incomingMessage.targetUserId as string,
                        targetUserId: incomingMessage.sourceUserId,
                        type: CommunicationType.GameLost
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
