# Real-time Features Implementation

Complete Socket.IO implementation for real-time chat, notifications, and video consultation signaling.

## 🔌 Real-time Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │────│   Socket.IO      │────│    Redis        │
│                 │    │   Server         │    │   (Optional)    │
│ - Chat Client   │    │                  │    │                 │
│ - Video Call    │    │ - Authentication │    │ - Session Store │
│ - Notifications │    │ - Room Management│    │ - Message Queue │
│ - Presence      │    │ - Event Handling │    │ - Pub/Sub       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Socket.IO Server Setup

### 1. Server Configuration

```typescript
// src/socket/socketServer.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken } from '../utils/tokenUtils';
import { ChatHandler } from './handlers/chatHandler';
import { ConsultationHandler } from './handlers/consultationHandler';
import { NotificationHandler } from './handlers/notificationHandler';
import { PresenceHandler } from './handlers/presenceHandler';

const prisma = new PrismaClient();

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  profile?: any;
}

export class SocketServer {
  private io: SocketIOServer;
  private chatHandler: ChatHandler;
  private consultationHandler: ConsultationHandler;
  private notificationHandler: NotificationHandler;
  private presenceHandler: PresenceHandler;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.chatHandler = new ChatHandler(this.io, prisma);
    this.consultationHandler = new ConsultationHandler(this.io, prisma);
    this.notificationHandler = new NotificationHandler(this.io, prisma);
    this.presenceHandler = new PresenceHandler(this.io, prisma);

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const payload = verifyAccessToken(token);
        
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: { profile: true }
        });

        if (!user || !user.profile?.isActive) {
          return next(new Error('User not found or inactive'));
        }

        socket.userId = user.id;
        socket.userRole = user.profile.role;
        socket.profile = user.profile;

        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      // Implement rate limiting logic here
      next();
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected with role ${socket.userRole}`);

      // Join user to their personal room for notifications
      socket.join(`user:${socket.userId}`);

      // Handle presence
      this.presenceHandler.handleConnection(socket);

      // Setup event handlers
      this.setupChatEvents(socket);
      this.setupConsultationEvents(socket);
      this.setupNotificationEvents(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        this.presenceHandler.handleDisconnection(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.userId}:`, error);
      });
    });
  }

  private setupChatEvents(socket: AuthenticatedSocket) {
    // Join conversation
    socket.on('chat:join', (data) => {
      this.chatHandler.handleJoinConversation(socket, data);
    });

    // Leave conversation
    socket.on('chat:leave', (data) => {
      this.chatHandler.handleLeaveConversation(socket, data);
    });

    // Send message
    socket.on('chat:message', (data) => {
      this.chatHandler.handleSendMessage(socket, data);
    });

    // Typing indicators
    socket.on('chat:typing:start', (data) => {
      this.chatHandler.handleTypingStart(socket, data);
    });

    socket.on('chat:typing:stop', (data) => {
      this.chatHandler.handleTypingStop(socket, data);
    });

    // Mark messages as read
    socket.on('chat:mark_read', (data) => {
      this.chatHandler.handleMarkAsRead(socket, data);
    });
  }

  private setupConsultationEvents(socket: AuthenticatedSocket) {
    // Join consultation room
    socket.on('consultation:join', (data) => {
      this.consultationHandler.handleJoinRoom(socket, data);
    });

    // Leave consultation room
    socket.on('consultation:leave', (data) => {
      this.consultationHandler.handleLeaveRoom(socket, data);
    });

    // WebRTC signaling
    socket.on('consultation:offer', (data) => {
      this.consultationHandler.handleOffer(socket, data);
    });

    socket.on('consultation:answer', (data) => {
      this.consultationHandler.handleAnswer(socket, data);
    });

    socket.on('consultation:ice-candidate', (data) => {
      this.consultationHandler.handleIceCandidate(socket, data);
    });

    // Session control
    socket.on('consultation:start', (data) => {
      this.consultationHandler.handleStartSession(socket, data);
    });

    socket.on('consultation:end', (data) => {
      this.consultationHandler.handleEndSession(socket, data);
    });
  }

  private setupNotificationEvents(socket: AuthenticatedSocket) {
    // Subscribe to notification channels
    socket.on('notifications:subscribe', (data) => {
      this.notificationHandler.handleSubscribe(socket, data);
    });

    // Mark notification as read
    socket.on('notifications:mark_read', (data) => {
      this.notificationHandler.handleMarkAsRead(socket, data);
    });
  }

  // Public methods for sending events from other parts of the application
  public sendNotification(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  public sendChatMessage(conversationId: string, message: any) {
    this.io.to(`conversation:${conversationId}`).emit('chat:message:new', message);
  }

  public broadcastConsultationUpdate(sessionId: string, update: any) {
    this.io.to(`consultation:${sessionId}`).emit('consultation:update', update);
  }
}
```

### 2. Chat Handler

```typescript
// src/socket/handlers/chatHandler.ts
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedSocket } from '../socketServer';

export class ChatHandler {
  constructor(
    private io: SocketIOServer,
    private prisma: PrismaClient
  ) {}

  async handleJoinConversation(socket: AuthenticatedSocket, data: { conversationId: string }) {
    try {
      const { conversationId } = data;

      // Verify user has access to this conversation
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { patientId: socket.userId },
            { physicianId: socket.userId },
            // Add agent support check
            {
              AND: [
                { type: 'agent_support' },
                { patientId: socket.userId }
              ]
            }
          ]
        }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found or access denied' });
        return;
      }

      // Join the conversation room
      socket.join(`conversation:${conversationId}`);

      // Get recent messages
      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          sender: {
            include: { profile: true }
          }
        }
      });

      // Send recent messages to the user
      socket.emit('chat:messages', {
        conversationId,
        messages: messages.reverse()
      });

      // Notify others in the conversation that user joined
      socket.to(`conversation:${conversationId}`).emit('chat:user_joined', {
        userId: socket.userId,
        userRole: socket.userRole,
        userProfile: socket.profile
      });

    } catch (error) {
      console.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  }

  async handleLeaveConversation(socket: AuthenticatedSocket, data: { conversationId: string }) {
    const { conversationId } = data;
    
    socket.leave(`conversation:${conversationId}`);
    
    // Notify others that user left
    socket.to(`conversation:${conversationId}`).emit('chat:user_left', {
      userId: socket.userId
    });
  }

  async handleSendMessage(socket: AuthenticatedSocket, data: {
    conversationId: string;
    content: string;
    messageType?: string;
  }) {
    try {
      const { conversationId, content, messageType = 'text' } = data;

      // Verify user has access to this conversation
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { patientId: socket.userId },
            { physicianId: socket.userId }
          ]
        }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found or access denied' });
        return;
      }

      // Create message in database
      const message = await this.prisma.message.create({
        data: {
          conversationId,
          senderId: socket.userId,
          senderType: socket.userRole?.toLowerCase() || 'patient',
          content,
          messageType
        },
        include: {
          sender: {
            include: { profile: true }
          }
        }
      });

      // Update conversation timestamp
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      // Send message to all users in the conversation
      this.io.to(`conversation:${conversationId}`).emit('chat:message:new', {
        message,
        conversationId
      });

      // Send push notification to offline users
      await this.sendMessageNotification(conversation, message);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  handleTypingStart(socket: AuthenticatedSocket, data: { conversationId: string }) {
    socket.to(`conversation:${data.conversationId}`).emit('chat:typing:start', {
      userId: socket.userId,
      userProfile: socket.profile
    });
  }

  handleTypingStop(socket: AuthenticatedSocket, data: { conversationId: string }) {
    socket.to(`conversation:${data.conversationId}`).emit('chat:typing:stop', {
      userId: socket.userId
    });
  }

  async handleMarkAsRead(socket: AuthenticatedSocket, data: {
    conversationId: string;
    messageId?: string;
  }) {
    try {
      const { conversationId, messageId } = data;

      if (messageId) {
        // Mark specific message as read
        await this.prisma.message.updateMany({
          where: {
            id: messageId,
            conversationId,
            senderId: { not: socket.userId }
          },
          data: { /* Add read status fields if needed */ }
        });
      } else {
        // Mark all messages in conversation as read
        await this.prisma.message.updateMany({
          where: {
            conversationId,
            senderId: { not: socket.userId }
          },
          data: { /* Add read status fields if needed */ }
        });
      }

      // Notify sender that message was read
      socket.to(`conversation:${conversationId}`).emit('chat:message:read', {
        conversationId,
        messageId,
        readBy: socket.userId
      });

    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  private async sendMessageNotification(conversation: any, message: any) {
    // Implementation for push notifications
    // This would integrate with your notification service
    console.log('Sending message notification:', { conversation, message });
  }
}
```

### 3. Consultation Handler (WebRTC Signaling)

```typescript
// src/socket/handlers/consultationHandler.ts
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedSocket } from '../socketServer';

export class ConsultationHandler {
  constructor(
    private io: SocketIOServer,
    private prisma: PrismaClient
  ) {}

  async handleJoinRoom(socket: AuthenticatedSocket, data: { sessionId: string }) {
    try {
      const { sessionId } = data;

      // Verify user has access to this consultation session
      const session = await this.prisma.consultationSession.findFirst({
        where: {
          id: sessionId,
          OR: [
            { patientId: socket.userId },
            { physicianId: socket.userId }
          ]
        },
        include: {
          room: true,
          appointment: {
            include: {
              patient: { include: { profile: true } },
              physician: true
            }
          }
        }
      });

      if (!session) {
        socket.emit('error', { message: 'Consultation session not found or access denied' });
        return;
      }

      const roomName = `consultation:${sessionId}`;
      socket.join(roomName);

      // Update room status
      const updateData: any = {};
      if (socket.userRole === 'PATIENT') {
        updateData.patientJoined = true;
      } else if (socket.userRole === 'PHYSICIAN') {
        updateData.physicianJoined = true;
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.consultationRoom.update({
          where: { sessionId },
          data: updateData
        });
      }

      // Notify others in the room
      socket.to(roomName).emit('consultation:user_joined', {
        userId: socket.userId,
        userRole: socket.userRole,
        userProfile: socket.profile,
        sessionId
      });

      // Send current room state to the joining user
      const updatedRoom = await this.prisma.consultationRoom.findUnique({
        where: { sessionId }
      });

      socket.emit('consultation:room_state', {
        session,
        room: updatedRoom
      });

    } catch (error) {
      console.error('Error joining consultation room:', error);
      socket.emit('error', { message: 'Failed to join consultation room' });
    }
  }

  async handleLeaveRoom(socket: AuthenticatedSocket, data: { sessionId: string }) {
    const { sessionId } = data;
    const roomName = `consultation:${sessionId}`;
    
    socket.leave(roomName);

    // Update room status
    const updateData: any = {};
    if (socket.userRole === 'PATIENT') {
      updateData.patientJoined = false;
    } else if (socket.userRole === 'PHYSICIAN') {
      updateData.physicianJoined = false;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.consultationRoom.update({
        where: { sessionId },
        data: updateData
      });
    }

    // Notify others that user left
    socket.to(roomName).emit('consultation:user_left', {
      userId: socket.userId,
      sessionId
    });
  }

  handleOffer(socket: AuthenticatedSocket, data: {
    sessionId: string;
    offer: RTCSessionDescriptionInit;
    targetUserId: string;
  }) {
    const { sessionId, offer, targetUserId } = data;
    
    // Send offer to target user
    socket.to(`user:${targetUserId}`).emit('consultation:offer', {
      sessionId,
      offer,
      fromUserId: socket.userId,
      fromUserRole: socket.userRole
    });
  }

  handleAnswer(socket: AuthenticatedSocket, data: {
    sessionId: string;
    answer: RTCSessionDescriptionInit;
    targetUserId: string;
  }) {
    const { sessionId, answer, targetUserId } = data;
    
    // Send answer to target user
    socket.to(`user:${targetUserId}`).emit('consultation:answer', {
      sessionId,
      answer,
      fromUserId: socket.userId,
      fromUserRole: socket.userRole
    });
  }

  handleIceCandidate(socket: AuthenticatedSocket, data: {
    sessionId: string;
    candidate: RTCIceCandidateInit;
    targetUserId: string;
  }) {
    const { sessionId, candidate, targetUserId } = data;
    
    // Send ICE candidate to target user
    socket.to(`user:${targetUserId}`).emit('consultation:ice-candidate', {
      sessionId,
      candidate,
      fromUserId: socket.userId
    });
  }

  async handleStartSession(socket: AuthenticatedSocket, data: { sessionId: string }) {
    try {
      const { sessionId } = data;

      // Update session status
      await this.prisma.consultationSession.update({
        where: { id: sessionId },
        data: {
          status: 'in_progress',
          startedAt: new Date()
        }
      });

      // Update room status
      await this.prisma.consultationRoom.update({
        where: { sessionId },
        data: { roomStatus: 'active' }
      });

      // Notify all users in the room
      this.io.to(`consultation:${sessionId}`).emit('consultation:session_started', {
        sessionId,
        startedBy: socket.userId,
        startedAt: new Date()
      });

    } catch (error) {
      console.error('Error starting consultation session:', error);
      socket.emit('error', { message: 'Failed to start consultation session' });
    }
  }

  async handleEndSession(socket: AuthenticatedSocket, data: { sessionId: string }) {
    try {
      const { sessionId } = data;

      // Get session to calculate duration
      const session = await this.prisma.consultationSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      const endTime = new Date();
      const startTime = session.startedAt || session.createdAt;
      const durationMinutes = Math.floor(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      );

      // Update session status
      await this.prisma.consultationSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          endedAt: endTime,
          durationMinutes
        }
      });

      // Update room status
      await this.prisma.consultationRoom.update({
        where: { sessionId },
        data: { roomStatus: 'completed' }
      });

      // Notify all users in the room
      this.io.to(`consultation:${sessionId}`).emit('consultation:session_ended', {
        sessionId,
        endedBy: socket.userId,
        endedAt: endTime,
        durationMinutes
      });

      // Process payment if needed
      await this.processConsultationPayment(sessionId);

    } catch (error) {
      console.error('Error ending consultation session:', error);
      socket.emit('error', { message: 'Failed to end consultation session' });
    }
  }

  private async processConsultationPayment(sessionId: string) {
    // Implementation for payment processing
    // This would integrate with your payment service
    console.log('Processing consultation payment for session:', sessionId);
  }
}
```

### 4. Notification Handler

```typescript
// src/socket/handlers/notificationHandler.ts
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedSocket } from '../socketServer';

export class NotificationHandler {
  constructor(
    private io: SocketIOServer,
    private prisma: PrismaClient
  ) {}

  handleSubscribe(socket: AuthenticatedSocket, data: { channels?: string[] }) {
    const { channels = [] } = data;

    // Subscribe to user-specific notifications
    socket.join(`notifications:${socket.userId}`);

    // Subscribe to role-based notifications
    socket.join(`notifications:role:${socket.userRole}`);

    // Subscribe to custom channels
    channels.forEach(channel => {
      socket.join(`notifications:${channel}`);
    });

    socket.emit('notifications:subscribed', {
      channels: [
        `notifications:${socket.userId}`,
        `notifications:role:${socket.userRole}`,
        ...channels.map(c => `notifications:${c}`)
      ]
    });
  }

  async handleMarkAsRead(socket: AuthenticatedSocket, data: {
    notificationId?: string;
    markAllAsRead?: boolean;
  }) {
    try {
      const { notificationId, markAllAsRead } = data;

      if (markAllAsRead) {
        await this.prisma.notification.updateMany({
          where: {
            userId: socket.userId,
            read: false
          },
          data: { read: true }
        });
      } else if (notificationId) {
        await this.prisma.notification.update({
          where: {
            id: notificationId,
            userId: socket.userId
          },
          data: { read: true }
        });
      }

      socket.emit('notifications:marked_read', {
        notificationId,
        markAllAsRead
      });

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Method to send notification from other parts of the application
  async sendNotification(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    try {
      // Save to database
      const savedNotification = await this.prisma.notification.create({
        data: {
          userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: false
        }
      });

      // Send via Socket.IO
      this.io.to(`notifications:${userId}`).emit('notification:new', {
        ...savedNotification,
        data: notification.data
      });

      return savedNotification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}
```

### 5. Presence Handler

```typescript
// src/socket/handlers/presenceHandler.ts
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedSocket } from '../socketServer';

export class PresenceHandler {
  private userPresence = new Map<string, {
    status: 'online' | 'away' | 'busy' | 'offline';
    lastSeen: Date;
    socketIds: Set<string>;
  }>();

  constructor(
    private io: SocketIOServer,
    private prisma: PrismaClient
  ) {}

  handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    
    if (!this.userPresence.has(userId)) {
      this.userPresence.set(userId, {
        status: 'online',
        lastSeen: new Date(),
        socketIds: new Set()
      });
    }

    const presence = this.userPresence.get(userId)!;
    presence.socketIds.add(socket.id);
    presence.status = 'online';
    presence.lastSeen = new Date();

    // Broadcast presence update
    this.broadcastPresenceUpdate(userId, presence);

    // Handle status changes
    socket.on('presence:status', (data: { status: 'online' | 'away' | 'busy' }) => {
      this.handleStatusChange(socket, data.status);
    });
  }

  handleDisconnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    const presence = this.userPresence.get(userId);

    if (presence) {
      presence.socketIds.delete(socket.id);
      
      // If no more active connections, mark as offline
      if (presence.socketIds.size === 0) {
        presence.status = 'offline';
        presence.lastSeen = new Date();
        
        // Set a timeout to remove from memory if still offline
        setTimeout(() => {
          const currentPresence = this.userPresence.get(userId);
          if (currentPresence && currentPresence.status === 'offline') {
            this.userPresence.delete(userId);
          }
        }, 300000); // 5 minutes
      }

      this.broadcastPresenceUpdate(userId, presence);
    }
  }

  private handleStatusChange(socket: AuthenticatedSocket, status: 'online' | 'away' | 'busy') {
    const userId = socket.userId!;
    const presence = this.userPresence.get(userId);

    if (presence) {
      presence.status = status;
      presence.lastSeen = new Date();
      this.broadcastPresenceUpdate(userId, presence);
    }
  }

  private broadcastPresenceUpdate(userId: string, presence: any) {
    // Broadcast to relevant users (contacts, active conversations, etc.)
    this.io.emit('presence:update', {
      userId,
      status: presence.status,
      lastSeen: presence.lastSeen
    });
  }

  getPresence(userId: string) {
    return this.userPresence.get(userId) || {
      status: 'offline',
      lastSeen: new Date(),
      socketIds: new Set()
    };
  }

  getAllPresence() {
    const presence: Record<string, any> = {};
    this.userPresence.forEach((value, key) => {
      presence[key] = {
        status: value.status,
        lastSeen: value.lastSeen
      };
    });
    return presence;
  }
}
```

### 6. Integration with Express App

```typescript
// src/app.ts
import express from 'express';
import { createServer } from 'http';
import { SocketServer } from './socket/socketServer';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO server
const socketServer = new SocketServer(httpServer);

// Make socket server available to routes
app.set('socketServer', socketServer);

// Your existing Express middleware and routes
// ...

export { app, httpServer, socketServer };
```

### 7. Client-Side Integration Examples

```typescript
// Frontend Socket.IO client
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(process.env.REACT_APP_SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Chat events
    this.socket.on('chat:message:new', (data) => {
      // Handle new message
      this.handleNewMessage(data);
    });

    // Consultation events
    this.socket.on('consultation:offer', (data) => {
      // Handle WebRTC offer
      this.handleConsultationOffer(data);
    });

    // Notification events
    this.socket.on('notification:new', (data) => {
      // Handle new notification
      this.handleNewNotification(data);
    });
  }

  // Chat methods
  joinConversation(conversationId: string) {
    this.socket?.emit('chat:join', { conversationId });
  }

  sendMessage(conversationId: string, content: string) {
    this.socket?.emit('chat:message', { conversationId, content });
  }

  // Consultation methods
  joinConsultationRoom(sessionId: string) {
    this.socket?.emit('consultation:join', { sessionId });
  }

  sendOffer(sessionId: string, offer: RTCSessionDescriptionInit, targetUserId: string) {
    this.socket?.emit('consultation:offer', { sessionId, offer, targetUserId });
  }

  // Utility methods
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  private handleNewMessage(data: any) {
    // Update UI with new message
  }

  private handleConsultationOffer(data: any) {
    // Handle WebRTC offer
  }

  private handleNewNotification(data: any) {
    // Show notification to user
  }
}

export const socketService = new SocketService();
```

## 🔧 Performance Optimizations

### Redis Integration (Optional)
```typescript
// For scaling across multiple servers
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### Connection Management
- **Connection Pooling**: Manage active connections efficiently
- **Memory Management**: Clean up inactive connections
- **Rate Limiting**: Prevent connection abuse
- **Heartbeat**: Monitor connection health

### Event Optimization
- **Event Batching**: Batch multiple events together
- **Selective Broadcasting**: Only send to relevant users
- **Message Queuing**: Queue messages for offline users
- **Compression**: Enable compression for large payloads

## 📊 Monitoring and Analytics

### Connection Metrics
- Active connections count
- Connection duration
- Event frequency
- Error rates

### Performance Metrics
- Message delivery time
- Room join/leave frequency
- WebRTC connection success rate
- Server resource usage