import express, { RequestHandler } from 'express';
import { chatService, ChatMessage, ChatChannel } from '../services/chat';
import { authenticate } from '../middlewares/authenticate';

const router = express.Router();

// Channel Routes
const getChannels: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const channels = await chatService.getChannelsByTenant(tenantId);
    res.json({ data: channels });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
};

const createChannel: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { name, type, description, members } = req.body;

    const channelData = {
      name,
      type,
      description,
      members: members || [userId],
      createdBy: userId,
      permissions: {
        canPost: [userId],
        canInvite: [userId],
        canManage: [userId]
      },
      tenantId
    };

    const channel = await chatService.createChannel(channelData);
    res.status(201).json({ data: channel });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
};

const getChannelById: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { channelId } = req.params;
    
    const channel = await chatService.getChannelById(channelId, tenantId);
    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }
    
    res.json({ data: channel });
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
};

const updateChannel: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { channelId } = req.params;
    const updates = req.body;
    
    const channel = await chatService.updateChannel(channelId, tenantId, updates);
    res.json({ data: channel });
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(500).json({ error: 'Failed to update channel' });
  }
};

const deleteChannel: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { channelId } = req.params;
    
    await chatService.deleteChannel(channelId, tenantId);
    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
};

// Message Routes
const getChannelMessages: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const messages = await chatService.getMessagesByChannel(channelId, tenantId, limit);
    res.json({ data: messages });
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

const createChannelMessage: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { channelId } = req.params;
    const { content, type = 'text', files, replyTo } = req.body;
    
    const messageData = {
      senderId: userId,
      senderName: req.user.firstName + ' ' + req.user.lastName,
      content,
      timestamp: new Date().toISOString(),
      type,
      channelId,
      reactions: [],
      isEdited: false,
      readBy: [{ userId, readAt: new Date().toISOString() }],
      files,
      replyTo,
      deliveryStatus: {
        sent: true,
        delivered: false,
        read: false,
        timestamp: new Date().toISOString()
      },
      tenantId,
      createdBy: userId
    };

    const message = await chatService.createMessage(messageData);
    res.status(201).json({ data: message });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
};

// Direct Messages  
const getDirectMessages: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const currentUserId = req.user.userId;
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const messages = await chatService.getDirectMessages(currentUserId, userId, tenantId, limit);
    res.json({ data: messages });
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json({ error: 'Failed to fetch direct messages' });
  }
};

const createDirectMessage: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const senderId = req.user.userId;
    const { userId: recipientId } = req.params;
    const { content, type = 'text', files, replyTo } = req.body;
    
    const messageData = {
      senderId,
      senderName: req.user.firstName + ' ' + req.user.lastName,
      content,
      timestamp: new Date().toISOString(),
      type,
      recipientId,
      reactions: [],
      isEdited: false,
      readBy: [{ userId: senderId, readAt: new Date().toISOString() }],
      files,
      replyTo,
      deliveryStatus: {
        sent: true,
        delivered: false,
        read: false,
        timestamp: new Date().toISOString()
      },
      tenantId,
      createdBy: senderId
    };

    const message = await chatService.createMessage(messageData);
    res.status(201).json({ data: message });
  } catch (error) {
    console.error('Error creating direct message:', error);
    res.status(500).json({ error: 'Failed to create direct message' });
  }
};

// Message Management
const updateMessage: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { messageId } = req.params;
    const updates = req.body;
    
    const message = await chatService.updateMessage(messageId, tenantId, updates);
    res.json({ data: message });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
};

const deleteMessage: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { messageId } = req.params;
    
    await chatService.deleteMessage(messageId, tenantId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

const markMessageAsRead: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { messageId } = req.params;
    
    await chatService.markMessageAsRead(messageId, tenantId, userId);
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

// User Management
const getChatUsers: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const users = await chatService.getUsersByTenant(tenantId);
    res.json({ data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const updateUserStatus: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { userId } = req.params;
    const { status } = req.body;
    
    await chatService.updateUserStatus(userId, tenantId, status);
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Search Messages
const searchMessages: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { query, channelId, userId } = req.query;
    
    if (!query) {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }
    
    const messages = await chatService.searchMessages(
      tenantId,
      query as string,
      channelId as string,
      userId as string
    );
    
    res.json({ data: messages });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};

// Register routes
router.get('/channels', authenticate, getChannels);
router.post('/channels', authenticate, createChannel);
router.get('/channels/:channelId', authenticate, getChannelById);
router.put('/channels/:channelId', authenticate, updateChannel);
router.delete('/channels/:channelId', authenticate, deleteChannel);

router.get('/channels/:channelId/messages', authenticate, getChannelMessages);
router.post('/channels/:channelId/messages', authenticate, createChannelMessage);

router.get('/direct-messages/:userId', authenticate, getDirectMessages);
router.post('/direct-messages/:userId', authenticate, createDirectMessage);

router.put('/messages/:messageId', authenticate, updateMessage);
router.delete('/messages/:messageId', authenticate, deleteMessage);
router.post('/messages/:messageId/read', authenticate, markMessageAsRead);

router.get('/users', authenticate, getChatUsers);
router.put('/users/:userId/status', authenticate, updateUserStatus);

router.get('/search', authenticate, searchMessages);

export default router; 