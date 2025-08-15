-- Add Row Level Security policies for patient_data_access table
-- This table tracks who accessed patient data and when, requiring strict access controls

-- Enable RLS on the table (it should already be enabled, but ensuring it is)
ALTER TABLE patient_data_access ENABLE ROW LEVEL SECURITY;

-- Policy 1: Patients can view records of who accessed their data
CREATE POLICY "Patients can view their data access records" 
ON patient_data_access 
FOR SELECT 
USING (patient_id = auth.uid());

-- Policy 2: Healthcare providers can view access records for patients they're treating
CREATE POLICY "Healthcare providers can view access records for their patients" 
ON patient_data_access 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = patient_data_access.patient_id 
    AND a.physician_id = auth.uid()
    AND a.status = 'accepted'
  )
);

-- Policy 3: Hospital admins can view access records for patients in their hospital
CREATE POLICY "Hospital admins can view access records for hospital patients" 
ON patient_data_access 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN hospital_patients hp ON hp.patient_id = patient_data_access.patient_id
    WHERE p.id = auth.uid() 
    AND p.role = 'hospital_admin'
    AND p.hospital_id = hp.hospital_id
  )
);

-- Policy 4: System admins can view all access records for audit purposes
CREATE POLICY "Admins can view all data access records" 
ON patient_data_access 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy 5: System can create access records when data is accessed
CREATE POLICY "System can log data access events" 
ON patient_data_access 
FOR INSERT 
WITH CHECK (
  -- Only allow inserts where the accessor is the current user or system
  accessor_id = auth.uid() OR 
  -- Allow service role to insert for system-generated logs
  auth.jwt() ->> 'role' = 'service_role'
);

-- Policy 6: Only admins can update access records (for corrections/updates)
CREATE POLICY "Admins can update data access records" 
ON patient_data_access 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy 7: Prevent deletion to maintain audit trail integrity
-- No DELETE policy = no one can delete records, preserving audit integrity

-- Create function to log patient data access
CREATE OR REPLACE FUNCTION log_patient_data_access(
  patient_uuid uuid,
  accessor_uuid uuid,
  access_type_param text,
  purpose_param text,
  expires_hours integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  access_id uuid;
  expires_time timestamp with time zone;
BEGIN
  -- Calculate expiration time if provided
  IF expires_hours IS NOT NULL THEN
    expires_time := now() + (expires_hours || ' hours')::interval;
  END IF;
  
  -- Insert access record
  INSERT INTO patient_data_access (
    patient_id,
    accessor_id, 
    access_type,
    purpose,
    expires_at,
    metadata
  ) VALUES (
    patient_uuid,
    accessor_uuid,
    access_type_param,
    purpose_param,
    expires_time,
    jsonb_build_object(
      'ip_address', inet_client_addr(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent',
      'logged_at', now()
    )
  ) RETURNING id INTO access_id;
  
  RETURN access_id;
END;
$$;

-- Grant execute permissions on the logging function
GRANT EXECUTE ON FUNCTION log_patient_data_access(uuid, uuid, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION log_patient_data_access(uuid, uuid, text, text, integer) TO service_role;