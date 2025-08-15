
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface WebRTCConnection {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  connectionState: RTCPeerConnectionState;
  videoEnabled: boolean;
  audioEnabled: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const useWebRTCVideoCall = (sessionId: string, userId: string) => {
  const { toast } = useToast();
  const [connection, setConnection] = useState<WebRTCConnection>({
    localStream: null,
    remoteStream: null,
    isCallActive: false,
    connectionState: 'new',
    videoEnabled: true,
    audioEnabled: true,
    isConnecting: false,
    error: null,
  });
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null!);
  const remoteVideoRef = useRef<HTMLVideoElement>(null!);
  const localStreamRef = useRef<MediaStream | null>(null);

  const createPeerConnection = useCallback(() => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
    
    const pc = new RTCPeerConnection(config);
    
    pc.onconnectionstatechange = () => {
      console.log('Connection state changed:', pc.connectionState);
      setConnection(prev => ({
        ...prev,
        connectionState: pc.connectionState,
        isCallActive: pc.connectionState === 'connected',
        isConnecting: pc.connectionState === 'connecting',
      }));
    };
    
    pc.ontrack = (event) => {
      console.log('Remote track received');
      const remoteStream = event.streams[0];
      setConnection(prev => ({
        ...prev,
        remoteStream,
      }));
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };
    
    return pc;
  }, []);

  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      
      localStreamRef.current = stream;
      setConnection(prev => ({
        ...prev,
        localStream: stream,
        error: null,
      }));
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      setConnection(prev => ({
        ...prev,
        error: 'Failed to access camera/microphone',
      }));
      throw error;
    }
  }, []);

  const startCall = useCallback(async () => {
    try {
      setConnection(prev => ({ ...prev, isConnecting: true }));
      
      const stream = await initializeMedia();
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Update room status
      await supabase
        .from('consultation_rooms')
        .update({ 
          patient_joined: true,
          room_status: 'active' 
        })
        .eq('session_id', sessionId);
        
    } catch (error) {
      console.error('Failed to start call:', error);
      setConnection(prev => ({
        ...prev,
        error: 'Failed to start call',
        isConnecting: false,
      }));
    }
  }, [sessionId, initializeMedia, createPeerConnection]);

  const endCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    setConnection({
      localStream: null,
      remoteStream: null,
      isCallActive: false,
      connectionState: 'closed',
      videoEnabled: true,
      audioEnabled: true,
      isConnecting: false,
      error: null,
    });
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setConnection(prev => ({
          ...prev,
          videoEnabled: videoTrack.enabled,
        }));
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setConnection(prev => ({
          ...prev,
          audioEnabled: audioTrack.enabled,
        }));
      }
    }
  }, []);

  const reconnect = useCallback(() => {
    endCall();
    setTimeout(() => {
      startCall();
    }, 1000);
  }, [endCall, startCall]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      if (peerConnectionRef.current && localStreamRef.current) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(
          s => s.track?.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }
      
      toast({
        title: "Screen sharing started",
        description: "You are now sharing your screen",
      });
    } catch (error) {
      console.error('Failed to start screen share:', error);
      toast({
        title: "Screen sharing failed",
        description: "Could not start screen sharing",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopScreenShare = useCallback(async () => {
    try {
      if (peerConnectionRef.current && localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(
          s => s.track?.kind === 'video'
        );
        
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }
      
      toast({
        title: "Screen sharing stopped",
        description: "You are no longer sharing your screen",
      });
    } catch (error) {
      console.error('Failed to stop screen share:', error);
    }
  }, [toast]);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    ...connection,
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
  };
};
