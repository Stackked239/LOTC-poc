-- Create submissions table for external form submissions
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_first_name TEXT NOT NULL,
    child_last_name TEXT NOT NULL,
    birthday DATE NOT NULL,
    child_gender TEXT NOT NULL,
    ethnicity TEXT,
    pickup_location TEXT NOT NULL,
    clothing_needs TEXT,
    toy_preferences TEXT,
    special_notes TEXT,
    caregiver_name TEXT,
    caregiver_phone TEXT,
    caregiver_email TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    bag_of_hope_id UUID REFERENCES public.bags_of_hope(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on submissions" ON public.submissions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.submissions IS 'Stores external form submissions that need to be processed by staff';
