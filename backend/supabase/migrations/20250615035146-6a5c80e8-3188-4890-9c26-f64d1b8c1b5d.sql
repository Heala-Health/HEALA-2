
-- Drop the policy causing infinite recursion
DROP POLICY IF EXISTS "Agents can view patient profiles" ON public.profiles;

-- Create a security definer function to get current user role without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the incorrectly configured existing policy
DROP POLICY IF EXISTS "Users can view patient profiles" ON public.profiles;

-- Create a new policy that allows agents to view patient profiles
CREATE POLICY "Agents can view patient profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  public.get_current_user_role() = 'agent' AND profiles.role = 'patient'
);
