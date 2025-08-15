
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { VideoStreams } from './VideoStreams';
import { VideoCallControls } from './VideoCallControls';
import { useWebRTCVideoCall } from './hooks/useWebRTCVideoCall';
import { ConsultationSession, EnhancedVirtualConsultationRoomProps } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useConsultationPayment } from './hooks/useConsultationPayment';

export const EnhancedVirtualConsultationRoom: React.FC<EnhancedVirtualConsultationRoomProps> = ({
  sessionId,
  onSessionEnd
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<ConsultationSession | null>(null);
  const { processConsultationPayment, processing } = useConsultationPayment();
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
  } = useWebRTCVideoCall(sessionId || '', user?.id || '');

  useEffect(() => {
    const fetchSessionData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('consultation_sessions')
          .select(`
            *,
            patient:patient_id (first_name, last_name),
            physician:physician_id (first_name, last_name, specialization),
            appointment:appointment_id (appointment_date, appointment_time),
            consultation_rooms (id, room_token, room_status)
          `)
          .eq('id', sessionId)
          .single();

        if (error) {
          console.error('Error fetching session data:', error);
          toast({
            title: "Error",
            description: "Failed to load consultation session.",
            variant: "destructive"
          });
          return;
        }

        // Transform the data to ensure proper typing
        const transformedData: ConsultationSession = {
          ...data,
          room_status: data.consultation_rooms?.room_status,
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
          description: "Failed to load consultation session.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId, toast]);

  useEffect(() => {
    if (sessionData && sessionData.room_status === 'active' && !isCallActive) {
      startCall();
    }
  }, [sessionData, isCallActive, startCall]);

  const handlePayment = async () => {
    if (!sessionData || !user || processing) return;
    
    try {
      const success = await processConsultationPayment(
        sessionId || '',
        sessionData.physician_id,
        sessionData.consultation_rate
      );
      
      if (success) {
        // Refresh session data to show updated payment status
        // This would trigger a re-fetch of session data
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleEndCall = () => {
    endCall();
    if (onSessionEnd) {
      onSessionEnd();
    } else {
      navigate('/patient-dashboard?tab=appointments');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          Loading consultation room...
        </CardContent>
      </Card>
    );
  }

  if (!sessionData) {
    return (
      <Card>
        <CardContent>
          Consultation session not found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Video Streams */}
      <VideoStreams
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        isCallActive={isCallActive}
        connectionState={connectionState}
      />

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
        isScreenSharing={false} // Replace with actual state if implemented
      />

      {/* Payment UI - Show if payment is not completed and user is patient */}
      {!paymentCompleted && profile?.role === 'patient' && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-md">
          <p className="text-lg font-semibold">Consultation Fee: ₦{sessionData.consultation_rate}</p>
          <Button onClick={handlePayment} disabled={processing}>
            {processing ? 'Processing Payment...' : 'Pay Now'}
          </Button>
        </div>
      )}
    </div>
  );
};
