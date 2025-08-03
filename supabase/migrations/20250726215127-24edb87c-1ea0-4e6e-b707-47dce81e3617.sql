
-- Fix Wallets Table RLS Policies
DROP POLICY IF EXISTS "Users can view their own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can create their own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update their own wallets" ON public.wallets;

CREATE POLICY "Users can view their own wallets" ON public.wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own wallets" ON public.wallets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wallets" ON public.wallets
  FOR UPDATE USING (user_id = auth.uid());

-- Fix Emergency Requests Table Schema - Add missing columns
ALTER TABLE public.emergency_requests 
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS ambulance_eta INTEGER;

-- Update emergency_requests RLS policies
DROP POLICY IF EXISTS "Patients can create emergency requests" ON public.emergency_requests;
DROP POLICY IF EXISTS "Patients can view their emergency requests" ON public.emergency_requests;
DROP POLICY IF EXISTS "Patients can update their emergency requests" ON public.emergency_requests;

CREATE POLICY "Patients can create emergency requests" ON public.emergency_requests
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can view their emergency requests" ON public.emergency_requests
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Patients can update their emergency requests" ON public.emergency_requests
  FOR UPDATE USING (patient_id = auth.uid());

-- Fix Transport Requests RLS Policies
DROP POLICY IF EXISTS "Users can view their transport requests" ON public.transport_requests;
DROP POLICY IF EXISTS "Users can create transport requests" ON public.transport_requests;
DROP POLICY IF EXISTS "Users can update their transport requests" ON public.transport_requests;
DROP POLICY IF EXISTS "Agents can view assigned transport requests" ON public.transport_requests;
DROP POLICY IF EXISTS "Agents can update assigned transport requests" ON public.transport_requests;

CREATE POLICY "Patients can view their transport requests" ON public.transport_requests
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Patients can create transport requests" ON public.transport_requests
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update their transport requests" ON public.transport_requests
  FOR UPDATE USING (patient_id = auth.uid());

CREATE POLICY "Agents can view assigned transport requests" ON public.transport_requests
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can update assigned transport requests" ON public.transport_requests
  FOR UPDATE USING (agent_id = auth.uid());

-- Fix Consultation Sessions Foreign Key Relationship
-- Add foreign key constraints if they don't exist
ALTER TABLE public.consultation_sessions 
ADD CONSTRAINT IF NOT EXISTS fk_consultation_sessions_patient 
FOREIGN KEY (patient_id) REFERENCES public.profiles(id);

ALTER TABLE public.consultation_sessions 
ADD CONSTRAINT IF NOT EXISTS fk_consultation_sessions_physician 
FOREIGN KEY (physician_id) REFERENCES public.profiles(id);

-- Ensure wallet_transactions has proper RLS policies
DROP POLICY IF EXISTS "Users can view their wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can create their wallet transactions" ON public.wallet_transactions;

CREATE POLICY "Users can view their wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.wallets 
      WHERE wallets.id = wallet_transactions.wallet_id 
      AND wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create wallet transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (true);
