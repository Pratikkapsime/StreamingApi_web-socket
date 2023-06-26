import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  OnGatewayInit,
} from '@nestjs/websockets';

import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() wss: Server;

  private logger: Logger = new Logger('AppGateway');

  afterInit(server: Server){
    this.logger.log('Initialized!');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('msgToServer')
  handleRequest(client: Socket, text: string){
    // client.emit('msgToClient', text);
    const response = 'This is the response, I am returning in chunk'.repeat(100);
    this.wss.emit('msgToClient',response);
  }
}



/*


    const chunkSize = 1000; 
    const totalChunks = Math.ceil(response.length / chunkSize);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = start + chunkSize;
      const chunk = response.slice(start, end);

      await new Promise((resolve) => {
        setTimeout(() => {
          client.emit('responseChunk', chunk);
          resolve();
        }, 500); 
      });
    }
    // Send a signal to indicate the end of response
    client.emit('responseEnd');

*/