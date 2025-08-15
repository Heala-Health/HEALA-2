-- Physician system database tables (fixed version)
-- This file ensures all necessary tables exist with proper relationships

-- Ensure physician_patients table exists with proper structure
CREATE TABLE IF NOT EXISTS physician_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    physician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(physician_id, patient_id)
);

-- Ensure consultation_sessions table has proper structure
DO $$ 
BEGIN
    -- Check if consultation_sessions table exists and has required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_sessions' 
                   AND column_name = 'session_type') THEN
        ALTER TABLE consultation_sessions ADD COLUMN session_type TEXT DEFAULT 'video';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_sessions' 
                   AND column_name = 'started_at') THEN
        ALTER TABLE consultation_sessions ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_sessions' 
                   AND column_name = 'ended_at') THEN
        ALTER TABLE consultation_sessions ADD COLUMN ended_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Ensure consultation_rooms table has proper structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_rooms' 
                   AND column_name = 'patient_joined') THEN
        ALTER TABLE consultation_rooms ADD COLUMN patient_joined BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_rooms' 
                   AND column_name = 'physician_joined') THEN
        ALTER TABLE consultation_rooms ADD COLUMN physician_joined BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_physician_patients_physician_id ON physician_patients(physician_id);
CREATE INDEX IF NOT EXISTS idx_physician_patients_patient_id ON physician_patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_physician_patients_status ON physician_patients(status);

CREATE INDEX IF NOT EXISTS idx_appointments_physician_id ON appointments(physician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

CREATE INDEX IF NOT EXISTS idx_consultation_sessions_physician_id ON consultation_sessions(physician_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_patient_id ON consultation_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_status ON consultation_sessions(status);

CREATE INDEX IF NOT EXISTS idx_prescriptions_physician_id ON prescriptions(physician_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

-- Enable Row Level Security
ALTER TABLE physician_patients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Physicians can view their patients" ON physician_patients;
DROP POLICY IF EXISTS "Physicians can manage their patient relationships" ON physician_patients;

-- Create RLS policies for physician_patients
CREATE POLICY "Physicians can view their patients" ON physician_patients
    FOR SELECT USING (
        physician_id = auth.uid() OR 
        patient_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

CREATE POLICY "Physicians can manage their patient relationships" ON physician_patients
    FOR ALL USING (
        physician_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS update_physician_patients_updated_at ON physician_patients;

CREATE TRIGGER update_physician_patients_updated_at
    BEFORE UPDATE ON physician_patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON physician_patients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON consultation_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON consultation_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE ON prescriptions TO authenticated;