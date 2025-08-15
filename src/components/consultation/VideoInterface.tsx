
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConsultationSession } from './types';
import { useWebRTCVideoCall } from './hooks/useWebRTCVideoCall';
import { VideoStreams } from './VideoStreams';
import { ConsultationControls } from './ConsultationControls';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConsultationPayment } from './hooks/useConsultationPayment';
import { VideoCallChatSimple } from './VideoCallChatSimple';

interface VideoInterfaceProps {
  sessionId: string;
  currentUserId: string;
  isPhysician?: boolean;
}

export const VideoInterface: React.FC<VideoInterfaceProps> = ({
  sessionId,
  currentUserId,
  isPhysician = false
}) => {
  const { processConsultationPayment, processing } = useConsultationPayment();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<ConsultationSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const {
    localStream,
    remoteStream,
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
  } = useWebRTCVideoCall(sessionId, currentUserId);

  const fetchSessionData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await fetch(`/api/consultation-session?sessionId=${sessionId}`)
        .then(res => res.json());

      if (error) {
        console.error('Error fetching session data:', error);
        setError('Failed to load session data.');
        throw error;
      }

      if (!data) {
        setError('Session data not found.');
        throw new Error('Session data not found.');
      }

      setSessionData(data);
      setPaymentCompleted(data.payment_status === 'paid');
      setRetryCount(0);
    } catch (err) {
      console.error('Error in fetchSessionData:', err);
      setError('Failed to load session data.');
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prevCount => prevCount + 1);
          fetchSessionData();
        }, 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, retryCount]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  useEffect(() => {
    if (sessionData && sessionData.room_status === 'active' && !isCallActive) {
      startCall();
    }
  }, [sessionData, isCallActive, startCall]);

  const handlePayment = async () => {
    if (!sessionData || processing) return;
    
    try {
      const success = await processConsultationPayment(
        sessionId,
        sessionData.physician_id,
        sessionData.consultation_rate
      );
      
      if (success) {
        // Handle successful payment
        console.log('Payment completed successfully');
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleEndCall = () => {
    endCall();
    // Additional logic to update session status in the database can be added here
  };

  const toggleChat = () => {
    setShowChat((prevShowChat) => !prevShowChat);
  };

  if (isLoading) {
    return (
      <Card className="w-full h-full flex flex-col">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-64" />
          </CardTitle>
        </CardHeader>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="w-32 h-32 rounded-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-full flex flex-col">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <div className="flex-1 flex items-center justify-center flex-col">
          <p className="text-center text-gray-500">{error}</p>
          {retryCount < maxRetries && (
            <Button onClick={fetchSessionData} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (!sessionData) {
    return (
      <Card className="w-full h-full flex flex-col">
        <CardHeader>
          <CardTitle>Session Not Found</CardTitle>
        </CardHeader>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-500">
            The consultation session could not be found.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <VideoStreams
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        isCallActive={isCallActive}
        connectionState={connectionState}
      />

      <ConsultationControls
        isCallActive={isCallActive}
        videoEnabled={videoEnabled}
        audioEnabled={audioEnabled}
        toggleVideo={toggleVideo}
        toggleAudio={toggleAudio}
        endCall={handleEndCall}
        reconnect={reconnect}
        startScreenShare={startScreenShare}
        stopScreenShare={stopScreenShare}
        toggleChat={toggleChat}
        showChat={showChat}
        isPhysician={isPhysician}
        sessionData={sessionData}
        paymentCompleted={paymentCompleted}
        processing={processing}
        handlePayment={handlePayment}
      />

      {showChat && (
        <div className="absolute top-0 right-0 h-full w-80 bg-gray-50 border-l border-gray-200 shadow-md z-10">
          <VideoCallChatSimple
            sessionId={sessionId}
            currentUserId={currentUserId}
            onClose={toggleChat}
          />
        </div>
      )}
    </div>
  );
};
