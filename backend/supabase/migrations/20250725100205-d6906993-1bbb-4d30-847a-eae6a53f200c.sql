
-- Phase 1: Critical Security Fixes - RLS Policies and Database Schema

-- Add missing RLS policies for emergency_requests table
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can create emergency requests" 
  ON public.emergency_requests 
  FOR INSERT 
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can view their emergency requests" 
  ON public.emergency_requests 
  FOR SELECT 
  USING (patient_id = auth.uid());

CREATE POLICY "Hospital staff can view emergency requests" 
  ON public.emergency_requests 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND hospital_id = emergency_requests.hospital_id
    AND role IN ('physician', 'hospital_admin')
  ));

CREATE POLICY "Hospital staff can update emergency requests" 
  ON public.emergency_requests 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND hospital_id = emergency_requests.hospital_id
    AND role IN ('physician', 'hospital_admin')
  ));

-- Add missing RLS policies for patient_data_access table
ALTER TABLE public.patient_data_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their data access records" 
  ON public.patient_data_access 
  FOR SELECT 
  USING (patient_id = auth.uid());

CREATE POLICY "Authorized users can view data access records" 
  ON public.patient_data_access 
  FOR SELECT 
  USING (accessor_id = auth.uid());

CREATE POLICY "Healthcare providers can create data access records" 
  ON public.patient_data_access 
  FOR INSERT 
  WITH CHECK (accessor_id = auth.uid() AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('physician', 'hospital_admin')
  ));

-- Add missing RLS policies for patient_waitlist table
ALTER TABLE public.patient_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their waitlist status" 
  ON public.patient_waitlist 
  FOR SELECT 
  USING (patient_id = auth.uid());

CREATE POLICY "Hospital staff can manage waitlist" 
  ON public.patient_waitlist 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND hospital_id = patient_waitlist.hospital_id
    AND role IN ('physician', 'hospital_admin')
  ));

-- Fix missing consultation room trigger
CREATE OR REPLACE FUNCTION public.create_consultation_room_trigger()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only create room for video sessions that don't have one
  IF NEW.session_type = 'video' AND NOT EXISTS (
    SELECT 1 FROM public.consultation_rooms WHERE session_id = NEW.id
  ) THEN
    INSERT INTO public.consultation_rooms (
      session_id,
      room_token,
      room_status
    ) VALUES (
      NEW.id,
      'room_' || NEW.id::text,
      'waiting'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS create_consultation_room_on_session ON public.consultation_sessions;
CREATE TRIGGER create_consultation_room_on_session
  AFTER INSERT ON public.consultation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_consultation_room_trigger();

-- Update all database functions to use secure search_path
CREATE OR REPLACE FUNCTION public.start_consultation_session_secure(session_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  session_record RECORD;
BEGIN
  -- Get session with authorization check
  SELECT * INTO session_record
  FROM public.consultation_sessions
  WHERE id = session_uuid
    AND (patient_id = user_uuid OR physician_id = user_uuid)
    AND status IN ('scheduled', 'in_progress');
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update session status
  UPDATE public.consultation_sessions
  SET 
    status = 'in_progress',
    started_at = now(),
    updated_at = now()
  WHERE id = session_uuid;
  
  -- Update room status
  UPDATE public.consultation_rooms
  SET room_status = 'active'
  WHERE session_id = session_uuid;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.end_consultation_session_secure(session_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  session_record RECORD;
  start_time TIMESTAMP WITH TIME ZONE;
  duration_mins INTEGER;
BEGIN
  -- Get session with authorization check
  SELECT * INTO session_record
  FROM public.consultation_sessions
  WHERE id = session_uuid
    AND (patient_id = user_uuid OR physician_id = user_uuid)
    AND status = 'in_progress';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate duration
  start_time := COALESCE(session_record.started_at, session_record.created_at);
  duration_mins := EXTRACT(EPOCH FROM (now() - start_time)) / 60;
  
  -- Update session
  UPDATE public.consultation_sessions
  SET 
    status = 'completed',
    ended_at = now(),
    duration_minutes = duration_mins,
    updated_at = now()
  WHERE id = session_uuid;
  
  -- Update room status
  UPDATE public.consultation_rooms
  SET room_status = 'completed'
  WHERE session_id = session_uuid;
  
  RETURN TRUE;
END;
$$;

-- Add proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_patient_id ON public.consultation_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_physician_id ON public.consultation_sessions(physician_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_status ON public.consultation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_physician_id ON public.appointments(physician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_patient_id ON public.emergency_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_hospital_id ON public.emergency_requests(hospital_id);

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulance_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

-- Set replica identity for realtime updates
ALTER TABLE public.consultation_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.consultation_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.emergency_requests REPLICA IDENTITY FULL;
ALTER TABLE public.ambulance_requests REPLICA IDENTITY FULL;
ALTER TABLE public.wallet_transactions REPLICA IDENTITY FULL;
