
import { supabase } from '@/integrations/supabase/client';
import { Medication } from '../types/prescription';

const createPrescriptionData = (medications: Medication[]) => ({
  medications: medications as any[],
  total_medications: medications.length,
  prescribed_date: new Date().toISOString()
});

const getPhysicianName = async (physicianId: string): Promise<string> => {
  const { data: physicianProfile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', physicianId)
    .single();

  return physicianProfile 
    ? `Dr. ${physicianProfile.first_name} ${physicianProfile.last_name}`
    : 'Your physician';
};

const createPatientNotification = async (patientId: string, physicianName: string, medicationCount: number) => {
  await supabase
    .from('notifications')
    .insert({
      user_id: patientId,
      title: 'New Prescription Received',
      message: `${physicianName} has sent you a new prescription with ${medicationCount} medication(s).`,
      type: 'prescription'
    });
};

export const createPrescription = async (
  patientId: string,
  physicianId: string,
  appointmentId: string | undefined,
  medications: Medication[],
  repeatAllowed: boolean,
  maxRepeats: number,
  pharmacyId: string
) => {
  const prescriptionData = createPrescriptionData(medications);

  const { data: prescription, error } = await supabase
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
    })
    .select()
    .single();

  if (error) throw error;

  const physicianName = await getPhysicianName(physicianId);
  await createPatientNotification(patientId, physicianName, medications.length);

  return prescription;
};
