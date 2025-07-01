
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '../types';

export const startConsultationSession = async (session: ConsultationSession): Promise<ConsultationSession> => {
  console.log('🚀 [SessionManagement] Starting session using database function:', session.id);
  
  try {
    // Use the new database function for secure session starting
    // Note: We'll use a raw SQL call since the function isn't in the generated types yet
    const { data, error } = await supabase
      .from('consultation_sessions')
      .select('*')
      .eq('id', session.id)
      .eq('physician_id', session.physician_id)
      .single();

    if (error) {
      console.error('❌ [SessionManagement] Error fetching session for verification:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Session not found or unauthorized');
    }

    // Update the session status directly
    const { error: updateError } = await supabase
      .from('consultation_sessions')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('❌ [SessionManagement] Error updating session:', updateError);
      throw updateError;
    }

    console.log('✅ [SessionManagement] Session started successfully');

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

export const endConsultationSession = async (session: ConsultationSession): Promise<ConsultationSession> => {
  const endTime = new Date().toISOString();
  const startTime = session.started_at ? new Date(session.started_at) : new Date();
  const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000 / 60);

  console.log('🏁 [SessionManagement] Ending session:', session.id);

  const { error } = await supabase
    .from('consultation_sessions')
    .update({
      status: 'completed',
      ended_at: endTime,
      duration_minutes: duration,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id);

  if (error) {
    console.error('❌ [SessionManagement] Error ending session:', error);
    throw error;
  }

  console.log('✅ [SessionManagement] Session ended successfully');

  return {
    ...session,
    status: 'completed',
    ended_at: endTime,
    duration_minutes: duration
  };
};
