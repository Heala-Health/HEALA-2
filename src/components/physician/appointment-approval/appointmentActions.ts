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
    console.log('🔄 [AppointmentActions] Creating consultation session for appointment:', appointment.id);
    console.log('📋 [AppointmentActions] Appointment details:', {
      type: appointment.consultation_type,
      patient: appointment.patient.first_name + ' ' + appointment.patient.last_name,
      rate: consultationRate
    });
    
    // Use the secure database function for ALL virtual appointments
    if (appointment.consultation_type === 'virtual') {
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

      // Verify consultation room was created
      const { data: roomData, error: roomError } = await supabase
        .from('consultation_rooms')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (roomError || !roomData) {
        console.error('❌ [AppointmentActions] Consultation room not found, creating manually:', sessionId);
        
        // Create consultation room manually if it doesn't exist
        const roomToken = 'room_' + sessionId;
        const { data: newRoom, error: createRoomError } = await supabase
          .from('consultation_rooms')
          .insert({
            session_id: sessionId,
            room_token: roomToken,
            room_status: 'waiting'
          })
          .select()
          .single();

        if (createRoomError) {
          console.error('❌ [AppointmentActions] Failed to create consultation room manually:', createRoomError);
          throw new Error('Session created but consultation room creation failed');
        }

        console.log('✅ [AppointmentActions] Consultation room created manually:', newRoom);
      } else {
        console.log('✅ [AppointmentActions] Consultation room found:', roomData);
      }

      console.log('✅ [AppointmentActions] Virtual consultation session fully created:', {
        sessionId: sessionData.id,
        sessionType: sessionData.session_type,
        status: sessionData.status,
        roomToken: roomData?.room_token || 'manually_created',
        roomStatus: roomData?.room_status || 'waiting'
      });

      return sessionData;
      
    } else {
      // For non-virtual appointments, create chat session manually
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
    }
  } catch (error) {
    console.error('💥 [AppointmentActions] Fatal error creating consultation session:', error);
    throw error;
  }
};

export const updateAppointmentStatus = async (appointmentId: string, status: 'accepted' | 'rejected') => {
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
  console.log('🔄 [AppointmentActions] Creating conversation');
  
  const { error } = await supabase
    .from('conversations')
    .insert({
      patient_id: patientId,
      physician_id: physicianId,
      type: 'physician_consultation',
      title: `Virtual Consultation - ${patientName}`,
      status: 'active'
    });

  if (error) {
    console.error('❌ [AppointmentActions] Error creating conversation:', error);
    throw error;
  }
  
  console.log('✅ [AppointmentActions] Conversation created successfully');
};
