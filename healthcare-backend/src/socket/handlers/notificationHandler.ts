import { type Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { type AuthenticatedSocket } from '../socketServer.js';

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
  async sendNotification(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }
  ) {
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
