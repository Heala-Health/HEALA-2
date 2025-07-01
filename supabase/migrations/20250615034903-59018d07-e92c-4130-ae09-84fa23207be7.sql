
-- Create RLS policy to allow agents to view patient profiles
CREATE POLICY "Agents can view patient profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  -- Allow if the current user is an agent and the profile being viewed is a patient
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'agent') 
  AND profiles.role = 'patient'
);
