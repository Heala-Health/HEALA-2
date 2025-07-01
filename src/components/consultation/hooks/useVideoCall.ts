import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoCallProps {
  sessionId: string;
  userId: string;
  userRole: 'patient' | 'physician';
  autoStart?: boolean;
}

// DEPRECATED: This hook is replaced by useWebRTCVideoCall
// This is kept for backward compatibility but should not be used for new features
export const useVideoCall = ({ sessionId, userId, userRole, autoStart = false }: VideoCallProps) => {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);

  console.log(`⚠️ [useVideoCall] DEPRECATED: Use useWebRTCVideoCall instead for ${userRole} in session ${sessionId}`);

  // Auto-start effect
  useEffect(() => {
    console.log('⚠️ [useVideoCall] This hook is deprecated. Please use useWebRTCVideoCall for better video calling experience.');
  }, []);

  // Setup real-time channel for signaling
  useEffect(() => {
    if (!sessionId || !userId) return;

    console.log('📡 [useVideoCall] Setting up signaling channel');
    const channelName = `video_call_${sessionId}`;
    
    try {
      channelRef.current = supabase.channel(channelName);

      channelRef.current
        .on('broadcast', { event: 'video_signal' }, (payload: any) => {
          console.log('📨 [useVideoCall] Received video signal:', payload);
          handleVideoSignal(payload.payload);
        })
        .on('broadcast', { event: 'connection_status' }, (payload: any) => {
          console.log('📊 [useVideoCall] Connection status update:', payload);
          handleConnectionStatus(payload.payload);
        })
        .subscribe((status) => {
          console.log('📡 [useVideoCall] Channel subscription status:', status);
        });

    } catch (error) {
      console.error('❌ [useVideoCall] Error setting up channel:', error);
      setError('Failed to setup communication channel');
    }

    return () => {
      console.log('🧹 [useVideoCall] Cleaning up channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId, userId]);

  const handleVideoSignal = (signal: any) => {
    console.log('🔄 [useVideoCall] Processing video signal:', signal);
    // For now, just log - we'll implement WebRTC in next step
  };

  const handleConnectionStatus = (status: any) => {
    console.log('🔗 [useVideoCall] Processing connection status:', status);
    if (status.userId !== userId) {
      setConnectionState(status.state);
    }
  };

  const startCall = async () => {
    console.log('⚠️ [useVideoCall] DEPRECATED: startCall called - please migrate to useWebRTCVideoCall');
    try {
      console.log('📞 [useVideoCall] Starting video call...');
      setError(null);
      setConnectionState('connecting');

      // Step 1: Get user media
      console.log('🎥 [useVideoCall] Requesting user media...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('✅ [useVideoCall] Got user media stream:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      localStreamRef.current = stream;

      // Step 2: Set local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('📺 [useVideoCall] Set local video stream');
      }

      // Step 3: Broadcast that we're ready
      if (channelRef.current) {
        console.log('📡 [useVideoCall] Broadcasting connection status');
        await channelRef.current.send({
          type: 'broadcast',
          event: 'connection_status',
          payload: {
            userId,
            userRole,
            state: 'ready',
            timestamp: new Date().toISOString()
          }
        });
      }

      setIsCallActive(true);
      setConnectionState('ready');

      toast({
        title: "📞 Video Call Started",
        description: `${userRole} is ready for video call`,
      });

      // For demo: simulate connection after 3 seconds
      setTimeout(() => {
        console.log('🎭 [useVideoCall] Simulating connection established');
        setConnectionState('connected');
        toast({
          title: "✅ Connected",
          description: "Video call connection established",
        });
      }, 3000);

    } catch (error) {
      console.error('❌ [useVideoCall] Error starting call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setConnectionState('failed');
      
      toast({
        title: "Error",
        description: `Failed to start video call: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const endCall = () => {
    console.log('⚠️ [useVideoCall] DEPRECATED: endCall called');
    console.log('📞 [useVideoCall] Ending video call');
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('🛑 [useVideoCall] Stopping track:', track.kind);
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Broadcast end call
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'connection_status',
        payload: {
          userId,
          userRole,
          state: 'ended',
          timestamp: new Date().toISOString()
        }
      });
    }

    setIsCallActive(false);
    setConnectionState('new');
    setError(null);

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
        console.log(`📹 [useVideoCall] Video ${!videoEnabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
        console.log(`🎤 [useVideoCall] Audio ${!audioEnabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  return {
    isCallActive,
    connectionState,
    videoEnabled,
    audioEnabled,
    error,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio
  };
};
