-- Fix stale session data: mark ended session as completed
UPDATE consultation_sessions 
SET status = 'completed'
WHERE id = 'd2b0c6ac-0a12-46e3-a8ab-3eb0697e2a05' 
AND ended_at IS NOT NULL;

-- Create a new scheduled session for testing
INSERT INTO consultation_sessions (
  patient_id,
  physician_id,
  consultation_rate,
  session_type,
  status,
  payment_status
) VALUES (
  '150176f3-659d-4421-8e11-81086e3b5d00', -- same patient
  'c48a9b68-2144-4767-a3d1-395fab939a50', -- same physician  
  100.00,
  'video',
  'scheduled',
  'pending'
);