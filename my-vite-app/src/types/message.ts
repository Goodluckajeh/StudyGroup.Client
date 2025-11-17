// Message Types
export interface Message {
  messageId: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderEmail: string;
  messageType: 'Text' | 'Image' | 'Video' | 'File' | 'Link';
  content?: string;
  mediaUrl?: string;
  mediaFileName?: string;
  mediaFileSize?: number;
  thumbnailUrl?: string;
  sentAt: string;
  editedAt?: string;
  isDeleted: boolean;
  replyToMessageId?: number;
  replyToMessage?: Message;
}

export interface CreateMessageDto {
  conversationId: number;
  senderId: number;
  messageType: string;
  content?: string;
  mediaUrl?: string;
  mediaFileName?: string;
  mediaFileSize?: number;
  replyToMessageId?: number;
}

export interface UpdateMessageDto {
  content?: string;
}

// Conversation Types
export interface Conversation {
  conversationId: number;
  conversationType: 'DirectMessage' | 'GroupChat';
  studyGroupId?: number;
  studyGroupName?: string;
  createdAt: string;
  lastMessageAt?: string;
  isActive: boolean;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface ConversationParticipant {
  participantId: number;
  conversationId: number;
  userId: number;
  userName: string;
  email: string;
  joinedAt: string;
  lastReadAt?: string;
  isActive: boolean;
}

export interface CreateConversationDto {
  conversationType: 'DirectMessage' | 'GroupChat';
  studyGroupId?: number;
  participantUserIds: number[];
}

export interface StartDirectMessageDto {
  recipientUserId: number;
  initialMessage?: string;
}
