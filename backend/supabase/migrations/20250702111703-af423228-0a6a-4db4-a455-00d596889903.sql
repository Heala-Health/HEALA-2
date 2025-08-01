-- Phase 1: Database Consistency Fix

-- Function to create consultation session with room for virtual appointments
CREATE OR REPLACE FUNCTION public.create_virtual_consultation_session(
  appointment_uuid uuid,
  patient_uuid uuid,
  physician_uuid uuid,
  consultation_rate_param numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  session_id UUID;
  room_token TEXT;
BEGIN
  -- Generate unique room token
  room_token := 'room_' || gen_random_uuid()::text;
  
  -- Create consultation session
  INSERT INTO public.consultation_sessions (
    appointment_id,
    patient_id,
    physician_id,
    consultation_rate,
    session_type,
    status,
    payment_status
  ) VALUES (
    appointment_uuid,
    patient_uuid,
    physician_uuid,
    consultation_rate_param,
    'video',
    'scheduled',
    'pending'
  ) RETURNING id INTO session_id;
  
  -- Create consultation room
  INSERT INTO public.consultation_rooms (
    session_id,
    room_token,
    room_status
  ) VALUES (
    session_id,
    room_token,
    'waiting'
  );
  
  RETURN session_id;
END;
$function$;

-- Function to start consultation session with proper state management
CREATE OR REPLACE FUNCTION public.start_consultation_session_secure(
  session_uuid uuid,
  user_uuid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;

-- Function to end consultation session
CREATE OR REPLACE FUNCTION public.end_consultation_session_secure(
  session_uuid uuid,
  user_uuid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;

-- Trigger function to create consultation room when video session is created
CREATE OR REPLACE FUNCTION public.create_consultation_room_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;

-- Create trigger for automatic room creation
DROP TRIGGER IF EXISTS consultation_room_creation_trigger ON public.consultation_sessions;
CREATE TRIGGER consultation_room_creation_trigger
  AFTER INSERT ON public.consultation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_consultation_room_trigger();

-- Enable realtime for consultation tables
ALTER TABLE public.consultation_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.consultation_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.consultation_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Update RLS policies for consultation sessions to allow updates by participants
DROP POLICY IF EXISTS "Patients and physicians can update their consultation sessions" ON public.consultation_sessions;
CREATE POLICY "Patients and physicians can update their consultation sessions"
ON public.consultation_sessions
FOR UPDATE
USING ((patient_id = auth.uid()) OR (physician_id = auth.uid()));

-- Add RLS policies for consultation rooms
DROP POLICY IF EXISTS "Session participants can view consultation rooms" ON public.consultation_rooms;
CREATE POLICY "Session participants can view consultation rooms"
ON public.consultation_rooms
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.consultation_sessions cs
  WHERE cs.id = consultation_rooms.session_id
    AND (cs.patient_id = auth.uid() OR cs.physician_id = auth.uid())
));

DROP POLICY IF EXISTS "Session participants can update consultation rooms" ON public.consultation_rooms;
CREATE POLICY "Session participants can update consultation rooms"
ON public.consultation_rooms
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.consultation_sessions cs
  WHERE cs.id = consultation_rooms.session_id
    AND (cs.patient_id = auth.uid() OR cs.physician_id = auth.uid())
));

-- Enable RLS on consultation_rooms if not already enabled
ALTER TABLE public.consultation_rooms ENABLE ROW LEVEL SECURITY;