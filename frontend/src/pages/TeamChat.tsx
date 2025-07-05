// src/Pages/TeamChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { format } from 'date-fns';
import { chatApi, ChatMessage, ChatChannel, ChatUser } from '../api/services';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

// Type aliases for consistency with existing code
type Message = ChatMessage;
type Channel = ChatChannel;

interface DeliveryStatus {
  sent: boolean;
  delivered: boolean;
  read: boolean;
  timestamp: Date;
}

// File upload configurations
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed'
];

interface FileUpload {
  file: File;
  progress: number;
  preview?: string;
  error?: string;
}

// Add new interfaces for typing and delivery status
interface TypingStatus {
  userId: string;
  timestamp: Date;
}

interface DirectChat {
    userId: string;
  unreadCount: number;
  lastMessage?: ChatMessage;
}

const TeamChat: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [directMessages, setDirectMessages] = useState<{ [key: string]: ChatMessage[] }>({});
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [channelMessages, setChannelMessages] = useState<{ [key: string]: ChatMessage[] }>({});
  const [teamMembers, setTeamMembers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for message features
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThread, setSelectedThread] = useState<Message | null>(null);

  // Add new state for reply input
  const [replyInput, setReplyInput] = useState('');

  // Add state for unread counts
  const [unreadCounts, setUnreadCounts] = useState<{ [userId: string]: number }>({});

  // Add new state for sidebar visibility and width
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartWidthRef = useRef<number>(256);

  // New state for file handling
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Add new state for typing indicators and channel management
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: TypingStatus[] }>({});
  const [isTyping, setIsTyping] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [selectedChannelSettings, setSelectedChannelSettings] = useState<Channel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Load data on component mount
  useEffect(() => {
    const loadChatData = async () => {
      try {
        setLoading(true);
        const [channelsData, usersData] = await Promise.all([
          chatApi.getChannels(),
          chatApi.getUsersByTenant(user?.tenantId || '')
        ]);
        
        setChannels(channelsData);
        // Filter out current user from team members list
        const filteredUsers = usersData.filter(u => u.id !== user?.userId);
        setTeamMembers(filteredUsers);
        
        // Auto-select first channel if available
        if (channelsData.length > 0) {
          setSelectedChannel(channelsData[0].id);
          const messages = await chatApi.getChannelMessages(channelsData[0].id);
          setChannelMessages(prev => ({ ...prev, [channelsData[0].id]: messages }));
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
        addToast('Failed to load chat data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadChatData();
  }, [addToast]);

  const handleUserSelect = async (user: ChatUser) => {
    setSelectedUser(user);
    setSelectedChannel(''); // Clear channel selection when in DM
    if (!directMessages[user.id]) {
      try {
        const messages = await chatApi.getDirectMessages(user.id);
        setDirectMessages(prev => ({
          ...prev,
          [user.id]: messages
        }));
      } catch (error) {
        console.error('Error loading direct messages:', error);
        setDirectMessages(prev => ({
          ...prev,
          [user.id]: []
        }));
      }
    }
  };

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannel(channelId);
    setSelectedUser(null); // Clear user selection when selecting channel
  };

  // Message delivery status handling
  const handleDeliveryStatusUpdate = (messageId: string, status: 'delivered' | 'read') => {
    const newStatus: DeliveryStatus = {
      sent: true,
      delivered: status === 'delivered' || status === 'read',
      read: status === 'read',
      timestamp: new Date()
    };

    const updateMessage = (message: Message): Message => {
      if (message.id === messageId) {
        return {
          ...message,
          deliveryStatus: newStatus
        };
      }
      return message;
    };

    if (selectedUser) {
      setDirectMessages((prev: { [key: string]: Message[] }) => ({
        ...prev,
        [selectedUser.id]: prev[selectedUser.id].map(updateMessage)
      }));
    } else if (selectedChannel) {
      setChannelMessages((prev: { [key: string]: Message[] }) => ({
        ...prev,
        [selectedChannel]: prev[selectedChannel].map(updateMessage)
      }));
    }
  };

  // Message sending with delivery status
  const handleSend = () => {
    if (!input.trim() && !selectedFile) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: '1',
      sender: 'You',
      content: input.trim(),
      timestamp: new Date(),
      type: 'text',
      channelId: selectedChannel || '',
      reactions: [],
      isEdited: false,
      readBy: [],
      threadMessages: [],
      deliveryStatus: {
        sent: true,
        delivered: false,
        read: false,
        timestamp: new Date()
      }
    };

    if (selectedUser) {
      setDirectMessages(prev => ({
        ...prev,
        [selectedUser.id]: [...(prev[selectedUser.id] || []), newMessage]
      }));
    } else {
      setChannelMessages(prev => ({
        ...prev,
        [selectedChannel]: [...(prev[selectedChannel] || []), newMessage]
      }));
    }

    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Update delivery status with proper status object
    setTimeout(() => {
      handleDeliveryStatusUpdate(newMessage.id, 'delivered');
    }, 1000);

    setTimeout(() => {
      handleDeliveryStatusUpdate(newMessage.id, 'read');
    }, 2000);
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    setInput(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const newUploads: FileUpload[] = [];

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        newUploads.push({ file, progress: 0, error });
        continue;
      }

      const preview = await createFilePreview(file);
      newUploads.push({ file, progress: 0, preview });
    }

    setFileUploads(prev => [...prev, ...newUploads]);
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
    }
    
    const isValidType = ALLOWED_FILE_TYPES.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType + '/');
      }
      return file.type === type;
    });

    if (!isValidType) {
      return 'File type not supported';
    }

    return null;
  };

  const createFilePreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    
    // Add preview for PDF files
    if (file.type === 'application/pdf') {
      return '/pdf-icon.png'; // You would need to add this icon to your assets
    }
    
    return undefined;
  };

  const simulateFileUpload = (fileUpload: FileUpload) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setFileUploads(prev =>
        prev.map(upload =>
          upload.file === fileUpload.file
            ? { ...upload, progress }
            : upload
        )
      );

      if (progress >= 100) {
        clearInterval(interval);
        // Simulate a delay before sending the message
        setTimeout(() => {
          handleSendWithFiles([fileUpload.file]);
          setFileUploads(prev =>
            prev.filter(upload => upload.file !== fileUpload.file)
          );
        }, 500);
      }
    }, 200);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files) as File[];
    await handleFiles(files);
  };

  // Modified send handler to support files
  const handleSendWithFiles = async (files: File[]) => {
    const fileDetails = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
        preview: await createFilePreview(file)
      }))
    );

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: '1',
      sender: 'You',
      content: input.trim() || `Sent ${files.length} file${files.length > 1 ? 's' : ''}`,
      timestamp: new Date(),
      type: 'file',
      avatar: 'YU',
      recipientId: selectedUser?.id,
      channelId: selectedChannel,
      reactions: [],
      isEdited: false,
      readBy: [{ userId: '1', readAt: new Date() }],
      threadMessages: [],
      files: fileDetails,
      deliveryStatus: {
        sent: true,
        delivered: false,
        read: false,
        timestamp: new Date()
      }
    };

    if (selectedUser) {
      setDirectMessages(prev => ({
        ...prev,
        [selectedUser.id]: [...(prev[selectedUser.id] || []), newMessage]
      }));
    } else {
      setChannelMessages(prev => ({
        ...prev,
        [selectedChannel]: [...(prev[selectedChannel] || []), newMessage]
      }));
    }

    setInput('');

    // Simulate delivery status updates
    setTimeout(() => {
      handleDeliveryStatusUpdate(newMessage.id, 'delivered');
    }, 1000);

    setTimeout(() => {
      handleDeliveryStatusUpdate(newMessage.id, 'read');
    }, 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getCurrentMessages = () => {
    if (selectedUser) {
      return directMessages[selectedUser.id] || [];
    }
    return channelMessages[selectedChannel] || [];
  };

  const headerActions = (
    <div className="flex items-center space-x-3">
      <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
        <Icons.Search className="w-4 h-4 mr-2" />
        Search
      </button>
      <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
        <Icons.Settings className="w-4 h-4 mr-2" />
        Settings
      </button>
    </div>
  );

  // Function to handle message reactions
  const handleReaction = (messageId: string, emoji: string) => {
    const updateMessages = (messages: Message[]) => {
      return messages.map(msg => {
        if (msg.id === messageId) {
          const existingReactionIndex = msg.reactions.findIndex(r => r.emoji === emoji);
          let newReactions = [...msg.reactions];

          if (existingReactionIndex >= 0) {
            // Toggle user's reaction
            const userIndex = newReactions[existingReactionIndex].users.indexOf('1');
            if (userIndex >= 0) {
              // Remove user's reaction
              const updatedUsers = newReactions[existingReactionIndex].users.filter(u => u !== '1');
              if (updatedUsers.length === 0) {
                // Remove the reaction entirely if no users left
                newReactions = newReactions.filter(r => r.emoji !== emoji);
              } else {
                newReactions[existingReactionIndex] = {
                  ...newReactions[existingReactionIndex],
                  users: updatedUsers
                };
              }
            } else {
              // Add user's reaction
              newReactions[existingReactionIndex] = {
                ...newReactions[existingReactionIndex],
                users: [...newReactions[existingReactionIndex].users, '1']
              };
            }
          } else {
            // Add new reaction
            newReactions.push({
              emoji,
              users: ['1']
            });
          }

          return {
            ...msg,
            reactions: newReactions
          };
        }
        return msg;
      });
    };

    if (selectedUser) {
      setDirectMessages(prev => ({
        ...prev,
        [selectedUser.id]: updateMessages(prev[selectedUser.id] || [])
      }));
    } else {
      setChannelMessages(prev => ({
        ...prev,
        [selectedChannel]: updateMessages(prev[selectedChannel] || [])
      }));
    }
  };

  // Helper function to get user names from IDs
  const getUserNames = (userIds: string[]): string => {
    return userIds
      .map(id => {
        if (id === '1') return 'You';
        const user = teamMembers.find(m => m.id === id);
        return user ? user.name : 'Unknown User';
      })
      .join(', ');
  };

  // Function to handle message editing
  const handleEditMessage = (messageId: string) => {
    const message = getCurrentMessages().find(m => m.id === messageId);
    if (message && message.senderId === '1') { // Only allow editing own messages
      setEditingMessageId(messageId);
      setEditInput(message.content);
    }
  };

  // Function to save edited message
  const handleSaveEdit = (messageId: string) => {
    const updateMessage = (message: Message) => {
      if (message.id === messageId) {
        return {
          ...message,
          content: editInput,
          isEdited: true
        };
      }
      return message;
    };

    if (selectedUser) {
      setDirectMessages(prev => ({
        ...prev,
        [selectedUser.id]: prev[selectedUser.id].map(updateMessage)
      }));
    } else {
      setChannelMessages(prev => ({
        ...prev,
        [selectedChannel]: prev[selectedChannel].map(updateMessage)
      }));
    }
    setEditingMessageId(null);
    setEditInput('');
  };

  // Function to handle message deletion
  const handleDeleteMessage = (messageId: string) => {
    if (selectedUser) {
      setDirectMessages(prev => ({
        ...prev,
        [selectedUser.id]: prev[selectedUser.id].filter(m => m.id !== messageId)
      }));
    } else {
      setChannelMessages(prev => ({
        ...prev,
        [selectedChannel]: prev[selectedChannel].filter(m => m.id !== messageId)
      }));
    }
  };

  // Function to handle message replies
  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  // Function to mark message as read
  const handleMarkAsRead = (messageId: string) => {
    const userId = '1'; // Current user ID
    const now = new Date();
    
    const updateMessage = (message: Message) => {
      if (message.id === messageId && !message.readBy.some(r => r.userId === userId)) {
        return {
          ...message,
          readBy: [...message.readBy, { userId, readAt: now }]
        };
      }
      return message;
    };

    if (selectedUser) {
      setDirectMessages(prev => ({
        ...prev,
        [selectedUser.id]: prev[selectedUser.id].map(updateMessage)
      }));
    } else {
      setChannelMessages(prev => ({
        ...prev,
        [selectedChannel]: prev[selectedChannel].map(updateMessage)
      }));
    }
  };

  // Function to search messages
  const searchMessages = (query: string) => {
    const messages = selectedUser ? directMessages[selectedUser.id] : channelMessages[selectedChannel];
    return messages?.filter(message => 
      message.content.toLowerCase().includes(query.toLowerCase()) ||
      message.sender.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Update unread counts
  useEffect(() => {
    const updateUnreadCounts = () => {
      const counts = new Map<string, number>();
      
      // Count unread messages in channels
      Object.entries(channelMessages).forEach(([channelId, messages]) => {
        const unreadCount = (messages as Message[]).filter(m => 
          m.senderId !== '1' && // Not sent by current user
          !m.readBy.some(r => r.userId === '1') // Not read by current user
        ).length;
        counts.set(channelId, unreadCount);
      });

      // Update channel unread counts
      setChannels(prevChannels => prevChannels.map(channel => ({
        ...channel,
        unread: counts.get(channel.id) || 0
      })));
    };

    updateUnreadCounts();
  }, [channelMessages]);

  const handleSendReply = () => {
    if (!replyingTo || !replyInput.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: '1',
      sender: 'You',
      content: replyInput.trim(),
      timestamp: new Date(),
      type: 'text',
      avatar: 'YU',
      recipientId: selectedUser?.id,
      channelId: selectedChannel,
      reactions: [],
      isEdited: false,
      readBy: [],
      threadMessages: [],
      replyTo: replyingTo.id,
      deliveryStatus: {
        sent: true,
        delivered: false,
        read: false,
        timestamp: new Date()
      }
    };

    if (selectedUser) {
      setDirectMessages(prev => ({
        ...prev,
        [selectedUser.id]: [...(prev[selectedUser.id] || []), newMessage]
      }));
    } else {
      setChannelMessages(prev => ({
        ...prev,
        [selectedChannel]: [...(prev[selectedChannel] || []), newMessage]
      }));
    }

    setReplyInput('');
    setReplyingTo(null);

    // Simulate delivery status updates
    setTimeout(() => {
      handleDeliveryStatusUpdate(newMessage.id, 'delivered');
    }, 1000);

    setTimeout(() => {
      handleDeliveryStatusUpdate(newMessage.id, 'read');
    }, 2000);
  };

  // Function to get the replied-to message
  const getRepliedMessage = (replyToId: string) => {
    if (selectedUser) {
      return directMessages[selectedUser.id]?.find(m => m.id === replyToId);
    }
    return channelMessages[selectedChannel]?.find(m => m.id === replyToId);
  };

  // Function to mark messages as read
  const markMessagesAsRead = (userId: string) => {
    if (selectedUser?.id === userId) {
      const updatedMessages = directMessages[userId]?.map(msg => ({
        ...msg,
        readBy: msg.readBy.some(r => r.userId === '1') 
          ? msg.readBy 
          : [...msg.readBy, { userId: '1', readAt: new Date() }]
      }));

      setDirectMessages(prev => ({
        ...prev,
        [userId]: updatedMessages || []
      }));

      setUnreadCounts(prev => ({
        ...prev,
        [userId]: 0
      }));
    }
  };

  // Update unread counts when messages change
  useEffect(() => {
    const newUnreadCounts: { [userId: string]: number } = {};
    
    Object.entries(directMessages).forEach(([userId, messages]) => {
      if (userId !== selectedUser?.id) {
        const unreadCount = (messages as Message[]).filter(
          msg => !msg.readBy.some(r => r.userId === '1')
        ).length;
        newUnreadCounts[userId] = unreadCount;
      }
    });

    setUnreadCounts(newUnreadCounts);
  }, [directMessages, selectedUser]);

  // Optimized resize handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStartXRef.current;
      const newWidth = Math.min(Math.max(200, dragStartWidthRef.current + deltaX), 400);
      
      if (sidebarRef.current) {
        // Use transform for smooth animation
        sidebarRef.current.style.width = `${newWidth}px`;
      }
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      
      setIsDragging(false);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');

      // Set final width
      if (sidebarRef.current) {
        const finalWidth = parseInt(sidebarRef.current.style.width, 10);
        setSidebarWidth(finalWidth);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    // Start upload simulation for new files
    fileUploads.forEach(upload => {
      if (upload.progress === 0 && !upload.error) {
        simulateFileUpload(upload);
      }
    });
  }, [fileUploads]);

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.senderId === '1';
    const isEditing = editingMessageId === message.id;
    const repliedToMessage = message.replyTo ? getRepliedMessage(message.replyTo) : null;

    // Format timestamp for messages
    const formatMessageTime = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    };

    const renderFilePreview = (file: { name: string; url: string; type: string; size: number; preview?: string }) => {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      const fileSize = (file.size / 1024).toFixed(1) + ' KB';

      return (
        <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 mt-2">
          {isImage ? (
            <img 
              src={file.url} 
              alt={file.name}
              className="w-20 h-20 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              {isPDF ? (
                <Icons.FileText className="w-6 h-6 text-gray-500" />
              ) : (
                <Icons.File className="w-6 h-6 text-gray-500" />
              )}
            </div>
          )}
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{fileSize}</p>
          </div>
          <a
            href={file.url}
            download={file.name}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <Icons.Download className="w-5 h-5" />
          </a>
        </div>
      );
    };

    // Message actions component
    const MessageActions = () => (
      <div className={`absolute top-2 ${isOwnMessage ? '-left-14' : '-right-14'} hidden group-hover:flex items-center space-x-1`}>
        <button
          onClick={() => setShowReactionPicker(message.id)}
          className="p-1.5 bg-white text-gray-500 hover:text-gray-700 rounded-full shadow-sm transition-colors"
          title="Add reaction"
        >
          <Icons.Smile className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleReply(message)}
          className="p-1.5 bg-white text-gray-500 hover:text-gray-700 rounded-full shadow-sm transition-colors"
          title="Reply"
        >
          <Icons.Reply className={`w-4 h-4 ${isOwnMessage ? 'rotate-180' : ''}`} />
        </button>
        {message.senderId === '1' && (
          <button
            onClick={() => handleEditMessage(message.id)}
            className="p-1.5 bg-white text-gray-500 hover:text-gray-700 rounded-full shadow-sm transition-colors"
            title="Edit"
          >
            <Icons.Edit className="w-4 h-4" />
          </button>
        )}
      </div>
    );

    return (
      <div className="group relative flex flex-col w-full">
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex max-w-xl ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} relative`}>
            {!isOwnMessage && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-sm font-medium text-blue-700">
                  {message.avatar || message.sender.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
            <div className={`${isOwnMessage ? 'mr-3' : ''} relative group`}>
              <div className={`relative px-4 py-2 rounded-lg ${
                isOwnMessage 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                {/* Sender Info for received messages */}
                {!isOwnMessage && (
                  <div className="flex items-center mb-1">
                    <span className="text-sm font-medium text-gray-900">{message.sender}</span>
                  </div>
                )}

                {/* Reply Reference */}
                {repliedToMessage && (
                  <div className={`mb-2 pl-2 border-l-2 ${
                    isOwnMessage ? 'border-blue-400' : 'border-gray-300'
                  }`}>
                    <div className={`text-xs ${
                      isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      Replying to {repliedToMessage.sender}
                    </div>
                    <div className={`text-xs truncate ${
                      isOwnMessage ? 'text-blue-100' : 'text-gray-600'
                    }`}>
                      {repliedToMessage.content}
                    </div>
                  </div>
                )}

                {/* Message Content */}
                {isEditing ? (
                  <div className="flex items-end space-x-2">
                    <textarea
                      value={editInput}
                      onChange={(e) => setEditInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={1}
                    />
                    <button
                      onClick={() => handleSaveEdit(message.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMessageId(null)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Timestamp */}
                    <div className={`text-[10px] mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                      {formatMessageTime(message.timestamp)}
                      {message.isEdited && <span className="ml-1">(edited)</span>}
                    </div>
                  </>
                )}

                {/* File Previews */}
                {message.type === 'file' && message.files && (
                  <div className="space-y-2 mt-2">
                    {message.files.map((file, index) => (
                      <div key={index}>
                        {renderFilePreview(file)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Actions */}
                <MessageActions />

                {/* Reaction Picker */}
                {showReactionPicker === message.id && (
                  <div className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full mr-2'} z-50`}>
                    <div className="relative bg-white rounded-lg shadow-lg">
                      <button
                        onClick={() => setShowReactionPicker(null)}
                        className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md text-gray-400 hover:text-gray-600"
                      >
                        <Icons.X className="w-4 h-4" />
                      </button>
                      <Picker
                        data={data}
                        onEmojiSelect={(emoji: any) => {
                          handleReaction(message.id, emoji.native);
                          setShowReactionPicker(null);
                        }}
                        theme="light"
                      />
                    </div>
                  </div>
                )}

                {/* Reactions Display */}
                {message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {message.reactions.map((reaction, index) => {
                      const hasReacted = reaction.users.includes('1');
                      return (
                        <button
                          key={`${reaction.emoji}-${index}`}
                          onClick={() => handleReaction(message.id, reaction.emoji)}
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            hasReacted
                              ? isOwnMessage
                                ? 'bg-blue-500 text-white'
                                : 'bg-blue-100 text-blue-800'
                              : isOwnMessage
                                ? 'bg-blue-700 text-white'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <span>{reaction.emoji} {reaction.users.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-end mt-1">
                  <MessageDeliveryStatus status={message.deliveryStatus} />
                </div>
                            </div>
            </div>
            {isOwnMessage && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                <span className="text-sm font-medium text-blue-700">YU</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [directMessages, channelMessages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // Simulate sending typing status to server
      if (selectedUser) {
        setTypingUsers(prev => ({
          ...prev,
          [selectedUser.id]: [
            ...(prev[selectedUser.id] || []),
            { userId: '1', timestamp: new Date() }
          ]
        }));
      }
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (selectedUser) {
        setTypingUsers(prev => ({
          ...prev,
          [selectedUser.id]: prev[selectedUser.id]?.filter(status => status.userId !== '1') || []
        }));
      }
    }, 2000);
  };

  // Update input handler to include typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    handleTyping();
  };

  // Add channel management functions
  const handleCreateChannel = (channelData: {
    name: string;
    type: 'public' | 'private';
    description?: string;
  }) => {
    const newChannel: Channel = {
      id: Date.now().toString(),
      name: channelData.name,
      type: channelData.type,
      members: 1,
      description: channelData.description,
      createdBy: '1',
      permissions: {
        canPost: ['1'],
        canInvite: ['1'],
        canManage: ['1']
      }
    };

    setChannels(prev => [...prev, newChannel]);
    setShowChannelModal(false);
  };

  const handleUpdateChannelSettings = (channelId: string, settings: Channel) => {
    setChannels(prev =>
      prev.map(channel =>
        channel.id === channelId ? settings : channel
      )
    );
    setShowChannelSettings(false);
  };

  const handleAddChannelMember = (channelId: string, userId: string) => {
    setChannels(prev =>
      prev.map(channel => {
        if (channel.id === channelId) {
          const updatedChannel: Channel = {
            ...channel,
            members: channel.members + 1,
            permissions: {
              canPost: [...channel.permissions.canPost, userId],
              canInvite: [...channel.permissions.canInvite],
              canManage: [...channel.permissions.canManage]
            }
          };
          return updatedChannel;
        }
        return channel;
      })
    );
  };

  const handleRemoveChannelMember = (channelId: string, userId: string) => {
    setChannels(prev =>
      prev.map(channel => {
        if (channel.id === channelId) {
          return {
            ...channel,
            members: channel.members - 1,
            permissions: {
              canPost: channel.permissions.canPost.filter(id => id !== userId),
              canInvite: channel.permissions.canInvite.filter(id => id !== userId),
              canManage: channel.permissions.canManage.filter(id => id !== userId)
            }
          };
        }
        return channel;
      })
    );
  };

  // Channel creation modal component
  const ChannelModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Channel</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleCreateChannel({
            name: formData.get('name') as string,
            type: formData.get('type') as 'public' | 'private',
            description: formData.get('description') as string
          });
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Channel Name</label>
              <input
                type="text"
                name="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowChannelModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Channel settings modal component
  const ChannelSettingsModal = () => {
    if (!selectedChannelSettings) return null;

      return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Channel Settings</h2>
            <button
              onClick={() => setShowChannelSettings(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icons.X className="w-6 h-6" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">General Settings</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Channel Name</label>
                  <input
                    type="text"
                    value={selectedChannelSettings.name}
                    onChange={(e) => setSelectedChannelSettings(prev => prev ? {
                      ...prev,
                      name: e.target.value
                    } : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={selectedChannelSettings.description || ''}
                    onChange={(e) => setSelectedChannelSettings(prev => prev ? {
                      ...prev,
                      description: e.target.value
                    } : null)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Channel Type</label>
                  <select
                    value={selectedChannelSettings.type}
                    onChange={(e) => setSelectedChannelSettings(prev => prev ? {
                      ...prev,
                      type: e.target.value as 'public' | 'private'
                    } : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </form>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Member Management</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Members ({selectedChannelSettings.members})</span>
                  <button
                    onClick={() => {/* Add member logic */}}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Add Member
                  </button>
                </div>
                <div className="border rounded-lg divide-y">
                  {teamMembers.map(member => (
                    <div key={member.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={selectedChannelSettings.permissions?.canManage.includes(member.id) ? 'admin' : 'member'}
                          onChange={(e) => {
                            const isAdmin = e.target.value === 'admin';
                            const permissions = { ...selectedChannelSettings.permissions };
                            if (isAdmin) {
                              permissions.canManage = [...(permissions.canManage || []), member.id];
                            } else {
                              permissions.canManage = permissions.canManage?.filter(id => id !== member.id) || [];
                            }
                            setSelectedChannelSettings(prev => prev ? {
                              ...prev,
                              permissions
                            } : null);
                          }}
                          className="text-sm border-gray-300 rounded-md"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemoveChannelMember(selectedChannelSettings.id, member.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Icons.UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setShowChannelSettings(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleUpdateChannelSettings(selectedChannelSettings.id, selectedChannelSettings)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add typing indicator component
  const TypingIndicator = ({ users }: { users: TypingStatus[] }) => {
    if (users.length === 0) return null;

    return (
      <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-500">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>
          {users.length === 1
            ? `${users[0].userId} is typing...`
            : `${users.length} people are typing...`}
        </span>
      </div>
    );
  };

  // Update the chat area to include typing indicators
  const ChatArea = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ... existing chat messages ... */}
      
      {/* Typing indicator */}
      {selectedUser && typingUsers[selectedUser.id]?.length > 0 && (
        <TypingIndicator users={typingUsers[selectedUser.id]} />
      )}
      {selectedChannel && typingUsers[selectedChannel]?.length > 0 && (
        <TypingIndicator users={typingUsers[selectedChannel]} />
      )}

      {/* Message input area */}
      <div className="border-t border-gray-200 px-4 py-3">
        {/* ... existing input area ... */}
                    </div>
        </div>
  );

  // Update message component to show delivery status
  const MessageDeliveryStatus = ({ status }: { status?: DeliveryStatus }) => {
    if (!status) return null;

    return (
      <div className="flex items-center space-x-1 text-xs text-gray-400">
        {status.read ? (
          <Icons.CheckCheck className="w-4 h-4 text-blue-500" />
        ) : status.delivered ? (
          <Icons.CheckCheck className="w-4 h-4" />
        ) : status.sent ? (
          <Icons.Check className="w-4 h-4" />
        ) : null}
        <span>{format(status.timestamp, 'HH:mm')}</span>
      </div>
    );
  };

    return (
    <div className="h-full flex flex-col overflow-x-hidden">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            {isSidebarOpen ? (
              <Icons.PanelLeftClose className="w-5 h-5" />
            ) : (
              <Icons.PanelLeftOpen className="w-5 h-5" />
            )}
          </button>
          <h1 className="ml-3 text-xl font-semibold text-gray-900">
            {selectedUser ? `Chat with ${selectedUser.name}` : "Team Chat"}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <Icons.Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <Icons.Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {isSidebarOpen && (
          <>
            <div 
              ref={sidebarRef}
              style={{ 
                width: `${sidebarWidth}px`,
                transition: isDragging ? 'none' : 'width 0.1s ease-out'
              }}
              className="flex-shrink-0 flex flex-col bg-gray-50 border-r border-gray-200"
            >
              {/* Channels Section */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Channels</h3>
                  <button 
                    onClick={() => setShowChannelModal(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <Icons.Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {channels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelSelect(channel.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                        selectedChannel === channel.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg mr-2">#</span>
                      <span className="flex-1 text-left font-medium">{channel.name}</span>
                      {channel.unread && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                          {channel.unread}
                        </span>
                      )}
                      {channel.type === 'private' && (
                        <Icons.Lock className="w-4 h-4 ml-2 text-gray-400" />
                      )}
                      {channel.permissions?.canManage.includes('1') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChannelSettings(channel);
                            setShowChannelSettings(true);
                          }}
                          className="p-1 ml-2 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <Icons.Settings className="w-4 h-4" />
                        </button>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Members Section */}
              <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
                  <div className="px-3 py-2">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Team Members ({teamMembers.filter(m => m.status === 'online').length} Online)
                    </h2>
                  </div>
                  {teamMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => {
                        handleUserSelect(member);
                        if (selectedUser?.id === member.id) {
                          const updatedMessages = directMessages[member.id]?.map(message => ({
                            ...message,
                            readBy: message.readBy.some(r => r.userId === '1')
                              ? message.readBy
                              : [...message.readBy, { userId: '1', readAt: new Date() }]
                          }));

                          setDirectMessages(prev => ({
                            ...prev,
                            [member.id]: updatedMessages || []
                          }));

                          setUnreadCounts(prev => ({
                            ...prev,
                            [member.id]: 0
                          }));
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        selectedUser?.id === member.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center min-w-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-sm font-medium text-blue-700">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <span className="text-sm font-medium truncate">{member.name}</span>
                            {member.status === 'online' && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                online
                              </span>
                            )}
                            {member.status === 'away' && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                                away
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 truncate">{member.role}</span>
                        </div>
                      </div>
                      {unreadCounts[member.id] > 0 && (
                        <span className="flex-shrink-0 ml-2 w-6 h-6 bg-blue-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                          {unreadCounts[member.id]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div
              className={`w-1 bg-transparent hover:bg-blue-500 relative ${
                isDragging ? 'bg-blue-500' : ''
              }`}
              onMouseDown={handleMouseDown}
            >
              <div 
                className={`absolute inset-y-0 -left-2 right-2 cursor-col-resize ${
                  isDragging ? 'bg-blue-100 bg-opacity-50' : ''
                }`}
              />
            </div>
          </>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50 relative min-w-0">
          {/* Chat Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                {selectedUser ? (
                  <>
                    <div className="relative mr-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {selectedUser.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${getStatusColor(selectedUser.status)}`}></div>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h2>
                      <p className="text-sm text-gray-500">{selectedUser.role}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Icons.Hash className="w-5 h-5 text-gray-400 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {channels.find(c => c.id === selectedChannel)?.name || 'General'}
                    </h2>
                    <span className="ml-2 text-sm text-gray-500">
                      {channels.find(c => c.id === selectedChannel)?.members} members
                    </span>
                  </>
                )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
            {getCurrentMessages().length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Icons.MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedUser 
                    ? `Start a conversation with ${selectedUser.name}`
                    : `Welcome to #${selectedChannel}`
                  }
                </h3>
                <p className="text-gray-500">
                  {selectedUser
                    ? "Send a message to begin chatting"
                    : "This is the beginning of your conversation."
                  }
                </p>
              </div>
            ) : (
              getCurrentMessages().map((message, index) => (
                <React.Fragment key={message.id}>
                  {index === 0 || formatDate(getCurrentMessages()[index - 1].timestamp) !== formatDate(message.timestamp) ? (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-white px-3 py-1 rounded-full border border-gray-200 text-xs font-medium text-gray-500">
                        {formatDate(message.timestamp)}
                      </div>
                    </div>
                  ) : null}
                  {renderMessage(message)}
                </React.Fragment>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* File Upload Progress */}
          {fileUploads.length > 0 && (
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="space-y-4">
                {fileUploads.map((upload, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3">
                      {upload.preview ? (
                        <img 
                          src={upload.preview} 
                          alt="" 
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Icons.File className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {upload.file.name}
                        </span>
                        {upload.error ? (
                          <span className="text-xs text-red-500">{upload.error}</span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {upload.progress}%
                          </span>
                        )}
                      </div>
                      {!upload.error && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setFileUploads(prev => 
                          prev.filter(u => u.file !== upload.file)
                        );
                      }}
                      className="ml-3 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                    >
                      <Icons.X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply Input */}
          {replyingTo && (
            <div className="bg-gray-50 border-t border-gray-200 p-2">
              <div className="flex items-center justify-between bg-white rounded-lg p-2 mx-4">
                <div className="flex items-center">
                  <Icons.Reply className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    Replying to <span className="font-medium">{replyingTo.sender}</span>
                  </span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-end space-x-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icons.Paperclip className="w-5 h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept={ALLOWED_FILE_TYPES.join(',')}
              />
              <div className="flex-1 relative">
                <div className="relative">
                  <textarea
                    value={replyingTo ? replyInput : input}
                    onChange={(e) => replyingTo ? setReplyInput(e.target.value) : setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        replyingTo ? handleSendReply() : handleSend();
                      }
                    }}
                    placeholder={
                      replyingTo
                        ? `Reply to ${replyingTo.sender}...`
                        : selectedUser 
                          ? `Message ${selectedUser.name}`
                          : `Message #${channels.find(c => c.id === selectedChannel)?.name || 'general'}`
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                
                  {showEmojiPicker && (
                    <div 
                    className="absolute bottom-full right-0 mb-2 z-50"
                      style={{ 
                      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                      maxWidth: '100vw',
                      overflow: 'auto'
                      }}
                    >
                      <div className="relative bg-white rounded-lg p-2">
                        <button
                          onClick={() => setShowEmojiPicker(false)}
                          className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md text-gray-400 hover:text-gray-600 z-10"
                        >
                          <Icons.X className="w-4 h-4" />
                        </button>
                      <div className="overflow-x-auto">
                        <Picker 
                          data={data}
                          onEmojiSelect={(emoji: any) => {
                            if (replyingTo) {
                              setReplyInput(prev => prev + emoji.native);
                            } else {
                              setInput(prev => prev + emoji.native);
                            }
                            setShowEmojiPicker(false);
                          }}
                          theme="light"
                        />
                      </div>
                      </div>
                    </div>
                  )}
                </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={replyingTo ? handleSendReply : handleSend}
                  disabled={replyingTo ? !replyInput.trim() : !input.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    (replyingTo ? replyInput.trim() : input.trim())
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Icons.Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showChannelModal && <ChannelModal />}
      {showChannelSettings && <ChannelSettingsModal />}
    </div>
  );
};

export default TeamChat;

