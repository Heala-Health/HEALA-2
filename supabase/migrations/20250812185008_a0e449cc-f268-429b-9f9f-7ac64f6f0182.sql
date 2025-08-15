
-- 1) Helper function: get role from JWT claims (no table access)
CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF((auth.jwt() -> 'user_metadata' ->> 'role')::text, ''),
    NULLIF((auth.jwt() -> 'app_metadata' ->> 'role')::text, ''),
    NULLIF((auth.jwt() ->> 'role')::text, ''),
    ''
  );
$$;

ALTER FUNCTION public.jwt_role() OWNER TO postgres;

-- 2) Replace recursive policy on profiles (agents viewing patient profiles)

-- Drop old policy if it exists (the old one referenced get_current_user_role())
DROP POLICY IF EXISTS "Agents can view patient profiles" ON public.profiles;

-- Recreate using jwt_role() to avoid recursion
CREATE POLICY "Agents can view patient profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.jwt_role() = 'agent'
    AND role = 'patient'
  );

-- 3) Ensure admins can select all profiles without recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.jwt_role() = 'admin'
  );
