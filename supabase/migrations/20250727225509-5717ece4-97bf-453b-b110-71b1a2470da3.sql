-- Fix wallets RLS policies to allow users to create their own wallets
DROP POLICY IF EXISTS "Users can manage their own wallets" ON public.wallets;

CREATE POLICY "Users can view their own wallets" 
ON public.wallets 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own wallets" 
ON public.wallets 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wallets" 
ON public.wallets 
FOR UPDATE 
USING (user_id = auth.uid());

-- Fix consultation_sessions table foreign key relationship
ALTER TABLE public.consultation_sessions 
ADD CONSTRAINT consultation_sessions_patient_id_fkey 
FOREIGN KEY (patient_id) REFERENCES public.profiles(id);

ALTER TABLE public.consultation_sessions 
ADD CONSTRAINT consultation_sessions_physician_id_fkey 
FOREIGN KEY (physician_id) REFERENCES public.profiles(id);