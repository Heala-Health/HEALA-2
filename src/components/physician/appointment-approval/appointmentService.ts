
import { supabase } from '@/integrations/supabase/client';

interface PendingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: string;
  notes?: string;
  patient_id: string;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export const fetchPendingAppointments = async (userId: string): Promise<PendingAppointment[]> => {
  try {
    console.log('Fetching appointments for physician:', userId);
    
    // First get appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, patient_id, appointment_date, appointment_time, consultation_type, notes, status')
      .eq('physician_id', userId)
      .eq('status', 'pending')
      .order('appointment_date', { ascending: true });

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      throw appointmentsError;
    }

    console.log('Fetched appointments:', appointments);

    if (!appointments || appointments.length === 0) {
      return [];
    }

    // Get unique patient IDs
    const patientIds = [...new Set(appointments.map(apt => apt.patient_id))];

    // Fetch patient profiles separately
    const { data: patients, error: patientsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone')
      .in('id', patientIds);

    if (patientsError) {
      console.error('Error fetching patient profiles:', patientsError);
      throw patientsError;
    }

    console.log('Fetched patient profiles:', patients);

    // Combine appointments with patient data
    const appointmentsWithPatients = appointments.map(appointment => {
      const patient = patients?.find(p => p.id === appointment.patient_id);
      
      return {
        id: appointment.id,
        patient_id: appointment.patient_id,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        consultation_type: appointment.consultation_type,
        notes: appointment.notes,
        patient: {
          first_name: patient?.first_name || 'Unknown',
          last_name: patient?.last_name || 'Patient',
          email: patient?.email || '',
          phone: patient?.phone || ''
        }
      };
    });

    console.log('Processed appointments:', appointmentsWithPatients);
    return appointmentsWithPatients;
  } catch (error) {
    console.error('Error fetching pending appointments:', error);
    throw error;
  }
};
