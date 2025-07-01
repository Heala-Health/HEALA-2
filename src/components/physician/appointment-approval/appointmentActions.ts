
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

export const createConsultationSession = async (appointment: PendingAppointment, userId: string, consultationRate: number) => {
  try {
    console.log('Creating consultation session for appointment:', appointment.id);
    
    const sessionData = {
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      physician_id: userId,
      consultation_rate: consultationRate || 5000,
      session_type: appointment.consultation_type === 'virtual' ? 'video' : 'chat',
      status: 'scheduled',
      payment_status: 'pending'
    };

    console.log('Creating session with data:', sessionData);

    const { data: sessionData_result, error: sessionError } = await supabase
      .from('consultation_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) throw sessionError;

    console.log('Consultation session created:', sessionData_result);

    if (appointment.consultation_type === 'virtual') {
      const { error: roomError } = await supabase
        .from('consultation_rooms')
        .insert({
          session_id: sessionData_result.id,
          room_token: `room_${sessionData_result.id}`,
          room_status: 'waiting'
        });

      if (roomError) {
        console.error('Error creating consultation room:', roomError);
      } else {
        console.log('Consultation room created for video session');
      }
    }

    return sessionData_result;
  } catch (error) {
    console.error('Error creating consultation session:', error);
    throw error;
  }
};

export const updateAppointmentStatus = async (appointmentId: string, status: 'accepted' | 'rejected') => {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId);

  if (error) throw error;
};

export const createPhysicianPatientRelationship = async (physicianId: string, patientId: string) => {
  const { error } = await supabase
    .from('physician_patients')
    .upsert({
      physician_id: physicianId,
      patient_id: patientId,
      status: 'active'
    }, {
      onConflict: 'physician_id,patient_id'
    });

  if (error) throw error;
};

export const createConversation = async (patientId: string, physicianId: string, patientName: string) => {
  const { error } = await supabase
    .from('conversations')
    .insert({
      patient_id: patientId,
      physician_id: physicianId,
      type: 'physician_consultation',
      title: `Virtual Consultation - ${patientName}`,
      status: 'active'
    });

  if (error) throw error;
};
