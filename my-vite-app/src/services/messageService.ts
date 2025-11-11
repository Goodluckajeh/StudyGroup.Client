import apiClient from '../config/api';
import type { 
  Message, 
  CreateMessageDto, 
  Conversation,
  StartDirectMessageDto 
} from '../types/message';

export const messageService = {
  // Get messages for a conversation
  async getConversationMessages(
    conversationId: number, 
    skip: number = 0, 
    take: number = 50
  ): Promise<Message[]> {
    const response = await apiClient.get(
      `/messages/conversations/${conversationId}/messages`,
      { params: { skip, take } }
    );

    return response.data.messages || response.data.Messages || [];
  },

  // Send a new message
  async sendMessage(messageData: CreateMessageDto): Promise<Message> {
    const response = await apiClient.post('/messages', messageData);

    return response.data.message || response.data.Message;
  },

  // Edit a message
  async editMessage(messageId: number, content: string): Promise<Message> {
    const response = await apiClient.put(`/messages/${messageId}`, { content });
    return response.data;
  },

  // Delete a message
  async deleteMessage(messageId: number): Promise<void> {
    await apiClient.delete(`/messages/${messageId}`);
  },

  // Mark messages as read
  async markAsRead(conversationId: number): Promise<void> {
    await apiClient.post(`/messages/conversations/${conversationId}/mark-read`);
  },

  // Get user's conversations
  async getUserConversations(): Promise<Conversation[]> {
    const response = await apiClient.get('/messages/conversations');
    return response.data;
  },

  // Get a specific conversation
  async getConversation(conversationId: number): Promise<Conversation> {
    const response = await apiClient.get(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  // Start a direct message
  async startDirectMessage(data: StartDirectMessageDto): Promise<Conversation> {
    const response = await apiClient.post('/messages/conversations/direct', data);
    return response.data;
  },

  // Get or create group conversation
  async getOrCreateGroupConversation(studyGroupId: number): Promise<Conversation> {
    const response = await apiClient.get(`/conversations/study-group/${studyGroupId}`);
    
    // ASP.NET Core serializes with camelCase by default
    const conversation = response.data.conversation || response.data.Conversation;
    
    if (!conversation) {
      console.error(' No conversation in response! Response data:', response.data);
      throw new Error('No conversation data returned from API');
    }
    
    return conversation;
  }
};

export default messageService;
