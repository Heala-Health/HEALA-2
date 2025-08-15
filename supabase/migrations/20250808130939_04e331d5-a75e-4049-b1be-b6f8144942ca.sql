-- 1) Recreate core tables for Virtual Consultations
-- NOTE: Designed to match the existing frontend/types and RPCs in this project

-- Enable required extension (already enabled on Supabase, but safe if missing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- A. consultation_sessions
CREATE TABLE IF NOT EXISTS public.consultation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NULL REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  physician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'video', -- 'video' | 'audio' | 'chat'
  status TEXT NOT NULL DEFAULT 'scheduled',   -- 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  consultation_rate NUMERIC NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- B. consultation_rooms
CREATE TABLE IF NOT EXISTS public.consultation_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES public.consultation_sessions(id) ON DELETE CASCADE,
  room_token TEXT NOT NULL UNIQUE,
  room_status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting' | 'active' | 'completed'
  patient_joined BOOLEAN NOT NULL DEFAULT false,
  physician_joined BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- C. Helpful indexes
CREATE INDEX IF NOT EXISTS idx_consult_sess_patient ON public.consultation_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_consult_sess_physician ON public.consultation_sessions(physician_id);
CREATE INDEX IF NOT EXISTS idx_consult_sess_status ON public.consultation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_consult_sess_created_at ON public.consultation_sessions(created_at);

-- 2) RLS: enforce participant-only access
ALTER TABLE public.consultation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_rooms ENABLE ROW LEVEL SECURITY;

-- Sessions policies
DROP POLICY IF EXISTS "Participants can view their sessions" ON public.consultation_sessions;
CREATE POLICY "Participants can view their sessions"
  ON public.consultation_sessions
  FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = physician_id);

DROP POLICY IF EXISTS "Participants can insert their sessions" ON public.consultation_sessions;
CREATE POLICY "Participants can insert their sessions"
  ON public.consultation_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id OR auth.uid() = physician_id);

DROP POLICY IF EXISTS "Participants can update their sessions" ON public.consultation_sessions;
CREATE POLICY "Participants can update their sessions"
  ON public.consultation_sessions
  FOR UPDATE
  USING (auth.uid() = patient_id OR auth.uid() = physician_id);

-- Rooms policies
DROP POLICY IF EXISTS "Participants can view their rooms" ON public.consultation_rooms;
CREATE POLICY "Participants can view their rooms"
  ON public.consultation_rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.consultation_sessions s
      WHERE s.id = consultation_rooms.session_id
        AND (auth.uid() = s.patient_id OR auth.uid() = s.physician_id)
    )
  );

DROP POLICY IF EXISTS "Participants can update their rooms" ON public.consultation_rooms;
CREATE POLICY "Participants can update their rooms"
  ON public.consultation_rooms
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.consultation_sessions s
      WHERE s.id = consultation_rooms.session_id
        AND (auth.uid() = s.patient_id OR auth.uid() = s.physician_id)
    )
  );

-- Intentionally no INSERT policy on consultation_rooms: they are created by trigger

-- 3) Auto-manage updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_consultation_sessions ON public.consultation_sessions;
CREATE TRIGGER set_timestamp_consultation_sessions
BEFORE UPDATE ON public.consultation_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp_consultation_rooms ON public.consultation_rooms;
CREATE TRIGGER set_timestamp_consultation_rooms
BEFORE UPDATE ON public.consultation_rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Auto-create room for new video sessions
-- The helper function already exists in this project, but recreate safely
CREATE OR REPLACE FUNCTION public.create_consultation_room_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

DROP TRIGGER IF EXISTS create_room_on_session_insert ON public.consultation_sessions;
CREATE TRIGGER create_room_on_session_insert
AFTER INSERT ON public.consultation_sessions
FOR EACH ROW EXECUTE FUNCTION public.create_consultation_room_trigger();

-- 5) Keep existing secure RPCs functional (no-op if already present)
-- start_consultation_session_secure / end_consultation_session_secure and payment RPCs
-- are already defined in this project (see Useful Context). No change required here.

-- Optional: ensure tables are part of realtime publication (often already managed by Supabase)
-- ALTER TABLE public.consultation_sessions REPLICA IDENTITY FULL;
-- ALTER TABLE public.consultation_rooms REPLICA IDENTITY FULL;
