
import { supabase } from '@/integrations/supabase/client';

export const startConversation = async (
  patientId: string, 
  patientName: string, 
  physicianId: string
) => {
  try {
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .eq('patient_id', patientId)
      .eq('physician_id', physicianId)
      .eq('type', 'physician_consultation')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let conversationId;

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          patient_id: patientId,
          physician_id: physicianId,
          type: 'physician_consultation',
          title: `Consultation with ${patientName}`,
          status: 'active'
        })
        .select('id')
        .single();

      if (error) throw error;
      conversationId = newConversation.id;
    }

    return conversationId;
  } catch (error) {
    console.error('Error starting conversation:', error);
    throw error;
  }
};
