
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '../types';

export const processConsultationPayment = async (session: ConsultationSession): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('process_consultation_payment', {
      session_uuid: session.id,
      patient_uuid: session.patient_id,
      physician_uuid: session.physician_id,
      amount: session.consultation_rate
    });

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};
