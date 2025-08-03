# WebRTC Signaling Implementation

This document outlines the implementation of the WebRTC signaling server for the healthcare platform, enabling real-time video and audio consultations between patients and physicians.

## 📹 WebRTC Signaling Architecture

The signaling process is facilitated by our existing Socket.IO server, which relays messages between clients to establish a direct peer-to-peer connection.

```
┌───────────────┐      ┌──────────────────┐      ┌───────────────┐
│ Patient Client│      │  Signaling Server│      │Physician Client│
│ (Web Browser) │      │   (Socket.IO)    │      │ (Web Browser)  │
└───────┬───────┘      └────────┬─────────┘      └───────┬───────┘
        │                      │                        │
        │ 1. Join Room         │                        │
        ├─────────────────────►│                        │
        │                      │                        │
        │        2. User Joined (Broadcast)             │
        │◄──────────────────────────────────────────────┤
        │                      │                        │
        │ 3. Send Offer        │                        │
        ├─────────────────────►│                        │
        │                      │                        │
        │         4. Forward Offer                      │
        │◄─────────────────────(to Physician)───────────┤
        │                      │                        │
        │         5. Send Answer                        │
        ├─────────────────────(to Patient)─────────────►│
        │                      │                        │
        │                      │ 6. Forward Answer      │
        │◄─────────────────────┤                        │
        │                      │                        │
        │ 7. Exchange ICE      │                        │
        │    Candidates        │                        │
        │◄────────────────────►│◄───────────────────────►│
        │                      │                        │
        │      8. P2P Connection Established            │
        │◄──────────────────────────────────────────────►│
        │                      │                        │
```

## 🚀 Implementation Details

The core of the signaling logic resides in the `ConsultationHandler` within the Socket.IO server setup. This handler manages the lifecycle of a virtual consultation, including joining rooms and relaying WebRTC signaling messages.

### Key Socket.IO Events

- **`consultation:join`**: A user (patient or physician) joins a specific consultation room. The server verifies their authorization and adds them to the corresponding Socket.IO room.
- **`consultation:leave`**: A user leaves the consultation room.
- **`consultation:offer`**: A client sends an SDP offer to another client to initiate a WebRTC connection. The server forwards this offer to the target user.
- **`consultation:answer`**: A client sends an SDP answer in response to an offer. The server relays this answer back to the originator.
- **`consultation:ice-candidate`**: Clients exchange ICE candidates to negotiate the network path for the peer-to-peer connection. The server forwards these candidates between the clients.

### `ConsultationHandler` Code Snippet

The following code from `src/socket/handlers/consultationHandler.ts` illustrates how these events are handled.

```typescript
// src/socket/handlers/consultationHandler.ts

// ... (imports and constructor)

export class ConsultationHandler {
  // ... (other methods)

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

  // ... (other methods)
}
```

## 🔒 Security Considerations

- **Authentication**: All signaling events are protected by the Socket.IO authentication middleware, ensuring that only authorized users can participate in a consultation.
- **Room Management**: Users are isolated within their specific consultation rooms (`consultation:<session_id>`) to prevent unauthorized access or message interception.
- **Data Validation**: While the server's primary role is to relay messages, basic validation should be performed on incoming data to ensure it is well-formed.

## 📱 Client-Side Implementation

The client-side implementation is responsible for creating and managing the `RTCPeerConnection` object.

### Example Client-Side Logic

```typescript
// Frontend WebRTC service example

class WebRTCService {
  private peerConnection: RTCPeerConnection;
  private socketService: SocketService;

  constructor(socketService: SocketService) {
    this.socketService = socketService;
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    this.setupPeerConnectionListeners();
    this.setupSocketListeners();
  }

  private setupPeerConnectionListeners() {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socketService.sendIceCandidate(this.sessionId, event.candidate, this.targetUserId);
      }
    };

    this.peerConnection.ontrack = (event) => {
      // Attach remote stream to video element
      this.remoteVideoElement.srcObject = event.streams[0];
    };
  }

  private setupSocketListeners() {
    this.socketService.onOffer((data) => {
      this.handleOffer(data.offer);
    });

    this.socketService.onAnswer((data) => {
      this.handleAnswer(data.answer);
    });

    this.socketService.onIceCandidate((data) => {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    });
  }

  async startCall(localStream) {
    localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, localStream);
    });

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.socketService.sendOffer(this.sessionId, offer, this.targetUserId);
  }

  async handleOffer(offer) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.socketService.sendAnswer(this.sessionId, answer, this.targetUserId);
  }

  async handleAnswer(answer) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }
}
```

This documentation provides a clear path for implementing and maintaining the WebRTC signaling functionality within the healthcare platform.
