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
    const response = 'This is the response, I am returning in chunk.'.repeat(50);
    const chunkSize = 15; 
    const totalChunks = Math.ceil(response.length / chunkSize);
    let currentChunkIndex = 0;

    //logic for sending chunks response
    //executed repeatedly at the specified interval 500 milliseconds
    const intervalId = setInterval(() => { 
      if (currentChunkIndex >= totalChunks) {
        clearInterval(intervalId);      //the execution of the recurring function is stopped 
        this.wss.emit('responseEnd');
        return;
      }

      const start = currentChunkIndex * chunkSize;
      const end = start + chunkSize;
      const chunk = response.slice(start, end);

      this.wss.emit('msgToClient',chunk );

      currentChunkIndex++;
    }, 500);
    // this.wss.emit('msgToClient',response);
  }
}
