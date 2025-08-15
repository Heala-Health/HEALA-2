
-- Add missing pickup_address column to emergency_requests table
ALTER TABLE public.emergency_requests 
ADD COLUMN IF NOT EXISTS pickup_address text;

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text NOT NULL DEFAULT 'general',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for system_settings (admin only)
CREATE POLICY "Admins can manage system settings" ON public.system_settings
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Update RLS policies for notifications to allow admin inserts
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Update RLS policies for admin_actions to allow admin viewing
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Update RLS policies for compliance_reports to allow admin viewing
DROP POLICY IF EXISTS "Admins can view compliance reports" ON public.compliance_reports;
CREATE POLICY "Admins can view compliance reports" ON public.compliance_reports
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add proper foreign key for hospital_patients to profiles
ALTER TABLE public.hospital_patients 
ADD CONSTRAINT IF NOT EXISTS fk_hospital_patients_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.profiles(id);

-- Create transport_requests table if it doesn't exist for patient transport booking
CREATE TABLE IF NOT EXISTS public.transport_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.profiles(id),
  agent_id uuid REFERENCES public.profiles(id),
  transport_type text NOT NULL,
  pickup_address text NOT NULL,
  destination_address text NOT NULL,
  scheduled_time timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on transport_requests
ALTER TABLE public.transport_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for transport_requests
CREATE POLICY "Patients can view their transport requests" ON public.transport_requests
FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Agents can create transport requests" ON public.transport_requests
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

CREATE POLICY "Agents can view transport requests" ON public.transport_requests
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

-- Create withdrawal_requests table for patient withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  amount numeric NOT NULL,
  bank_details jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  processed_at timestamp with time zone,
  processed_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for withdrawal_requests
CREATE POLICY "Users can create their own withdrawal requests" ON public.withdrawal_requests
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own withdrawal requests" ON public.withdrawal_requests
FOR SELECT USING (user_id = auth.uid());

-- Update verification_requests table to handle better queries
ALTER TABLE public.verification_requests 
ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone DEFAULT now();
