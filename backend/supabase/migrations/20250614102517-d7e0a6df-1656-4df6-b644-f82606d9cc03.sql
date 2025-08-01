
-- Create wallet system tables
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  currency TEXT DEFAULT 'NGN' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create transactions table for wallet operations
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'transfer')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id TEXT,
  paystack_reference TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create consultation sessions table
CREATE TABLE public.consultation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  physician_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consultation_rate DECIMAL(10,2) NOT NULL,
  session_type TEXT DEFAULT 'chat' CHECK (session_type IN ('chat', 'video', 'hybrid')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  session_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add consultation rates to physician profiles
ALTER TABLE public.profiles 
ADD COLUMN consultation_rate_min DECIMAL(10,2) DEFAULT 5000,
ADD COLUMN consultation_rate_max DECIMAL(10,2) DEFAULT 15000,
ADD COLUMN current_consultation_rate DECIMAL(10,2) DEFAULT 5000,
ADD COLUMN wallet_pin TEXT,
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN last_login_at TIMESTAMPTZ,
ADD COLUMN login_attempts INTEGER DEFAULT 0,
ADD COLUMN account_locked_until TIMESTAMPTZ;

-- Enhanced medical history tracking
CREATE TABLE public.medical_history_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  document_category TEXT NOT NULL CHECK (document_category IN ('lab_results', 'imaging', 'prescription', 'diagnosis', 'vaccination', 'surgery', 'allergy', 'other')),
  upload_date TIMESTAMPTZ DEFAULT now(),
  is_sensitive BOOLEAN DEFAULT false,
  access_level TEXT DEFAULT 'physician' CHECK (access_level IN ('physician', 'hospital', 'emergency')),
  metadata JSONB DEFAULT '{}'
);

-- Patient consent and data access tracking
CREATE TABLE public.patient_data_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  accessor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view_profile', 'view_medical_history', 'view_documents', 'consultation_access')),
  purpose TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- Agent patient assistance tracking
ALTER TABLE public.agent_assisted_patients 
ADD COLUMN appointment_booking_count INTEGER DEFAULT 0,
ADD COLUMN last_interaction_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN notes TEXT;

-- Hospital security enhancements
ALTER TABLE public.hospitals 
ADD COLUMN security_settings JSONB DEFAULT '{"ip_whitelist": [], "two_factor_required": true, "session_timeout": 3600}',
ADD COLUMN verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
ADD COLUMN verification_documents JSONB DEFAULT '[]';

-- Enhanced verification system
ALTER TABLE public.verification_requests 
ADD COLUMN document_urls JSONB DEFAULT '[]',
ADD COLUMN verification_type TEXT DEFAULT 'profile' CHECK (verification_type IN ('profile', 'hospital', 'physician', 'agent', 'document')),
ADD COLUMN priority INTEGER DEFAULT 1,
ADD COLUMN auto_approved BOOLEAN DEFAULT false;

-- Video consultation rooms
CREATE TABLE public.consultation_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.consultation_sessions(id) ON DELETE CASCADE NOT NULL,
  room_token TEXT NOT NULL,
  patient_joined_at TIMESTAMPTZ,
  physician_joined_at TIMESTAMPTZ,
  room_status TEXT DEFAULT 'waiting' CHECK (room_status IN ('waiting', 'active', 'ended')),
  recording_enabled BOOLEAN DEFAULT false,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- System audit logs
CREATE TABLE public.system_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_history_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_data_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for wallets
CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (
    wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
  );

-- Create policies for consultation sessions
CREATE POLICY "Patients and physicians can view their consultation sessions" ON public.consultation_sessions
  FOR SELECT USING (patient_id = auth.uid() OR physician_id = auth.uid());

-- Create policies for medical history documents
CREATE POLICY "Patients can manage their medical documents" ON public.medical_history_documents
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "Physicians can view medical documents during consultations" ON public.medical_history_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments a 
      WHERE a.patient_id = medical_history_documents.patient_id 
      AND a.physician_id = auth.uid() 
      AND a.status = 'accepted'
    )
  );

-- Create security functions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_hospital_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'hospital_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update existing functions for enhanced security
CREATE OR REPLACE FUNCTION public.get_physicians_by_hospital(hospital_uuid uuid)
RETURNS TABLE(
  physician_id uuid, 
  first_name text, 
  last_name text, 
  specialization text,
  consultation_rate decimal,
  is_available boolean
)
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.specialization,
    p.current_consultation_rate,
    p.is_active
  FROM public.profiles p
  WHERE p.role = 'physician'
    AND p.hospital_id = hospital_uuid
    AND p.is_active = true
  ORDER BY p.first_name, p.last_name;
$$;

-- Create wallet management functions
CREATE OR REPLACE FUNCTION public.create_user_wallet(user_uuid uuid)
RETURNS UUID AS $$
DECLARE
  wallet_id UUID;
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (user_uuid)
  RETURNING id INTO wallet_id;
  
  RETURN wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_consultation_payment(
  session_uuid uuid,
  patient_uuid uuid,
  physician_uuid uuid,
  amount decimal
)
RETURNS BOOLEAN AS $$
DECLARE
  patient_wallet_id UUID;
  physician_wallet_id UUID;
  patient_balance DECIMAL;
BEGIN
  -- Get wallet IDs
  SELECT id, balance INTO patient_wallet_id, patient_balance 
  FROM public.wallets WHERE user_id = patient_uuid;
  
  SELECT id INTO physician_wallet_id 
  FROM public.wallets WHERE user_id = physician_uuid;
  
  -- Check if patient has sufficient balance
  IF patient_balance < amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct from patient wallet
  UPDATE public.wallets 
  SET balance = balance - amount, updated_at = now()
  WHERE id = patient_wallet_id;
  
  -- Add to physician wallet
  UPDATE public.wallets 
  SET balance = balance + amount, updated_at = now()
  WHERE id = physician_wallet_id;
  
  -- Record transactions
  INSERT INTO public.wallet_transactions (wallet_id, transaction_type, amount, balance_after, description, reference_id)
  VALUES 
    (patient_wallet_id, 'debit', amount, patient_balance - amount, 'Virtual consultation payment', session_uuid::text),
    (physician_wallet_id, 'credit', amount, (SELECT balance FROM public.wallets WHERE id = physician_wallet_id), 'Virtual consultation payment received', session_uuid::text);
  
  -- Update consultation session payment status
  UPDATE public.consultation_sessions 
  SET payment_status = 'paid', updated_at = now()
  WHERE id = session_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet on user registration
CREATE OR REPLACE FUNCTION public.create_wallet_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create wallet for all users
  PERFORM public.create_user_wallet(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing user creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already exists in users table
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
  END IF;
  
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (
      id, 
      email, 
      first_name, 
      last_name, 
      phone,
      role,
      specialization,
      license_number
    )
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      NEW.raw_user_meta_data ->> 'phone',
      COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'patient'::user_role),
      NEW.raw_user_meta_data ->> 'specialization',
      NEW.raw_user_meta_data ->> 'license_number'
    );
  END IF;
  
  -- Create wallet for the user
  PERFORM public.create_user_wallet(NEW.id);
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE LOG 'User % already exists, skipping insert', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
