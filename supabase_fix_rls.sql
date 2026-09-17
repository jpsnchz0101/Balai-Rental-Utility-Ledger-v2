-- ==============================================================================
-- SUPABASE SECURITY FIX: Multi-Tenant Row Level Security (RLS) & Policies
-- Enforces: Strict user isolation where each landlord only accesses their own data
-- ==============================================================================

-- 1. Ensure user_id column exists on all public tables with default auth.uid()
ALTER TABLE IF EXISTS public.settings 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

ALTER TABLE IF EXISTS public.rooms 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

ALTER TABLE IF EXISTS public.payments 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

ALTER TABLE IF EXISTS public.expenses 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Enable Row Level Security on all public tables
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;

-- 3. Settings Policies (User Isolation)
DROP POLICY IF EXISTS "Allow authenticated read on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow authenticated modify on settings" ON public.settings;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.settings;

CREATE POLICY "Users can manage own settings"
  ON public.settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- 4. Rooms Policies (User Isolation)
DROP POLICY IF EXISTS "Allow authenticated read on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow authenticated modify on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can manage own rooms" ON public.rooms;

CREATE POLICY "Users can manage own rooms"
  ON public.rooms
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Payments Policies (User Isolation)
DROP POLICY IF EXISTS "Allow authenticated read on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow authenticated modify on payments" ON public.payments;
DROP POLICY IF EXISTS "Users can manage own payments" ON public.payments;

CREATE POLICY "Users can manage own payments"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Expenses Policies (User Isolation)
DROP POLICY IF EXISTS "Allow authenticated read on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated modify on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage own expenses" ON public.expenses;

CREATE POLICY "Users can manage own expenses"
  ON public.expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

