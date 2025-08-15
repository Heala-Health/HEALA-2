
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoStreams } from './VideoStreams';
import { VideoCallControls } from './VideoCallControls';
import { useWebRTCVideoCall } from './hooks/useWebRTCVideoCall';
import { useConsultationPayment } from './hooks/useConsultationPayment';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ConsultationSession } from './types';
import { supabase } from '@/integrations/supabase/client';
import { VideoCallChatSimple } from './VideoCallChatSimple';

interface EnhancedVideoInterfaceProps {
  sessionId: string;
  currentUserId: string;
  isPhysician?: boolean;
}

export const EnhancedVideoInterface: React.FC<EnhancedVideoInterfaceProps> = ({
  sessionId,
  currentUserId,
  isPhysician = false
}) => {
  const { toast } = useToast();
  const { processConsultationPayment, processing } = useConsultationPayment();
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<ConsultationSession | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const {
    localStream,
    remoteStream,
    isCallActive,
    connectionState,
    videoEnabled,
    audioEnabled,
    isConnecting,
    error,
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

  const fetchSessionData = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_sessions')
        .select(`
          *,
          patient:profiles!consultation_sessions_patient_id_fkey (first_name, last_name),
          physician:profiles!consultation_sessions_physician_id_fkey (first_name, last_name, specialization),
          appointment:appointments (appointment_date, appointment_time)
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session data:', error);
        toast({
          title: "Error",
          description: "Failed to load consultation session details.",
          variant: "destructive"
        });
        return;
      }

      // Transform the data to ensure proper typing
      const transformedData: ConsultationSession = {
        ...data,
        patient: Array.isArray(data.patient) ? data.patient[0] : data.patient,
        physician: Array.isArray(data.physician) ? data.physician[0] : data.physician,
        appointment: Array.isArray(data.appointment) ? data.appointment[0] : data.appointment
      };

      setSessionData(transformedData);
      setPaymentCompleted(data.payment_status === 'paid');
    } catch (error) {
      console.error('Error fetching session data:', error);
      toast({
        title: "Error",
        description: "Failed to load consultation session details.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionData && sessionData.payment_status === 'paid') {
      setPaymentCompleted(true);
    }
  }, [sessionData]);

  const handlePayment = async () => {
    if (!sessionData || processing) return;
    
    try {
      const success = await processConsultationPayment(
        sessionId,
        sessionData.physician_id,
        sessionData.consultation_rate
      );
      
      if (success) {
        setPaymentCompleted(true);
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleEndCall = () => {
    endCall();
    // Additional logic to update consultation status in database if needed
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Video Streams */}
      <VideoStreams
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        isCallActive={isCallActive}
        connectionState={connectionState}
      />

      {/* Payment Section */}
      {!isPhysician && sessionData && !paymentCompleted && (
        <div className="absolute top-4 left-4 bg-white text-gray-800 rounded-md shadow-md p-4 z-10">
          <h3 className="text-lg font-semibold mb-2">Consultation Payment</h3>
          <p className="mb-2">
            Consultation Rate: ₦{sessionData.consultation_rate.toLocaleString()}
          </p>
          <Button onClick={handlePayment} disabled={processing}>
            {processing ? 'Processing Payment...' : 'Pay Now'}
          </Button>
        </div>
      )}

      {/* Chat Button */}
      <Button
        variant="secondary"
        className="absolute bottom-4 left-4 z-10"
        onClick={() => setShowChat(!showChat)}
      >
        {showChat ? 'Hide Chat' : 'Show Chat'}
      </Button>

      {/* Chat Component */}
      {showChat && (
        <div className="absolute top-4 right-4 w-96 h-[calc(100%-8rem)] z-10">
          <VideoCallChatSimple
            sessionId={sessionId}
            currentUserId={currentUserId}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      {/* Call Controls */}
      <VideoCallControls
        isCallActive={isCallActive}
        videoEnabled={videoEnabled}
        audioEnabled={audioEnabled}
        toggleVideo={toggleVideo}
        toggleAudio={toggleAudio}
        endCall={handleEndCall}
        startScreenShare={startScreenShare}
        stopScreenShare={stopScreenShare}
      />
    </div>
  );
};
