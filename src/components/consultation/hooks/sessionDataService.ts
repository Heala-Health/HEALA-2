
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '../types';

export const fetchSessionData = async (sessionId: string): Promise<ConsultationSession | null> => {
  console.log('📡 [SessionDataService] Fetching session data for:', sessionId);
  
  try {
    // Get the consultation session first
    const { data: sessionData, error: sessionError } = await supabase
      .from('consultation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('❌ [SessionDataService] Error fetching session:', sessionError);
      throw sessionError;
    }

    if (!sessionData) {
      console.log('⚠️ [SessionDataService] No session found');
      return null;
    }

    // Get patient and physician profiles with proper error handling
    const [patientResult, physicianResult] = await Promise.allSettled([
      supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', sessionData.patient_id)
        .single(),
      supabase
        .from('profiles')
        .select('first_name, last_name, specialization')
        .eq('id', sessionData.physician_id)
        .single()
    ]);

    // Handle patient data with fallbacks
    let patientData = { 
      first_name: 'Unknown', 
      last_name: 'Patient' 
    };
    
    if (patientResult.status === 'fulfilled' && patientResult.value.data) {
      patientData = patientResult.value.data;
    }

    // Handle physician data with fallbacks
    let physicianData = { 
      first_name: 'Unknown', 
      last_name: 'Doctor', 
      specialization: 'General Practice' 
    };
    
    if (physicianResult.status === 'fulfilled' && physicianResult.value.data) {
      physicianData = physicianResult.value.data;
    }

    // Build the complete session object
    const completeSession: ConsultationSession = {
      ...sessionData,
      patient: patientData,
      physician: physicianData
    };

    console.log('✅ [SessionDataService] Session data fetched successfully');
    return completeSession;
  } catch (error) {
    console.error('💥 [SessionDataService] Fatal error:', error);
    throw error;
  }
};

export const fetchUserSessions = async (userId: string, userRole: 'patient' | 'physician'): Promise<ConsultationSession[]> => {
  console.log('📡 [SessionDataService] Fetching sessions for user:', userId, 'role:', userRole);
  
  try {
    const filterField = userRole === 'patient' ? 'patient_id' : 'physician_id';
    
    const { data: sessions, error } = await supabase
      .from('consultation_sessions')
      .select('*')
      .eq(filterField, userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [SessionDataService] Error fetching user sessions:', error);
      throw error;
    }

    // Return basic sessions for now - detailed enrichment can be done per session
    console.log('✅ [SessionDataService] User sessions fetched:', sessions?.length || 0);
    return sessions || [];
    
  } catch (error) {
    console.error('💥 [SessionDataService] Fatal error fetching user sessions:', error);
    throw error;
  }
};
