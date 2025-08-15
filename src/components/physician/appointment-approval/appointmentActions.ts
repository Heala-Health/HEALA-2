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

const createVirtualSession = async (appointment: PendingAppointment, userId: string, consultationRate: number) => {
  console.log('📹 [AppointmentActions] Creating virtual consultation session with secure function');
  
  const { data: sessionId, error: functionError } = await supabase
    .rpc('create_virtual_consultation_session', {
      appointment_uuid: appointment.id,
      patient_uuid: appointment.patient_id,
      physician_uuid: userId,
      consultation_rate_param: consultationRate || 5000
    });

  if (functionError) {
    console.error('❌ [AppointmentActions] Database function error:', functionError);
    throw new Error(`Failed to create virtual session: ${functionError.message}`);
  }

  if (!sessionId) {
    throw new Error('Session creation returned null - check database function');
  }

  console.log('✅ [AppointmentActions] Virtual session created with ID:', sessionId);
  return sessionId;
};

const createChatSession = async (appointment: PendingAppointment, userId: string, consultationRate: number) => {
  console.log('💬 [AppointmentActions] Creating chat consultation session');
  
  const sessionData = {
    appointment_id: appointment.id,
    patient_id: appointment.patient_id,
    physician_id: userId,
    consultation_rate: consultationRate || 5000,
    session_type: 'chat',
    status: 'scheduled',
    payment_status: 'pending'
  };

  const { data: sessionResult, error: sessionError } = await supabase
    .from('consultation_sessions')
    .insert(sessionData)
    .select(`
      *,
      patient:profiles!consultation_sessions_patient_id_fkey(first_name, last_name, email),
      physician:profiles!consultation_sessions_physician_id_fkey(first_name, last_name)
    `)
    .single();

  if (sessionError) {
    console.error('❌ [AppointmentActions] Error creating chat session:', sessionError);
    throw sessionError;
  }

  console.log('✅ [AppointmentActions] Chat consultation session created:', sessionResult);
  return sessionResult;
};

export const createConsultationSession = async (appointment: PendingAppointment, userId: string, consultationRate: number) => {
  try {
    console.log('🔄 [AppointmentActions] Creating consultation session for appointment:', appointment.id);
    console.log('📋 [AppointmentActions] Appointment details:', {
      type: appointment.consultation_type,
      patient: appointment.patient.first_name + ' ' + appointment.patient.last_name,
      rate: consultationRate
    });
    
    if (appointment.consultation_type === 'virtual') {
      const sessionId = await createVirtualSession(appointment, userId, consultationRate);
      
      // Verify the session was created correctly
      const { data: sessionData, error: fetchError } = await supabase
        .from('consultation_sessions')
        .select(`
          *,
          patient:profiles!consultation_sessions_patient_id_fkey(first_name, last_name, email),
          physician:profiles!consultation_sessions_physician_id_fkey(first_name, last_name)
        `)
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        console.error('❌ [AppointmentActions] Error fetching created session:', fetchError);
        throw new Error('Session created but failed to fetch details');
      }

      return sessionData;
    } else {
      return await createChatSession(appointment, userId, consultationRate);
    }
  } catch (error) {
    console.error('💥 [AppointmentActions] Fatal error creating consultation session:', error);
    throw error;
  }
};

export const updateAppointmentStatus = async (appointmentId: string, status: 'accepted' | 'rejected') => {
  // Validate inputs to prevent NoSQL injection
  if (!appointmentId || typeof appointmentId !== 'string') {
    throw new Error('Invalid appointment ID');
  }
  if (!['accepted', 'rejected'].includes(status)) {
    throw new Error('Invalid status value');
  }
  
  console.log('🔄 [AppointmentActions] Updating appointment status:', { appointmentId, status });
  
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId);

  if (error) {
    console.error('❌ [AppointmentActions] Error updating appointment status:', error);
    throw error;
  }
  
  console.log('✅ [AppointmentActions] Appointment status updated successfully');
};

export const createPhysicianPatientRelationship = async (physicianId: string, patientId: string) => {
  // Validate inputs to prevent NoSQL injection
  if (!physicianId || typeof physicianId !== 'string') {
    throw new Error('Invalid physician ID');
  }
  if (!patientId || typeof patientId !== 'string') {
    throw new Error('Invalid patient ID');
  }
  
  console.log('🔄 [AppointmentActions] Creating physician-patient relationship');
  
  const { error } = await supabase
    .from('physician_patients')
    .upsert({
      physician_id: physicianId,
      patient_id: patientId,
      status: 'active'
    }, {
      onConflict: 'physician_id,patient_id'
    });

  if (error) {
    console.error('❌ [AppointmentActions] Error creating relationship:', error);
    throw error;
  }
  
  console.log('✅ [AppointmentActions] Physician-patient relationship created');
};

export const createConversation = async (patientId: string, physicianId: string, patientName: string) => {
  // Validate inputs to prevent NoSQL injection
  if (!patientId || typeof patientId !== 'string') {
    throw new Error('Invalid patient ID');
  }
  if (!physicianId || typeof physicianId !== 'string') {
    throw new Error('Invalid physician ID');
  }
  if (!patientName || typeof patientName !== 'string') {
    throw new Error('Invalid patient name');
  }
  
  console.log('🔄 [AppointmentActions] Creating conversation');
  
  // Sanitize patient name for logging to prevent log injection
  const sanitizedPatientName = patientName.replace(/[\r\n\t]/g, '');
  
  const { error } = await supabase
    .from('conversations')
    .insert({
      patient_id: patientId,
      physician_id: physicianId,
      type: 'physician_consultation',
      title: `Virtual Consultation - ${sanitizedPatientName}`,
      status: 'active'
    });

  if (error) {
    console.error('❌ [AppointmentActions] Error creating conversation:', error);
    throw error;
  }
  
  console.log('✅ [AppointmentActions] Conversation created successfully');
};
