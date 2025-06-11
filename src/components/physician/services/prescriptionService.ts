
import { supabase } from '@/integrations/supabase/client';
import { Medication } from '../types/prescription';

export const createPrescription = async (
  patientId: string,
  physicianId: string,
  appointmentId: string | undefined,
  medications: Medication[],
  repeatAllowed: boolean,
  maxRepeats: number,
  pharmacyId: string
) => {
  const prescriptionData = {
    medications: medications as any[],
    total_medications: medications.length,
    prescribed_date: new Date().toISOString()
  };

  const { error } = await supabase
    .from('prescriptions')
    .insert({
      patient_id: patientId,
      physician_id: physicianId,
      appointment_id: appointmentId,
      prescription_data: prescriptionData,
      repeat_allowed: repeatAllowed,
      max_repeats: repeatAllowed ? maxRepeats : 0,
      pharmacy_id: pharmacyId || null,
      status: 'pending'
    });

  if (error) throw error;
};
