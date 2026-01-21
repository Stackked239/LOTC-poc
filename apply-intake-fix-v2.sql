-- ============================================
-- INTAKE FIX v2: Idempotent version (safe to run multiple times)
-- ============================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yzomcvqfdrqhmcuribhv/sql

-- 1. Drop ALL existing policies on inventory_transactions for INSERT
DROP POLICY IF EXISTS "Transactions can be created by authorized users" ON inventory_transactions;
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON inventory_transactions;

-- 2. Create permissive policy that allows all authenticated users
CREATE POLICY "Authenticated users can create transactions" ON inventory_transactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. Create trigger function to auto-create staff profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.staff_profiles (id, full_name, role, can_intake, can_pick, can_approve_journal_entries)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'volunteer',
    true,
    true,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to auto-create staff profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Backfill staff profiles for existing users
INSERT INTO staff_profiles (id, full_name, role, can_intake, can_pick, can_approve_journal_entries)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  'volunteer' as role,
  true as can_intake,
  true as can_pick,
  false as can_approve_journal_entries
FROM auth.users
WHERE id NOT IN (SELECT id FROM staff_profiles)
ON CONFLICT (id) DO NOTHING;

-- Verification query - run this to check it worked
SELECT
  COUNT(*) as total_users,
  COUNT(sp.id) as users_with_profiles
FROM auth.users u
LEFT JOIN staff_profiles sp ON u.id = sp.id;
