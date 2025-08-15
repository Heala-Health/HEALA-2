
-- Fix emergency_requests table - add missing contact_phone column
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Fix emergency_requests RLS policies to allow proper access
DROP POLICY IF EXISTS "Patients can create emergency requests" ON emergency_requests;
DROP POLICY IF EXISTS "Patients can view their emergency requests" ON emergency_requests;
DROP POLICY IF EXISTS "Hospital admins can view emergency requests" ON emergency_requests;
DROP POLICY IF EXISTS "Agents can view emergency requests" ON emergency_requests;
DROP POLICY IF EXISTS "Admins can view all emergency requests" ON emergency_requests;

CREATE POLICY "Patients can create emergency requests" 
  ON emergency_requests FOR INSERT 
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can view their emergency requests" 
  ON emergency_requests FOR SELECT 
  USING (patient_id = auth.uid());

CREATE POLICY "Hospital admins can view emergency requests" 
  ON emergency_requests FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'hospital_admin'
  ));

CREATE POLICY "Agents can view emergency requests" 
  ON emergency_requests FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'agent'
  ));

CREATE POLICY "Admins can view all emergency requests" 
  ON emergency_requests FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update emergency requests" 
  ON emergency_requests FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Fix verification_requests RLS policies
DROP POLICY IF EXISTS "Admins can create verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Admins can update verification requests" ON verification_requests;

CREATE POLICY "Admins can create verification requests" 
  ON verification_requests FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update verification requests" 
  ON verification_requests FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Fix compliance_reports RLS policies
DROP POLICY IF EXISTS "Admins can create compliance reports" ON compliance_reports;

CREATE POLICY "Admins can create compliance reports" 
  ON compliance_reports FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Fix hospital_patients RLS policies for hospital admins
DROP POLICY IF EXISTS "Hospital admins can view their patients" ON hospital_patients;
DROP POLICY IF EXISTS "Hospital admins can create patients" ON hospital_patients;
DROP POLICY IF EXISTS "Hospital admins can update patients" ON hospital_patients;

CREATE POLICY "Hospital admins can view their patients" 
  ON hospital_patients FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'hospital_admin' 
    AND hospital_id = hospital_patients.hospital_id
  ));

CREATE POLICY "Hospital admins can create patients" 
  ON hospital_patients FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'hospital_admin' 
    AND hospital_id = hospital_patients.hospital_id
  ));

CREATE POLICY "Hospital admins can update patients" 
  ON hospital_patients FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'hospital_admin' 
    AND hospital_id = hospital_patients.hospital_id
  ));

-- Fix transport_requests table and policies for agents
CREATE TABLE IF NOT EXISTS transport_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  transport_type TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can create transport requests" ON transport_requests;
DROP POLICY IF EXISTS "Agents can view transport requests" ON transport_requests;
DROP POLICY IF EXISTS "Patients can view their transport requests" ON transport_requests;

CREATE POLICY "Agents can create transport requests" 
  ON transport_requests FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'agent'
  ));

CREATE POLICY "Agents can view transport requests" 
  ON transport_requests FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'agent'
  ));

CREATE POLICY "Patients can view their transport requests" 
  ON transport_requests FOR SELECT 
  USING (patient_id = auth.uid());

-- Fix appointments policies for agents
DROP POLICY IF EXISTS "Agents can create appointments" ON appointments;
DROP POLICY IF EXISTS "Agents can view appointments" ON appointments;

CREATE POLICY "Agents can create appointments" 
  ON appointments FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'agent'
  ));

CREATE POLICY "Agents can view appointments" 
  ON appointments FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'agent'
  ));

-- Create system_settings table if not exists for admin settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system settings" 
  ON system_settings FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Insert initial AI API key setting
INSERT INTO system_settings (setting_key, setting_value, category, description) 
VALUES ('ai_api_key', '{"key": "", "provider": "openai"}', 'ai', 'AI API key configuration')
ON CONFLICT (setting_key) DO NOTHING;
