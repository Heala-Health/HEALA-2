
-- 1) Create required enums if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('patient','physician','hospital_admin','agent','admin');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE public.subscription_plan AS ENUM ('basic','premium','enterprise');
  END IF;
END $$;

-- 2) Recreate public.profiles (referenced across the app and SQL functions)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  role public.user_role NOT NULL DEFAULT 'patient',
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
  license_number text,
  specialization text,
  subscription_plan public.subscription_plan NOT NULL DEFAULT 'basic',
  current_consultation_rate numeric,
  is_active boolean DEFAULT true,
  city text,
  state text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_hospital_id ON public.profiles(hospital_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- 3) Recreate public.users (lightweight, used by existing functions; not the auth.users table)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5) Safe, non-recursive RLS policies for profiles

-- Self access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_self_select'
  ) THEN
    CREATE POLICY "profiles_self_select" ON public.profiles
      FOR SELECT TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_self_insert'
  ) THEN
    CREATE POLICY "profiles_self_insert" ON public.profiles
      FOR INSERT TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_self_update'
  ) THEN
    CREATE POLICY "profiles_self_update" ON public.profiles
      FOR UPDATE TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

-- Allow authenticated users to view active profiles (needed for listings like physicians)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_active'
  ) THEN
    CREATE POLICY "profiles_select_active" ON public.profiles
      FOR SELECT TO authenticated
      USING (is_active = true);
  END IF;
END $$;

-- Admins can manage everything (uses jwt_role() which reads JWT claims only; no recursion)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_admin_all'
  ) THEN
    CREATE POLICY "profiles_admin_all" ON public.profiles
      FOR ALL TO authenticated
      USING (public.jwt_role() = 'admin')
      WITH CHECK (public.jwt_role() = 'admin');
  END IF;
END $$;

-- 6) RLS policies for public.users
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_self_select'
  ) THEN
    CREATE POLICY "users_self_select" ON public.users
      FOR SELECT TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_admin_all'
  ) THEN
    CREATE POLICY "users_admin_all" ON public.users
      FOR ALL TO authenticated
      USING (public.jwt_role() = 'admin')
      WITH CHECK (public.jwt_role() = 'admin');
  END IF;
END $$;

-- 7) Create wallet automatically when a profile is created (no triggers on auth schema)
DROP TRIGGER IF EXISTS create_wallet_on_profile_insert ON public.profiles;
CREATE TRIGGER create_wallet_on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_wallet_on_signup();
