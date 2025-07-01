
import { supabase } from '@/integrations/supabase/client';

export const sendConsultationStarted = async (sessionId: string, userId: string) => {
  try {
    console.log('📤 [NotificationManager] Sending consultation started notification for session:', sessionId);
    
    const channel = supabase.channel(`consultation_broadcast_${sessionId}_${userId}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'consultation-started',
      payload: { 
        startedBy: userId, 
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ [NotificationManager] Consultation start notification sent successfully');
  } catch (error) {
    console.error('❌ [NotificationManager] Error sending consultation started notification:', error);
    throw error;
  }
};

export const sendPatientJoined = async (sessionId: string, patientId: string) => {
  try {
    console.log('📤 [NotificationManager] Sending patient joined notification for session:', sessionId);
    
    const channel = supabase.channel(`consultation_broadcast_${sessionId}_${patientId}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'patient-joined',
      payload: { 
        patientId, 
        sessionId, 
        timestamp: new Date().toISOString() 
      }
    });

    console.log('✅ [NotificationManager] Patient joined notification sent successfully');
  } catch (error) {
    console.error('❌ [NotificationManager] Error sending patient joined notification:', error);
    throw error;
  }
};
