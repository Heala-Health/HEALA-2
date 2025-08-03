import { Server as SocketIOServer, type Socket } from 'socket.io';
import { type Server as HTTPServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import { ChatHandler } from './handlers/chatHandler.js';
import { ConsultationHandler } from './handlers/consultationHandler.js';
import { NotificationHandler } from './handlers/notificationHandler.js';
import { PresenceHandler } from './handlers/presenceHandler.js';

const prisma = new PrismaClient();

// Define interfaces for better type safety
export interface Profile {
  role: string;
  isActive: boolean;
  // Add other profile properties as needed
}

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  profile?: Profile;
}

interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: unknown;
}

interface ChatMessagePayload {
  message: {
    id: string;
    conversationId: string;
    senderId?: string | null;
    senderType: string;
    messageType: string;
    content: string;
    createdAt: Date;
    sender?: {
      profile?: Profile;
    };
  };
  conversationId: string;
}

interface ConsultationUpdatePayload {
  sessionId: string;
  endedAt: Date;
  durationMinutes?: number | null;
  // Add other relevant update properties
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
  public sendNotification(userId: string, notification: NotificationPayload) {
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  public sendChatMessage(conversationId: string, message: ChatMessagePayload) {
    this.io.to(`conversation:${conversationId}`).emit('chat:message:new', message);
  }

  public broadcastConsultationUpdate(sessionId: string, update: ConsultationUpdatePayload) {
    this.io.to(`consultation:${sessionId}`).emit('consultation:update', update);
  }
}
