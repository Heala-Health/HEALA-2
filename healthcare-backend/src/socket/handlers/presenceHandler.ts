import { type Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { type AuthenticatedSocket } from '../socketServer.js';

interface Presence {
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  socketIds: Set<string>;
}

export class PresenceHandler {
  private userPresence = new Map<string, Presence>();

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

  private broadcastPresenceUpdate(userId: string, presence: Presence) {
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
    const presence: Record<string, { status: string; lastSeen: Date }> = {};
    this.userPresence.forEach((value, key) => {
      presence[key] = {
        status: value.status,
        lastSeen: value.lastSeen
      };
    });
    return presence;
  }
}
