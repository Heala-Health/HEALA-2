import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConsultationHandlersProps {
  sessionId: string;
  userId: string;
  isPatient: boolean;
  isPhysician: boolean;
  onConsultationStarted: () => void;
  onPatientJoined: () => void;
}

// DEPRECATED: This component is being replaced by useNotificationManager hook
// Keeping for backwards compatibility but functionality moved to useNotificationManager
export const useConsultationHandlers = ({
  sessionId,
  userId,
  isPatient,
  isPhysician,
  onConsultationStarted,
  onPatientJoined
}: ConsultationHandlersProps) => {
  const { toast } = useToast();

  useEffect(() => {
    console.log('⚠️ [ConsultationHandlers] DEPRECATED: Use useNotificationManager instead');
    // This is now handled by useNotificationManager
    return () => {
      console.log('🧹 [ConsultationHandlers] Cleanup (deprecated)');
    };
  }, [sessionId, userId, isPatient, isPhysician, toast, onConsultationStarted, onPatientJoined]);
};

export const sendConsultationStarted = async (sessionId: string, userId: string) => {
  try {
    console.log('📤 [ConsultationHandlers] DEPRECATED: Sending consultation started notification');
    
    const channel = supabase.channel(`consultation_broadcast_${sessionId}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'consultation-started',
      payload: { 
        startedBy: userId, 
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ [ConsultationHandlers] Consultation start notification sent successfully');
  } catch (error) {
    console.error('❌ [ConsultationHandlers] Error sending consultation started notification:', error);
    throw error;
  }
};

export const sendPatientJoined = async (sessionId: string, patientId: string) => {
  try {
    console.log('📤 [ConsultationHandlers] DEPRECATED: Sending patient joined notification');
    
    const channel = supabase.channel(`consultation_broadcast_${sessionId}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'patient-joined',
      payload: { 
        patientId, 
        sessionId, 
        timestamp: new Date().toISOString() 
      }
    });

    console.log('✅ [ConsultationHandlers] Patient joined notification sent successfully');
  } catch (error) {
    console.error('❌ [ConsultationHandlers] Error sending patient joined notification:', error);
    throw error;
  }
};
