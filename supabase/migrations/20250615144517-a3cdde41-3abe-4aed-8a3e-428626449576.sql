
-- Fix the hospital admin association by assigning them to Saint Bishops Hospital
UPDATE public.profiles 
SET hospital_id = 'ae9b4e15-566d-472d-aa76-e0d53491424a'
WHERE role = 'hospital_admin' 
AND hospital_id IS NULL;

-- Also ensure the hospital is active
UPDATE public.hospitals 
SET is_active = true 
WHERE id = 'ae9b4e15-566d-472d-aa76-e0d53491424a';
