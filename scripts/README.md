# Get Submissions Table Schema

I've created two methods to get the schema of your existing submissions table:

## Method 1: Run the Node.js Script (Easiest)

```bash
node scripts/inspect-submissions.js
```

This will:
- Connect to your Supabase database
- Fetch sample submissions (if any exist)
- Display the schema with column names, types, and sample data
- Show the total row count

**Note:** If you see "No submissions found", it means either:
- The table is empty, OR
- RLS (Row Level Security) is blocking access

## Method 2: Run SQL in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/yzomcvqfdrqhmcuribhv/editor
2. Click "SQL Editor" in the left sidebar
3. Paste and run the SQL from `migrations/get_submissions_schema.sql`

This SQL will show you:
- All column names and data types
- Sample data from the table
- Row count
- Constraints and indexes

## What I Need

After running either method, please send me:

1. **The column names** - Just copy the list of column names
2. **A sample row** (if available) - So I can see the actual data structure
3. **Any error messages** - If the query fails

Then I can update the code to perfectly match your existing schema!

## Quick Fix

If the table is completely empty and you just want to test the UI, you can run:

```bash
# In Supabase SQL Editor, run:
migrations/add_sample_submissions.sql
```

This will add 5 test submissions so you can see the queue working.
