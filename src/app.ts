import { MessageForwarder } from './messageForwarder';
import { Application, Response, Request } from 'express';
import express from 'express';
import { Server } from 'http';
import http from 'http';
import socketIo, { Socket, Server as SocketIoServer } from 'socket.io';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';

import { Communication } from './communication';

import { ConfigSocketIo } from './../../common/src/config/configSocketIo';
import { IMessage } from '../../common/src/communication/message/iMessage';
import { randomInt } from 'crypto';
// import { SocketIoSendTypes } from './../../common/src/communication/socketIoSendTypes';
// import { SocketIoReceiveTypes } from '../../common/src/communication/socketIoReceiveTypes';

// import { IMessage } from '../../common/src/communication/message/iMessage';
// import { ICoordinatesMessage } from './../../common/src/communication/message/iCoordinatesMessage';
// import { ITileStateMessage } from './../../common/src/communication/message/iTileStateMessage';

export class App {
    private express: Application;
    private server: Server;
    // private io: SocketIoServer<any>;
    // private socket: Socket;
    private ws: any;
    private communication: Communication;
    private messageForwarder: MessageForwarder;

    constructor() {
        this.express = express();
        this.server = http.createServer(this.express);
        // const options: socketIo.ServerOptions = {};
        // this.io = new SocketIoServer(this.server);
        this.communication = new Communication();
        this.messageForwarder = new MessageForwarder(this.communication, ConfigSocketIo.PORT);
    }

    public configureExpress() {
        const absolutePathToAppJs = process.argv[1];
        const relativePathToAppJs: string = './../../../client/dist/client';
        const pathStr: string = path.resolve(absolutePathToAppJs, relativePathToAppJs);

        // DEBUGGING:
        // console.log(absolutePathToAppJs);
        // console.log(relativePathToAppJs);
        // console.log(pathStr);

        this.express.use(express.static(pathStr));

        // https://stackoverflow.com/questions/25216761/express-js-redirect-to-default-page-instead-of-cannot-get
        // https://stackoverflow.com/questions/30546524/making-angular-routes-work-with-express-routes
        // https://stackoverflow.com/questions/26917424/angularjs-and-express-routing-404
        // https://stackoverflow.com/questions/26079611/node-js-typeerror-path-must-be-absolute-or-specify-root-to-res-sendfile-failed
        this.express.get('*', (request: Request, response: Response) => {
            // DEBUGGING:
            // console.log(request.url);
            // console.log(pathStr);
            response.sendFile('index.html', { root: pathStr });
        });
    }

    public listen() {
        const port: number = ConfigSocketIo.PORT;
        this.server.listen(port, () => {
            // DEBUGGING:
            console.info('listening on:' + port);
        });

        // this.io.on(ConfigSocketIo.SOCKET_IO_CONNECT_ID, (socket: Socket) => {
        //     // DEBUGGING:
        //     console.error('client connected on port:' + port);

        //     const socketId: string = socket.id;
        //     this.messageForwarder.registerOnSocket(socketId, socket);
        // });

        // https://javascript-conference.com/blog/real-time-in-angular-a-journey-into-websocket-and-rxjs/
        // port: ConfigSocketIo.PORT_WS, path: ConfigSocketIo.SOCKET_IO_SERVER_URL_WS
        const wss = new WebSocketServer<any, any>({ server: this.server, });
        wss.on(ConfigSocketIo.WS_CONNECT_ID, (ws: any, socket: any) => {
            this.ws = ws;
            this.communication.setWS(ws);

            const randomId : string = randomInt(10000).toString();
            console.info('client connected on port:' + port + 'id:' + randomId);
            this.messageForwarder.registerOnSocket(randomId, ws);
            // onConnection(ws);
            //     ws.on('message', message => {
            //       onMessage(message, ws);
            //     });
            //     ws.on('error', error => {
            //       OnError(error);
            //     });
            //      ws.on('close', ws=> {
            //       onClose();
            //   })
        });
    }

    public shutdown(): Promise<boolean> {
        return new Promise<boolean>((resolve: (value: boolean) => void, reject: (value: any) => void) => {
            // https://stackoverflow.com/questions/18126677/node-js-socket-io-close-client-connection
            this.messageForwarder.shutdown();
            console.error('shutdown of sockets completed');
            // https://hackernoon.com/graceful-shutdown-in-nodejs-2f8f59d1c357
            this.server.close((err: any) => {
                if (err) {
                    console.error('error when closing the http-server');
                    // console.error(err);
                    // console.error(JSON.stringify(err, null, 4));
                    reject(err);
                    return;
                }
                console.error('http-server successfully closed');

                // this.io.close(() => {
                //     console.error('socketIO.server closed');
                // });
                this.ws.close(
                    () => {
                        console.info('ws - server: closed');
                    }
                );


                resolve(true)
            });
        });
    }
}
