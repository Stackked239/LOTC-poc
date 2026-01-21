-- Fix RLS policies on submissions table to allow read access
-- Run this in Supabase SQL Editor

-- Option 1: Allow all operations (simplest for development)
-- This allows anyone to read/write submissions
DROP POLICY IF EXISTS "Allow all operations on submissions" ON public.submissions;
CREATE POLICY "Allow all operations on submissions"
    ON public.submissions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Option 2: If you prefer more granular control, use these instead:
-- (Comment out Option 1 above and uncomment these)

/*
-- Allow anyone to read submissions
DROP POLICY IF EXISTS "Allow read access to submissions" ON public.submissions;
CREATE POLICY "Allow read access to submissions"
    ON public.submissions
    FOR SELECT
    USING (true);

-- Allow anyone to create submissions
DROP POLICY IF EXISTS "Allow insert access to submissions" ON public.submissions;
CREATE POLICY "Allow insert access to submissions"
    ON public.submissions
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to update submissions
DROP POLICY IF EXISTS "Allow update access to submissions" ON public.submissions;
CREATE POLICY "Allow update access to submissions"
    ON public.submissions
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
*/

-- Verify RLS is enabled
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Check the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'submissions';
