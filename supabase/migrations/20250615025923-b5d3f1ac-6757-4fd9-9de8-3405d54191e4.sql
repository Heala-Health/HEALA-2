
-- Add RLS policy to allow authenticated users to view agent profiles
CREATE POLICY "Users can view agent profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (role = 'agent');

-- Also add policies for other roles that might need to be visible
CREATE POLICY "Users can view physician profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (role = 'physician');
