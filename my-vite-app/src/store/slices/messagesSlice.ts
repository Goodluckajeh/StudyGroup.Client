import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import messageService from '../../services/messageService';
import type { Message, Conversation } from '../../types/message';

// Types
interface MessagesState {
  conversations: { [groupId: number]: Conversation };
  messages: { [conversationId: number]: Message[] };
  loading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  conversations: {},
  messages: {},
  loading: false,
  error: null,
};

// Async Thunks
export const getOrCreateGroupConversation = createAsyncThunk(
  'messages/getOrCreateGroupConversation',
  async (groupId: number, { rejectWithValue }) => {
    try {
      const conversation = await messageService.getOrCreateGroupConversation(groupId);
      return { groupId, conversation };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.Error || 'Failed to get conversation');
    }
  }
);

export const fetchConversationMessages = createAsyncThunk(
  'messages/fetchConversationMessages',
  async (conversationId: number, { rejectWithValue }) => {
    try {
      const messages = await messageService.getConversationMessages(conversationId);
      return { conversationId, messages };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.Error || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (messageData: {
    conversationId: number;
    senderId: number;
    messageType: 'Text' | 'Image' | 'Link';
    content: string;
    mediaUrl?: string;
    mediaFileName?: string;
    mediaFileSize?: number;
  }, { rejectWithValue }) => {
    try {
      const message = await messageService.sendMessage(messageData);
      return message;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.Error || 'Failed to send message');
    }
  }
);

// Slice
const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const conversationId = message.conversationId;
      
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      // Prevent duplicates by checking messageId
      const exists = state.messages[conversationId].some(m => m.messageId === message.messageId);
      if (!exists) {
        state.messages[conversationId].push(message);
      }
    },
    
    updateMessage: (state, action: PayloadAction<{ conversationId: number; message: Message }>) => {
      const { conversationId, message } = action.payload;
      
      if (state.messages[conversationId]) {
        const index = state.messages[conversationId].findIndex(m => m.messageId === message.messageId);
        if (index !== -1) {
          state.messages[conversationId][index] = message;
        }
      }
    },
    
    deleteMessage: (state, action: PayloadAction<{ conversationId: number; messageId: number }>) => {
      const { conversationId, messageId } = action.payload;
      
      if (state.messages[conversationId]) {
        const index = state.messages[conversationId].findIndex(m => m.messageId === messageId);
        if (index !== -1 && state.messages[conversationId][index]) {
          const message = state.messages[conversationId][index];
          message.isDeleted = true;
          message.content = 'Message deleted';
        }
      }
    },
    
    clearConversationMessages: (state, action: PayloadAction<number>) => {
      const conversationId = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get or Create Conversation
      .addCase(getOrCreateGroupConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrCreateGroupConversation.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId, conversation } = action.payload;
        state.conversations[groupId] = conversation;
      })
      .addCase(getOrCreateGroupConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Messages
      .addCase(fetchConversationMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversationMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId, messages } = action.payload;
        state.messages[conversationId] = messages;
      })
      .addCase(fetchConversationMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        const message = action.payload;
        const conversationId = message.conversationId;
        
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        
        // Add message if not already present (optimistic update may have added it)
        const exists = state.messages[conversationId].some(m => m.messageId === message.messageId);
        if (!exists) {
          state.messages[conversationId].push(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addMessage, updateMessage, deleteMessage, clearConversationMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
