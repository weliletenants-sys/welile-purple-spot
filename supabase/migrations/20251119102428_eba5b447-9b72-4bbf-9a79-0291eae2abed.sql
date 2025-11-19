-- Fix profiles table RLS policies
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Users can view only their own profile
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix authorized_recorders table RLS policies
-- Drop the permissive policies
DROP POLICY IF EXISTS "Anyone can insert recorders" ON public.authorized_recorders;
DROP POLICY IF EXISTS "Anyone can update recorders" ON public.authorized_recorders;
DROP POLICY IF EXISTS "Anyone can delete recorders" ON public.authorized_recorders;

-- Anyone can still view active recorders (for dropdown lists etc)
-- But only admins can manage them
CREATE POLICY "Admins manage recorders" ON public.authorized_recorders
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));