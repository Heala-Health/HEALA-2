
-- Add RLS policy to allow physicians to view patient profiles they have relationships with
CREATE POLICY "Physicians can view their assigned patients" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  role = 'patient' AND 
  EXISTS (
    SELECT 1 FROM public.physician_patients pp 
    WHERE pp.patient_id = profiles.id 
    AND pp.physician_id = auth.uid() 
    AND pp.status = 'active'
  )
);
