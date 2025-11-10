import * as signalR from '@microsoft/signalr';
import type { Message } from '../types/message';

class ChatService {
  private connection: signalR.HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async start(token: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR already connected');
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:43960/chatHub', {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
            // Exponential backoff: 0s, 2s, 10s, 30s, 60s
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 60000);
          }
          return null; // Stop reconnecting
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Connection lifecycle events
    this.connection.onclose((error) => {
      console.log('SignalR connection closed', error);
      this.reconnectAttempts = 0;
    });

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting...', error);
      this.reconnectAttempts++;
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected', connectionId);
      this.reconnectAttempts = 0;
    });

    try {
      await this.connection.start();
      console.log('✅ SignalR Connected');
    } catch (err) {
      console.error('SignalR Connection Error:', err);
      throw err;
    }
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      console.log('SignalR Disconnected');
    }
  }

  // Message Events
  onReceiveMessage(callback: (message: Message) => void): void {
    // Remove any existing handlers first to avoid duplicates
    this.connection?.off('ReceiveMessage');
    this.connection?.on('ReceiveMessage', (data: any) => {
      callback(data);
    });
  }

  onMessageEdited(callback: (message: Message) => void): void {
    this.connection?.off('MessageEdited');
    this.connection?.on('MessageEdited', callback);
  }

  onMessageDeleted(callback: (messageId: number, conversationId: number) => void): void {
    this.connection?.off('MessageDeleted');
    this.connection?.on('MessageDeleted', callback);
  }

  // User Events
  onUserJoined(callback: (conversationId: number, userId: number, userName: string) => void): void {
    this.connection?.off('UserJoined');
    this.connection?.on('UserJoined', callback);
  }

  onUserLeft(callback: (conversationId: number, userId: number, userName: string) => void): void {
    this.connection?.off('UserLeft');
    this.connection?.on('UserLeft', callback);
  }

  onUserTyping(callback: (conversationId: number, userId: number, userName: string) => void): void {
    this.connection?.off('UserTyping');
    this.connection?.on('UserTyping', callback);
  }

  // Send typing indicator
  async sendTypingIndicator(conversationId: number): Promise<void> {
    try {
      await this.connection?.invoke('SendTypingIndicator', conversationId);
    } catch (err) {
      console.error('Error sending typing indicator:', err);
    }
  }

  // Join/Leave conversation rooms
  async joinConversation(conversationId: number): Promise<void> {
    try {
      await this.connection?.invoke('JoinConversation', conversationId);
      console.log(`Joined conversation ${conversationId}`);
    } catch (err) {
      console.error('Error joining conversation:', err);
    }
  }

  async leaveConversation(conversationId: number): Promise<void> {
    try {
      await this.connection?.invoke('LeaveConversation', conversationId);
      console.log(`Left conversation ${conversationId}`);
    } catch (err) {
      console.error('Error leaving conversation:', err);
    }
  }

  getConnectionState(): signalR.HubConnectionState {
    return this.connection?.state || signalR.HubConnectionState.Disconnected;
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export const chatService = new ChatService();
export default chatService;
