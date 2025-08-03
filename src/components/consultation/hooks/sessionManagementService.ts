
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '../types';

export const startConsultationSession = async (session: ConsultationSession, userId: string): Promise<ConsultationSession> => {
  console.log('🚀 [SessionManagement] Starting session using secure function:', session.id);
  
  try {
    // Use the secure database function for session starting
    const { data: success, error: functionError } = await supabase
      .rpc('start_consultation_session_secure', {
        session_uuid: session.id,
        user_uuid: userId
      });

    if (functionError) {
      console.error('❌ [SessionManagement] Database function error:', functionError);
      throw functionError;
    }

    if (!success) {
      throw new Error('Failed to start session - unauthorized or invalid state');
    }

    console.log('✅ [SessionManagement] Session started successfully via secure function');

    // Return updated session object
    const updatedSession = {
      ...session,
      status: 'in_progress' as const,
      started_at: new Date().toISOString()
    };

    return updatedSession;
  } catch (error) {
    console.error('💥 [SessionManagement] Fatal error starting session:', error);
    throw error;
  }
};

export const endConsultationSession = async (session: ConsultationSession, userId: string): Promise<ConsultationSession> => {
  console.log('🏁 [SessionManagement] Ending session using secure function:', session.id);

  try {
    // Use the secure database function for session ending
    const { data: success, error: functionError } = await supabase
      .rpc('end_consultation_session_secure', {
        session_uuid: session.id,
        user_uuid: userId
      });

    if (functionError) {
      console.error('❌ [SessionManagement] Database function error:', functionError);
      throw functionError;
    }

    if (!success) {
      throw new Error('Failed to end session - unauthorized or invalid state');
    }

    console.log('✅ [SessionManagement] Session ended successfully via secure function');

    // Calculate duration for return object
    const endTime = new Date().toISOString();
    const startTime = session.started_at ? new Date(session.started_at) : new Date();
    const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000 / 60);

    return {
      ...session,
      status: 'completed',
      ended_at: endTime,
      duration_minutes: duration
    };
  } catch (error) {
    console.error('💥 [SessionManagement] Fatal error ending session:', error);
    throw error;
  }
};
