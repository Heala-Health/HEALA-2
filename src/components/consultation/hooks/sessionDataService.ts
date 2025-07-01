
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '../types';

export const fetchSessionData = async (sessionId: string): Promise<ConsultationSession | null> => {
  console.log('🔍 [SessionData] Fetching session data for:', sessionId);
  
  try {
    // Get the consultation session first
    const { data: sessionData, error: sessionError } = await supabase
      .from('consultation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('❌ [SessionData] Error fetching session:', sessionError);
      throw sessionError;
    }

    if (!sessionData) {
      console.log('⚠️ [SessionData] No session found');
      return null;
    }

    console.log('✅ [SessionData] Session data found:', sessionData);

    // Get patient and physician profiles with proper error handling
    const [patientResult, physicianResult] = await Promise.allSettled([
      supabase
        .from('profiles')
        .select('first_name, last_name')
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
      console.log('✅ [SessionData] Patient data loaded:', patientData);
    } else {
      console.error('⚠️ [SessionData] Patient data not found, using fallback');
      if (patientResult.status === 'rejected') {
        console.error('❌ [SessionData] Patient fetch error:', patientResult.reason);
      }
    }

    // Handle physician data with fallbacks
    let physicianData = { 
      first_name: 'Unknown', 
      last_name: 'Doctor', 
      specialization: 'General Practice' 
    };
    
    if (physicianResult.status === 'fulfilled' && physicianResult.value.data) {
      physicianData = physicianResult.value.data;
      console.log('✅ [SessionData] Physician data loaded:', physicianData);
    } else {
      console.error('⚠️ [SessionData] Physician data not found, using fallback');
      if (physicianResult.status === 'rejected') {
        console.error('❌ [SessionData] Physician fetch error:', physicianResult.reason);
      }
    }

    // Build the complete session object with validated data
    const completeSession: ConsultationSession = {
      ...sessionData,
      patient: patientData,
      physician: physicianData
    };

    console.log('🎯 [SessionData] Complete session assembled:', {
      id: completeSession.id,
      status: completeSession.status,
      patient: completeSession.patient,
      physician: completeSession.physician
    });

    return completeSession;
  } catch (error) {
    console.error('💥 [SessionData] Fatal error fetching session data:', error);
    throw error;
  }
};
