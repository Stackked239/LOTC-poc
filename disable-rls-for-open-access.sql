-- ============================================
-- DISABLE RLS: Make app completely open (no authentication required)
-- ============================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yzomcvqfdrqhmcuribhv/sql

-- WARNING: This makes the database completely open to anyone with the anon key
-- Only use this for development or if you truly want an open system

-- 1. Disable RLS on all tables
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE bags_of_hope DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_batches DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies (clean up)
DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON categories;
DROP POLICY IF EXISTS "Categories are editable by admins" ON categories;
DROP POLICY IF EXISTS "Transactions are viewable by authenticated users" ON inventory_transactions;
DROP POLICY IF EXISTS "Transactions can be created by authorized users" ON inventory_transactions;
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Inventory levels are viewable by authenticated users" ON inventory_levels;
DROP POLICY IF EXISTS "System can update inventory levels" ON inventory_levels;
DROP POLICY IF EXISTS "Bags are viewable by authenticated users" ON bags_of_hope;
DROP POLICY IF EXISTS "Bags can be created by users with pick permission" ON bags_of_hope;
DROP POLICY IF EXISTS "Bags can be updated by authorized users" ON bags_of_hope;
DROP POLICY IF EXISTS "Journal entries are viewable by authenticated users" ON journal_entries;
DROP POLICY IF EXISTS "Journal entries can be updated by approvers" ON journal_entries;
DROP POLICY IF EXISTS "System can insert journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Staff profiles are viewable by authenticated users" ON staff_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON staff_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON staff_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON staff_profiles;

-- Verification query - check RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected result: all tables should show rls_enabled = false
