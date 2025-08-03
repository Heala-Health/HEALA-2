
-- Add RLS policy to allow session participants to create consultation rooms
DROP POLICY IF EXISTS "Session participants can insert consultation rooms" ON public.consultation_rooms;
CREATE POLICY "Session participants can insert consultation rooms"
ON public.consultation_rooms
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.consultation_sessions cs
  WHERE cs.id = consultation_rooms.session_id
    AND (cs.patient_id = auth.uid() OR cs.physician_id = auth.uid())
));
