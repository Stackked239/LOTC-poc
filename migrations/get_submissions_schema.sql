-- Get the full schema of the submissions table
-- Run this in Supabase SQL Editor and copy the results

-- 1. Get column information
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'submissions'
ORDER BY
    ordinal_position;

-- 2. Get a sample row to see actual data
SELECT * FROM public.submissions LIMIT 1;

-- 3. Get all column names as a comma-separated list (useful for copying)
SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'submissions';

-- 4. Get row count
SELECT COUNT(*) as total_rows FROM public.submissions;

-- 5. Get constraints and indexes
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM
    pg_constraint
WHERE
    conrelid = 'public.submissions'::regclass;
