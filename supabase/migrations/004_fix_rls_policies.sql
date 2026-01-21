-- Fix RLS policies to allow intake transactions without staff profile requirement
-- This allows authenticated users to create intake transactions even if they don't have a staff profile yet

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Transactions can be created by authorized users" ON inventory_transactions;

-- Create a new policy that allows all authenticated users to create intake transactions
-- In production, you may want to add staff_profile checks back
CREATE POLICY "Authenticated users can create transactions" ON inventory_transactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Optional: Create a function to auto-create staff profiles for new users
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a trigger to auto-create staff profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- For existing users without profiles, create them
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
