
import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebRTCVideoCallProps {
  sessionId: string;
  userId: string;
  userRole: 'patient' | 'physician';
}

export const useWebRTCVideoCall = ({ sessionId, userId, userRole }: WebRTCVideoCallProps) => {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);

  console.log(`🎥 [WebRTCVideoCall] Hook initialized for ${userRole} in session ${sessionId}`);

  // WebRTC configuration with TURN servers for better connectivity
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  };

  // Setup signaling channel
  useEffect(() => {
    if (!sessionId || !userId) return;

    console.log('📡 [WebRTCVideoCall] Setting up signaling channel');
    const channelName = `webrtc_${sessionId}`;
    
    channelRef.current = supabase.channel(channelName);

    const handleOffer = async (payload: any) => {
      if (payload.payload.fromUser === userId) return;
      
      console.log('📥 [WebRTCVideoCall] Received offer');
      
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      await pc.setRemoteDescription(payload.payload.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'answer',
          payload: {
            answer,
            fromUser: userId
          }
        });
      }
    };

    const handleAnswer = async (payload: any) => {
      if (payload.payload.fromUser === userId) return;
      
      console.log('📥 [WebRTCVideoCall] Received answer');
      
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(payload.payload.answer);
      }
    };

    const handleIceCandidate = async (payload: any) => {
      if (payload.payload.fromUser === userId) return;
      
      console.log('📥 [WebRTCVideoCall] Received ICE candidate');
      
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(payload.payload.candidate);
      }
    };

    const handleEndCall = (payload: any) => {
      if (payload.payload.fromUser === userId) return;
      
      console.log('📥 [WebRTCVideoCall] Received end call signal');
      endCall(false);
    };

    channelRef.current
      .on('broadcast', { event: 'offer' }, handleOffer)
      .on('broadcast', { event: 'answer' }, handleAnswer)
      .on('broadcast', { event: 'ice-candidate' }, handleIceCandidate)
      .on('broadcast', { event: 'end-call' }, handleEndCall)
      .subscribe((status) => {
        console.log('📡 [WebRTCVideoCall] Channel subscription status:', status);
      });

    return () => {
      console.log('🧹 [WebRTCVideoCall] Cleaning up signaling channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId, userId]);

  const createPeerConnection = useCallback(() => {
    console.log('🔗 [WebRTCVideoCall] Creating peer connection');
    
    const pc = new RTCPeerConnection(rtcConfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        console.log('🧊 [WebRTCVideoCall] Sending ICE candidate');
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            fromUser: userId
          }
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('📹 [WebRTCVideoCall] Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔄 [WebRTCVideoCall] Connection state changed:', pc.connectionState);
      setConnectionState(pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        setIsConnecting(false);
        toast({
          title: "✅ Connected",
          description: "Video call connection established",
        });
      } else if (pc.connectionState === 'failed') {
        toast({
          title: "❌ Connection Failed",
          description: "Please try reconnecting",
          variant: "destructive"
        });
      } else if (pc.connectionState === 'disconnected') {
        console.log('⚠️ [WebRTCVideoCall] Connection disconnected, attempting reconnection');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 [WebRTCVideoCall] ICE connection state:', pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'failed') {
        console.log('🔄 [WebRTCVideoCall] ICE connection failed, restarting ICE');
        pc.restartIce();
      }
    };

    return pc;
  }, [userId, toast]);

  const startScreenShare = useCallback(async () => {
    try {
      console.log('🖥️ [WebRTCVideoCall] Starting screen share');
      
      // Fixed screen sharing API call - removed invalid cursor property
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      screenStreamRef.current = screenStream;
      
      // Replace video track in peer connection
      if (peerConnectionRef.current && localStreamRef.current) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(
          s => s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }

      // Update local video display
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      // Handle screen share end
      screenStream.getVideoTracks()[0].onended = () => {
        console.log('🖥️ [WebRTCVideoCall] Screen share ended');
        stopScreenShare();
      };

      setIsScreenSharing(true);
      
    } catch (error) {
      console.error('❌ [WebRTCVideoCall] Screen share failed:', error);
      throw error;
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    try {
      console.log('🖥️ [WebRTCVideoCall] Stopping screen share');
      
      // Stop screen stream
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      // Get camera stream back
      if (localStreamRef.current && peerConnectionRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(
          s => s.track && s.track.kind === 'video'
        );
        
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }

      // Update local video display
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      setIsScreenSharing(false);
      
    } catch (error) {
      console.error('❌ [WebRTCVideoCall] Error stopping screen share:', error);
      throw error;
    }
  }, []);

  const reconnect = useCallback(async () => {
    console.log('🔄 [WebRTCVideoCall] Attempting to reconnect');
    
    try {
      if (peerConnectionRef.current) {
        console.log('🔄 [WebRTCVideoCall] Restarting ICE for existing connection');
        peerConnectionRef.current.restartIce();
        return;
      }

      // If no peer connection exists, restart the call
      if (localStreamRef.current) {
        console.log('🔄 [WebRTCVideoCall] Restarting call with existing stream');
        await startCall();
      } else {
        console.log('🔄 [WebRTCVideoCall] Full reconnection - getting new media');
        await startCall();
      }
    } catch (error) {
      console.error('❌ [WebRTCVideoCall] Reconnection failed:', error);
      throw error;
    }
  }, []);

  const startCall = async () => {
    try {
      console.log('📞 [WebRTCVideoCall] Starting call...');
      setIsConnecting(true);

      // Get user media with fallback constraints
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (error) {
        console.warn('🔄 [WebRTCVideoCall] HD video failed, trying standard quality');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsCallActive(true);

      // Create peer connection and add tracks
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // If physician, create and send offer
      if (userRole === 'physician') {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'offer',
            payload: {
              offer,
              fromUser: userId
            }
          });
        }
      }

      toast({
        title: "📞 Video Call Started",
        description: `${userRole} ready for video call`,
      });

    } catch (error) {
      console.error('❌ [WebRTCVideoCall] Error starting call:', error);
      setIsConnecting(false);
      toast({
        title: "Error",
        description: `Failed to start video call: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const endCall = (sendSignal = true) => {
    console.log('📞 [WebRTCVideoCall] Ending call');
    
    // Stop all streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (sendSignal && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'end-call',
        payload: { fromUser: userId }
      });
    }

    setIsCallActive(false);
    setConnectionState('new');
    setIsConnecting(false);
    setIsScreenSharing(false);

    toast({
      title: "📞 Call Ended",
      description: "Video call has been terminated",
    });
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
        console.log(`📹 [WebRTCVideoCall] Video ${!videoEnabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
        console.log(`🎤 [WebRTCVideoCall] Audio ${!audioEnabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  return {
    isCallActive,
    connectionState,
    videoEnabled,
    audioEnabled,
    isConnecting,
    localVideoRef,
    remoteVideoRef,
    peerConnectionRef,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    reconnect,
    startScreenShare,
    stopScreenShare,
    isScreenSharing
  };
};
