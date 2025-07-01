
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '../types';

export const fetchUserAppointments = async (userId: string, userRole: string): Promise<Appointment[]> => {
  console.log('Fetching appointments for user:', userId, 'with role:', userRole);
  
  let query = supabase.from('appointments').select(`
    id,
    patient_id,
    physician_id,
    appointment_date,
    appointment_time,
    consultation_type,
    status,
    notes
  `);
  
  if (userRole === 'physician') {
    query = query.eq('physician_id', userId);
  } else {
    query = query.eq('patient_id', userId);
  }
  
  const { data: appointmentsData, error: appointmentsError } = await query
    .order('appointment_date', { ascending: true });

  if (appointmentsError) {
    console.error('Error fetching appointments:', appointmentsError);
    throw appointmentsError;
  }

  console.log('Fetched appointments:', appointmentsData);

  if (!appointmentsData || appointmentsData.length === 0) {
    return [];
  }

  // Get physician and patient profiles
  const physicianIds = [...new Set(appointmentsData.map(a => a.physician_id).filter(Boolean))];
  const patientIds = [...new Set(appointmentsData.map(a => a.patient_id).filter(Boolean))];

  // Fetch physician profiles
  let physicians = [];
  if (physicianIds.length > 0) {
    const { data: physicianData, error: physicianError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, specialization')
      .in('id', physicianIds);

    if (physicianError) {
      console.error('Error fetching physicians:', physicianError);
    } else {
      physicians = physicianData || [];
    }
  }

  // Fetch patient profiles
  let patients = [];
  if (patientIds.length > 0) {
    const { data: patientData, error: patientError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', patientIds);

    if (patientError) {
      console.error('Error fetching patients:', patientError);
    } else {
      patients = patientData || [];
    }
  }

  console.log('Fetched physicians:', physicians);
  console.log('Fetched patients:', patients);

  // Combine the data
  const enrichedAppointments = appointmentsData.map(appointment => {
    const physician = physicians.find(p => p.id === appointment.physician_id);
    const patient = patients.find(p => p.id === appointment.patient_id);

    return {
      ...appointment,
      physician: physician ? {
        first_name: physician.first_name || 'Unknown',
        last_name: physician.last_name || 'Doctor',
        specialization: physician.specialization || undefined
      } : undefined,
      patient: patient ? {
        first_name: patient.first_name || 'Unknown',
        last_name: patient.last_name || 'Patient',
        email: patient.email || ''
      } : undefined
    };
  });

  console.log('Enriched appointments:', enrichedAppointments);
  return enrichedAppointments;
};

export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId);

  if (error) throw error;
};

export const canCancelAppointment = (appointmentDate: string, appointmentTime: string): boolean => {
  const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
  const now = new Date();
  const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursDifference >= 24;
};
