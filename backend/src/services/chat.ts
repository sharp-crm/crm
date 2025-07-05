import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { docClient } from './dynamoClient';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'text' | 'file' | 'system';
  channelId?: string;
  recipientId?: string;
  reactions: Array<{
    emoji: string;
    users: string[];
  }>;
  isEdited: boolean;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
  replyTo?: string;
  files?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    preview?: string;
  }>;
  deliveryStatus?: {
    sent: boolean;
    delivered: boolean;
    read: boolean;
    timestamp: string;
  };
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  isDeleted: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  description?: string;
  members: string[];
  createdBy: string;
  permissions: {
    canPost: string[];
    canInvite: string[];
    canManage: string[];
  };
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
}

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'away' | 'offline';
  role: string;
  avatar?: string;
  lastSeen?: string;
  tenantId: string;
}

const MESSAGES_TABLE = 'ChatMessages';
const CHANNELS_TABLE = 'ChatChannels';
const USERS_TABLE = 'Users'; // Use main Users table

export class ChatService {
  private docClient: DynamoDBDocumentClient;

  constructor() {
    this.docClient = docClient;
  }

  // Channel Management
  async createChannel(channelData: Omit<ChatChannel, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const channel: ChatChannel = {
      id,
      ...channelData,
      createdAt: now,
      isDeleted: false
    };

    const command = new PutCommand({
      TableName: CHANNELS_TABLE,
      Item: channel
    });

    await this.docClient.send(command);
    return channel;
  }

  async getChannelsByTenant(tenantId: string) {
    const command = new QueryCommand({
      TableName: CHANNELS_TABLE,
      KeyConditionExpression: 'tenantId = :tenantId',
      FilterExpression: 'isDeleted = :isDeleted',
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
        ':isDeleted': false
      }
    });

    const result = await this.docClient.send(command);
    return result.Items as ChatChannel[];
  }

  async getChannelById(channelId: string, tenantId: string) {
    const command = new QueryCommand({
      TableName: CHANNELS_TABLE,
      KeyConditionExpression: 'id = :id AND tenantId = :tenantId',
      FilterExpression: 'isDeleted = :isDeleted',
      ExpressionAttributeValues: {
        ':id': channelId,
        ':tenantId': tenantId,
        ':isDeleted': false
      }
    });

    const result = await this.docClient.send(command);
    return result.Items?.[0] as ChatChannel;
  }

  async updateChannel(channelId: string, tenantId: string, updates: Partial<ChatChannel>) {
    const now = new Date().toISOString();
    
    const command = new UpdateCommand({
      TableName: CHANNELS_TABLE,
      Key: { id: channelId, tenantId },
      UpdateExpression: 'SET #name = :name, #description = :description, #members = :members, #permissions = :permissions, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#description': 'description',
        '#members': 'members',
        '#permissions': 'permissions'
      },
      ExpressionAttributeValues: {
        ':name': updates.name,
        ':description': updates.description,
        ':members': updates.members,
        ':permissions': updates.permissions,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await this.docClient.send(command);
    return result.Attributes as ChatChannel;
  }

  async deleteChannel(channelId: string, tenantId: string) {
    const now = new Date().toISOString();
    
    const command = new UpdateCommand({
      TableName: CHANNELS_TABLE,
      Key: { id: channelId, tenantId },
      UpdateExpression: 'SET isDeleted = :isDeleted, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isDeleted': true,
        ':updatedAt': now
      }
    });

    await this.docClient.send(command);
  }

  // Message Management
  async createMessage(messageData: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const message: ChatMessage = {
      id,
      ...messageData,
      createdAt: now,
      isDeleted: false
    };

    const command = new PutCommand({
      TableName: MESSAGES_TABLE,
      Item: message
    });

    await this.docClient.send(command);
    return message;
  }

  async getMessagesByChannel(channelId: string, tenantId: string, limit: number = 50) {
    const command = new QueryCommand({
      TableName: MESSAGES_TABLE,
      IndexName: 'ChannelIdIndex',
      KeyConditionExpression: 'channelId = :channelId AND tenantId = :tenantId',
      FilterExpression: 'isDeleted = :isDeleted',
      ExpressionAttributeValues: {
        ':channelId': channelId,
        ':tenantId': tenantId,
        ':isDeleted': false
      },
      ScanIndexForward: false,
      Limit: limit
    });

    const result = await this.docClient.send(command);
    return (result.Items as ChatMessage[]).reverse();
  }

  async getDirectMessages(userId1: string, userId2: string, tenantId: string, limit: number = 50) {
    const command = new QueryCommand({
      TableName: MESSAGES_TABLE,
      IndexName: 'DirectMessageIndex',
      KeyConditionExpression: 'tenantId = :tenantId',
      FilterExpression: 'isDeleted = :isDeleted AND ((senderId = :userId1 AND recipientId = :userId2) OR (senderId = :userId2 AND recipientId = :userId1))',
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
        ':userId1': userId1,
        ':userId2': userId2,
        ':isDeleted': false
      },
      ScanIndexForward: false,
      Limit: limit
    });

    const result = await this.docClient.send(command);
    return (result.Items as ChatMessage[]).reverse();
  }

  async updateMessage(messageId: string, tenantId: string, updates: Partial<ChatMessage>) {
    const now = new Date().toISOString();
    
    const command = new UpdateCommand({
      TableName: MESSAGES_TABLE,
      Key: { id: messageId, tenantId },
      UpdateExpression: 'SET content = :content, isEdited = :isEdited, reactions = :reactions, readBy = :readBy, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':content': updates.content,
        ':isEdited': updates.isEdited,
        ':reactions': updates.reactions,
        ':readBy': updates.readBy,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await this.docClient.send(command);
    return result.Attributes as ChatMessage;
  }

  async deleteMessage(messageId: string, tenantId: string) {
    const now = new Date().toISOString();
    
    const command = new UpdateCommand({
      TableName: MESSAGES_TABLE,
      Key: { id: messageId, tenantId },
      UpdateExpression: 'SET isDeleted = :isDeleted, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isDeleted': true,
        ':updatedAt': now
      }
    });

    await this.docClient.send(command);
  }

  async markMessageAsRead(messageId: string, tenantId: string, userId: string) {
    const now = new Date().toISOString();
    
    // First get the current message to update readBy array
    const getMessage = new QueryCommand({
      TableName: MESSAGES_TABLE,
      KeyConditionExpression: 'id = :id AND tenantId = :tenantId',
      ExpressionAttributeValues: {
        ':id': messageId,
        ':tenantId': tenantId
      }
    });

    const result = await this.docClient.send(getMessage);
    const message = result.Items?.[0] as ChatMessage;
    
    if (message) {
      const readBy = message.readBy || [];
      const existingRead = readBy.find(r => r.userId === userId);
      
      if (!existingRead) {
        readBy.push({ userId, readAt: now });
        
        const updateCommand = new UpdateCommand({
          TableName: MESSAGES_TABLE,
          Key: { id: messageId, tenantId },
          UpdateExpression: 'SET readBy = :readBy, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':readBy': readBy,
            ':updatedAt': now
          }
        });

        await this.docClient.send(updateCommand);
      }
    }
  }

  // User Management
  async updateUserStatus(userId: string, tenantId: string, status: 'online' | 'away' | 'offline') {
    const now = new Date().toISOString();
    
    // First, get the user's email (primary key in Users table)
    const getUserCommand = new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'tenantId = :tenantId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':tenantId': tenantId
      }
    });

    const userResult = await this.docClient.send(getUserCommand);
    const user = userResult.Items?.[0];
    
    if (user) {
      const command = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { email: user.email }, // Users table uses email as primary key
        UpdateExpression: 'SET chatStatus = :status, lastSeen = :lastSeen',
        ExpressionAttributeValues: {
          ':status': status,
          ':lastSeen': now
        }
      });

      await this.docClient.send(command);
    }
  }

  async getUsersByTenant(tenantId: string) {
    const command = new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'TenantIdIndex',
      KeyConditionExpression: 'tenantId = :tenantId',
      FilterExpression: 'isDeleted = :isDeleted',
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
        ':isDeleted': false
      }
    });

    const result = await this.docClient.send(command);
    const users = result.Items || [];
    
    // Map Users table structure to ChatUser interface
    return users.map(user => ({
      id: user.userId,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      email: user.email,
      status: user.chatStatus || 'offline', // Use chatStatus field or default to offline
      role: user.role,
      avatar: user.avatar,
      lastSeen: user.lastSeen,
      tenantId: user.tenantId
    })) as ChatUser[];
  }

  async searchMessages(tenantId: string, query: string, channelId?: string, userId?: string) {
    const command = new ScanCommand({
      TableName: MESSAGES_TABLE,
      FilterExpression: 'tenantId = :tenantId AND contains(content, :query) AND isDeleted = :isDeleted',
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
        ':query': query,
        ':isDeleted': false
      }
    });

    if (channelId) {
      command.input.FilterExpression += ' AND channelId = :channelId';
      command.input.ExpressionAttributeValues![':channelId'] = channelId;
    }

    if (userId) {
      command.input.FilterExpression += ' AND (senderId = :userId OR recipientId = :userId)';
      command.input.ExpressionAttributeValues![':userId'] = userId;
    }

    const result = await this.docClient.send(command);
    return result.Items as ChatMessage[];
  }
}

export const chatService = new ChatService(); 