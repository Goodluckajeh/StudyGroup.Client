import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Link as MuiLink,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { getOrCreateGroupConversation, fetchConversationMessages, sendMessage as sendMessageThunk, addMessage, updateMessage as updateMessageAction, deleteMessage as deleteMessageAction } from '../store/slices/messagesSlice';
import messageService from '../services/messageService';
import chatService from '../services/chatService';
import type { Message, Conversation } from '../types/message';

interface ChatProps {
  studyGroupId: number;
  studyGroupName: string;
}

const Chat = ({ studyGroupId, studyGroupName }: ChatProps) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const conversation = useAppSelector((state) => state.messages.conversations[studyGroupId]);
  const messages = useAppSelector((state) => 
    conversation ? state.messages.messages[conversation.conversationId] || [] : []
  );
  const loading = useAppSelector((state) => state.messages.loading);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [attachMenuAnchor, setAttachMenuAnchor] = useState<null | HTMLElement>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const conversationRef = useRef<Conversation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = useCallback(async () => {
    if (!user?.userId) return;

    if (loadingRef.current) return;

    loadingRef.current = true;

    try {
      setError(null);

      // Get or create group conversation using Redux
      const convResult = await dispatch(getOrCreateGroupConversation(studyGroupId)).unwrap();
      const conv = convResult.conversation;
      
      if (!conv || !conv.conversationId) {
        throw new Error('Invalid conversation object returned');
      }
      
      conversationRef.current = conv;

      // Load messages using Redux
      await dispatch(fetchConversationMessages(conv.conversationId)).unwrap();

      // Mark as read
      await messageService.markAsRead(conv.conversationId);

      // Join SignalR group
      const token = localStorage.getItem('token');
      if (token) {
        if (!chatService.isConnected()) {
          await chatService.start(token);
          // Wait a bit for connection to stabilize
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (chatService.isConnected()) {
          await chatService.joinConversation(conv.conversationId);
        }
      }

      scrollToBottom();
    } catch (err) {
      console.error('❌ Error loading conversation:', err);
      setError(`Failed to load conversation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      loadingRef.current = false;
    }
  }, [studyGroupId, user?.userId, dispatch]);

  useEffect(() => {
    // Only load conversation when studyGroupId changes
    loadConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyGroupId, user?.userId]);

  // Setup SignalR event handlers - do this once when component mounts
  useEffect(() => {
    const handleReceiveMessage = (data: any) => {
      // Backend sends: { ConversationId, Message, Type } which becomes { conversationId, message, type } in camelCase
      // Extract the actual message object
      const message = data.message || data.Message || data;
      
      // Use ref instead of state to get current conversation value
      const currentConversation = conversationRef.current;
      
      if (currentConversation && message.conversationId === currentConversation.conversationId) {
        // Add message to Redux store
        dispatch(addMessage(message));
        
        // Scroll after a short delay to ensure DOM is updated
        setTimeout(() => scrollToBottom(), 100);
        
        // Mark as read if not from current user
        const currentUserId = typeof user?.userId === 'string' 
          ? parseInt(user.userId, 10) 
          : user?.userId;
        
        if (message.senderId !== currentUserId) {
          messageService.markAsRead(currentConversation.conversationId);
        }
      }
    };

    const handleMessageEdited = (message: Message) => {
      const currentConversation = conversationRef.current;
      if (currentConversation) {
        dispatch(updateMessageAction({ conversationId: currentConversation.conversationId, message }));
      }
    };

    const handleMessageDeleted = (messageId: number) => {
      const currentConversation = conversationRef.current;
      if (currentConversation) {
        dispatch(deleteMessageAction({ conversationId: currentConversation.conversationId, messageId }));
      }
    };

    const handleUserTyping = (convId: number, userId: number, userName: string) => {
      const currentConversation = conversationRef.current;
      const currentUserId = typeof user?.userId === 'string' 
        ? parseInt(user.userId, 10) 
        : user?.userId;
        
      if (currentConversation && convId === currentConversation.conversationId && userId !== currentUserId) {
        setTypingUsers((prev) => new Set(prev).add(userName));
        
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(userName);
            return newSet;
          });
        }, 3000);
      }
    };

    chatService.onReceiveMessage(handleReceiveMessage);
    chatService.onMessageEdited(handleMessageEdited);
    chatService.onMessageDeleted(handleMessageDeleted);
    chatService.onUserTyping(handleUserTyping);

    // Cleanup
    return () => {
      const currentConv = conversationRef.current;
      if (currentConv) {
        chatService.leaveConversation(currentConv.conversationId);
      }
    };
  }, [dispatch, user?.userId]); // Include dispatch and user in dependencies

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || !user?.userId || sending) return;

    const messageContent = newMessage.trim();
    
    try {
      setSending(true);
      setError(null);

      const userId = typeof user.userId === 'string' ? parseInt(user.userId, 10) : user.userId;

      // Send message using Redux thunk
      await dispatch(sendMessageThunk({
        conversationId: conversation.conversationId,
        senderId: userId,
        messageType: 'Text',
        content: messageContent,
      })).unwrap();

      setTimeout(() => scrollToBottom(), 100);
      setNewMessage('');
    } catch (err) {
      console.error('❌ Error sending message:', err);
      setError('Failed to send message');
      // Don't clear the message input on error so user can retry
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendImage = async () => {
    if (!selectedImage || !conversation || !user?.userId || sending) return;

    try {
      setUploadingImage(true);
      setSending(true);
      setError(null);

      const userId = typeof user.userId === 'string' ? parseInt(user.userId, 10) : user.userId;

      // Upload image to server first
      const formData = new FormData();
      formData.append('file', selectedImage);

      const token = localStorage.getItem('token');
      const uploadResponse = await fetch('https://localhost:43960/api/fileupload/image', {
        method: 'POST',
        headers: {
          'Authorization': token || '',
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.fileUrl || uploadData.FileUrl;

      // Send message with uploaded image URL using Redux
      await dispatch(sendMessageThunk({
        conversationId: conversation.conversationId,
        senderId: userId,
        messageType: 'Image',
        mediaUrl: imageUrl,
        content: selectedImage.name,
        mediaFileName: selectedImage.name,
        mediaFileSize: selectedImage.size,
      })).unwrap();

      setTimeout(() => scrollToBottom(), 100);

      setSelectedImage(null);
      setImagePreview('');
      setImageDialogOpen(false);
    } catch (err) {
      console.error('❌ Error sending image:', err);
      setError('Failed to send image');
    } finally {
      setSending(false);
      setUploadingImage(false);
    }
  };

  const handleSendLink = async () => {
    if (!linkUrl.trim() || !conversation || !user?.userId || sending) return;

    try {
      setSending(true);
      setError(null);

      const userId = typeof user.userId === 'string' ? parseInt(user.userId, 10) : user.userId;

      // Send link message using Redux
      await dispatch(sendMessageThunk({
        conversationId: conversation.conversationId,
        senderId: userId,
        messageType: 'Link',
        mediaUrl: linkUrl.trim(),
        content: linkTitle.trim() || linkUrl.trim(),
      })).unwrap();

      setTimeout(() => scrollToBottom(), 100);

      setLinkUrl('');
      setLinkTitle('');
      setLinkDialogOpen(false);
    } catch (err) {
      console.error('❌ Error sending link:', err);
      setError('Failed to send link');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      let date: Date;
      
      // ASP.NET Core serializes DateTime as: "2024-11-09T15:30:00" (no timezone)
      // We need to treat this as UTC
      if (typeof dateString === 'string') {
        // If it already has timezone info (Z or +00:00), use as-is
        if (dateString.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateString)) {
          date = new Date(dateString);
        } else {
          // No timezone info - assume UTC and add 'Z'
          date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
        }
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) return '';
      
      return formatRelativeTime(date);
    } catch {
      return '';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .substring(0, 2) || '??';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {studyGroupName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {conversation?.participants.length || 0} members
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Messages Container */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {!Array.isArray(messages) || messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.senderId === user?.userId || 
                                   message.senderId === parseInt(String(user?.userId || '0'), 10);
            const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;

            return (
              <Box
                key={message.messageId}
                sx={{
                  display: 'flex',
                  flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                  gap: 1,
                  alignItems: 'flex-start',
                }}
              >
                {showAvatar ? (
                  <Avatar
                    sx={{
                      bgcolor: isCurrentUser ? 'primary.main' : 'secondary.main',
                      width: 36,
                      height: 36,
                    }}
                  >
                    {getInitials(message.senderName)}
                  </Avatar>
                ) : (
                  <Box sx={{ width: 36 }} />
                )}

                <Stack spacing={0.5} sx={{ maxWidth: '70%' }}>
                  {showAvatar && !isCurrentUser && (
                    <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                      {message.senderName}
                    </Typography>
                  )}
                  
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      bgcolor: isCurrentUser ? 'primary.main' : 'background.paper',
                      color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                      borderRadius: 2,
                      ...(isCurrentUser && {
                        borderBottomRightRadius: 4,
                      }),
                      ...(!isCurrentUser && {
                        borderBottomLeftRadius: 4,
                      }),
                    }}
                  >
                    {message.isDeleted ? (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                        {message.content}
                      </Typography>
                    ) : message.messageType === 'Image' ? (
                      <Box>
                        <img
                          src={message.mediaUrl?.startsWith('http') ? message.mediaUrl : `https://localhost:43960${message.mediaUrl}`}
                          alt="Shared image"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            borderRadius: '8px',
                            display: 'block',
                          }}
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23ddd" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="14"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </Box>
                    ) : message.messageType === 'Link' ? (
                      <Box>
                        <MuiLink
                          href={message.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: isCurrentUser ? 'inherit' : 'primary.main',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          <Stack spacing={0.5}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <LinkIcon fontSize="small" />
                              <Typography variant="body2" fontWeight={600}>
                                {message.content || 'Link'}
                              </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ opacity: 0.8, wordBreak: 'break-all' }}>
                              {message.mediaUrl}
                            </Typography>
                          </Stack>
                        </MuiLink>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                    )}
                  </Paper>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      px: 1,
                      alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {formatTime(message.sentAt)}
                    {message.editedAt && ' (edited)'}
                  </Typography>
                </Stack>
              </Box>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Input Area */}
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <IconButton 
            size="small" 
            onClick={(e) => setAttachMenuAnchor(e.currentTarget)}
          >
            <AttachFileIcon />
          </IconButton>
          
          <Menu
            anchorEl={attachMenuAnchor}
            open={Boolean(attachMenuAnchor)}
            onClose={() => setAttachMenuAnchor(null)}
          >
            <MenuItem onClick={() => { setImageDialogOpen(true); setAttachMenuAnchor(null); }}>
              <ListItemIcon>
                <ImageIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Share Image</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { setLinkDialogOpen(true); setAttachMenuAnchor(null); }}>
              <ListItemIcon>
                <LinkIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Share Link</ListItemText>
            </MenuItem>
          </Menu>

          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            variant="outlined"
            size="small"
          />

          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Image Dialog */}
      <Dialog 
        open={imageDialogOpen} 
        onClose={() => {
          setImageDialogOpen(false);
          setSelectedImage(null);
          setImagePreview('');
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Share Image</DialogTitle>
        <DialogContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              startIcon={<ImageIcon />}
            >
              {selectedImage ? 'Change Image' : 'Select Image'}
            </Button>
            
            {selectedImage && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                Selected: {selectedImage.name} ({(selectedImage.size / 1024).toFixed(2)} KB)
              </Typography>
            )}
          </Box>
          
          {imagePreview && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Preview:
              </Typography>
              <Box
                component="img"
                src={imagePreview}
                alt="Preview"
                sx={{
                  width: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: 1,
                  mt: 1,
                  bgcolor: 'grey.100',
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setImageDialogOpen(false);
              setSelectedImage(null);
              setImagePreview('');
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendImage} 
            variant="contained" 
            disabled={!selectedImage || uploadingImage || sending}
          >
            {uploadingImage ? 'Uploading...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Link URL"
            type="url"
            fullWidth
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />
          <TextField
            margin="dense"
            label="Link Title (Optional)"
            type="text"
            fullWidth
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            placeholder="Give this link a title"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendLink} variant="contained" disabled={!linkUrl.trim() || sending}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat;
