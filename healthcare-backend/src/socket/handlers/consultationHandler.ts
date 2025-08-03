import { type Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { type AuthenticatedSocket, type Profile } from '../socketServer.js';

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
      const updateData: Record<string, boolean> = {};
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
        userProfile: socket.profile as Profile,
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
    const updateData: Record<string, boolean> = {};
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
