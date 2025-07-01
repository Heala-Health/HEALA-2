
import { supabase } from '@/integrations/supabase/client';

export const requestRepeat = async (prescriptionId: string, currentRepeatCount: number, maxRepeats: number) => {
  if (currentRepeatCount >= maxRepeats) {
    throw new Error('Repeat limit reached');
  }

  const { error } = await supabase
    .from('prescriptions')
    .update({
      repeat_count: currentRepeatCount + 1,
      status: 'pending'
    })
    .eq('id', prescriptionId);

  if (error) throw error;
};
