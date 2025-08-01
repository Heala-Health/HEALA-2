-- Fix consultation_rooms room_status constraint
ALTER TABLE public.consultation_rooms 
DROP CONSTRAINT IF EXISTS consultation_rooms_room_status_check;

-- Add updated constraint allowing all necessary room status values
ALTER TABLE public.consultation_rooms 
ADD CONSTRAINT consultation_rooms_room_status_check 
CHECK (room_status IN ('waiting', 'active', 'completed', 'ended', 'cancelled', 'failed', 'connecting'));