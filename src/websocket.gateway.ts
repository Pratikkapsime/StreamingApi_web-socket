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

// Importing Dependencies for chatGpt
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

@WebSocketGateway()
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() wss: Server;

  private logger: Logger = new Logger('AppGateway');
  private openai: typeof OpenAIApi;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

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
  async handleRequest(client: Socket, text: string){
    try {
      const res = await this.openai.createChatCompletion(
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              content: text,
              role: "user",
            },
          ],
          max_tokens: 4000,
          temperature: 0,
          stream: true,
        },
        { responseType: "stream" }
      );

      res.data.on("data", (chunks) => {
        const lines = chunks
          .toString()
          .split("\n")
          .filter((line) => line.trim() !== "");
        for (const line of lines) {
          const message = line.replace(/^data: /, "");
          if (message === "[DONE]") {
            return; // Stream finished
          }
          try {
            const parsed = JSON.parse(message);
            const response = parsed.choices[0].delta.content;
            // console.log(parsed.choices[0].delta.content);
            this.wss.emit('msgToClient', response);
          } catch (error) {
            console.error("Could not JSON parse stream message", message, error);
          }
        }
      });
    } catch (error) {
      if (error.response?.status) {
        console.error(error.response.status, error.message);
        error.response.data.on("data", (data) => {
          const message = data.toString();
          try {
            const parsed = JSON.parse(message);
            console.error("An error occurred during OpenAI request: ", parsed);
          } catch (error) {
            console.error("An error occurred during OpenAI request: ", message);
          }
        });
      } else {
        console.error("An error occurred during OpenAI request", error);
      }
    }
  }
}
