import { type Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { type AuthenticatedSocket } from '../socketServer.js';

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

  private async sendMessageNotification(conversation: unknown, message: unknown) {
    // Implementation for push notifications
    // This would integrate with your notification service
    console.log('Sending message notification:', { conversation, message });
  }
}
