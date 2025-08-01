-- Fix wallets RLS policies only
DROP POLICY IF EXISTS "Users can manage their own wallets" ON public.wallets;

CREATE POLICY "Users can view their own wallets" 
ON public.wallets 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own wallets" 
ON public.wallets 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wallets" 
ON public.wallets 
FOR UPDATE 
USING (user_id = auth.uid());