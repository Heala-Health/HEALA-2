
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRetry } from './useRetry';

export interface WebRTCConnection {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  error: string | null;
}

export const useWebRTC = (roomId: string, isInitiator: boolean = false) => {
  const { toast } = useToast();
  const [connection, setConnection] = useState<WebRTCConnection>({
    localStream: null,
    remoteStream: null,
    isConnected: false,
    isConnecting: false,
    connectionQuality: 'disconnected',
    error: null,
  });
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qualityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { executeWithRetry } = useRetry(
    async (fn: () => Promise<void>) => await fn(),
    { maxRetries: 3, initialDelay: 1000, backoffFactor: 2 }
  );
  
  const createPeerConnection = useCallback(() => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
    
    const pc = new RTCPeerConnection(config);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send candidate to remote peer via signaling server
        console.log('New ICE candidate:', event.candidate);
      }
    };
    
    pc.ontrack = (event) => {
      console.log('Remote track received');
      setConnection(prev => ({
        ...prev,
        remoteStream: event.streams[0],
      }));
    };
    
    pc.onconnectionstatechange = () => {
      console.log('Connection state changed:', pc.connectionState);
      
      setConnection(prev => ({
        ...prev,
        isConnected: pc.connectionState === 'connected',
        isConnecting: pc.connectionState === 'connecting',
        error: pc.connectionState === 'failed' ? 'Connection failed' : null,
      }));
      
      if (pc.connectionState === 'failed') {
        handleReconnect();
      }
    };
    
    return pc;
  }, []);
  
  const handleReconnect = useCallback(() => {
    console.log('Attempting to reconnect...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      executeWithRetry(async () => {
        await initializeConnection();
      }).catch((error) => {
        console.error('Reconnection failed:', error);
        toast({
          title: 'Connection Failed',
          description: 'Unable to reconnect. Please refresh the page.',
          variant: 'destructive',
        });
      });
    }, 2000);
  }, [executeWithRetry, toast]);
  
  const checkConnectionQuality = useCallback(() => {
    if (!peerConnectionRef.current) return;
    
    peerConnectionRef.current.getStats().then((stats) => {
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          const packetsLost = report.packetsLost || 0;
          const packetsReceived = report.packetsReceived || 0;
          const lossRate = packetsLost / (packetsLost + packetsReceived);
          
          let quality: WebRTCConnection['connectionQuality'] = 'excellent';
          
          if (lossRate > 0.05) {
            quality = 'poor';
          } else if (lossRate > 0.02) {
            quality = 'good';
          }
          
          setConnection(prev => ({
            ...prev,
            connectionQuality: quality,
          }));
        }
      });
    });
  }, []);
  
  const initializeConnection = useCallback(async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      localStreamRef.current = stream;
      setConnection(prev => ({
        ...prev,
        localStream: stream,
        error: null,
      }));
      
      // Create peer connection
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Start connection quality monitoring
      qualityCheckIntervalRef.current = setInterval(checkConnectionQuality, 5000);
      
    } catch (error) {
      console.error('Failed to initialize WebRTC connection:', error);
      setConnection(prev => ({
        ...prev,
        error: 'Failed to access camera/microphone',
      }));
      
      toast({
        title: 'Media Access Error',
        description: 'Please allow camera and microphone access to start the consultation.',
        variant: 'destructive',
      });
    }
  }, [createPeerConnection, checkConnectionQuality, toast]);
  
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, []);
  
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, []);
  
  const endCall = useCallback(() => {
    // Clean up streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Clear intervals and timeouts
    if (qualityCheckIntervalRef.current) {
      clearInterval(qualityCheckIntervalRef.current);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Reset state
    setConnection({
      localStream: null,
      remoteStream: null,
      isConnected: false,
      isConnecting: false,
      connectionQuality: 'disconnected',
      error: null,
    });
  }, []);
  
  useEffect(() => {
    if (roomId) {
      initializeConnection();
    }
    
    return () => {
      endCall();
    };
  }, [roomId, initializeConnection, endCall]);
  
  return {
    connection,
    toggleVideo,
    toggleAudio,
    endCall,
    reconnect: handleReconnect,
  };
};
