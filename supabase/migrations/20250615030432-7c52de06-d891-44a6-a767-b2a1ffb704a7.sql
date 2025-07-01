
-- Add RLS policy to allow patients to request physician assignments
CREATE POLICY "Patients can request physician assignments" 
ON public.physician_patients 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = patient_id AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'patient'
  )
);

-- Also add policy to allow patients to view their own assignments
CREATE POLICY "Patients can view their physician assignments" 
ON public.physician_patients 
FOR SELECT 
TO authenticated 
USING (
  patient_id = auth.uid()
);

-- Allow physicians to view their patient assignments
CREATE POLICY "Physicians can view their patient assignments" 
ON public.physician_patients 
FOR SELECT 
TO authenticated 
USING (
  physician_id = auth.uid()
);
