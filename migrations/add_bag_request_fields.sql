-- Migration: Add comprehensive bag request fields to bags_of_hope table
-- Run this in your Supabase SQL Editor

-- Add child information fields
ALTER TABLE bags_of_hope
ADD COLUMN IF NOT EXISTS child_first_name TEXT,
ADD COLUMN IF NOT EXISTS child_last_name TEXT,
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS child_age INTEGER,
ADD COLUMN IF NOT EXISTS ethnicity TEXT;

-- Add pickup/delivery fields
ALTER TABLE bags_of_hope
ADD COLUMN IF NOT EXISTS pickup_location TEXT;

-- Add bag detail fields
ALTER TABLE bags_of_hope
ADD COLUMN IF NOT EXISTS bag_embroidery_company TEXT,
ADD COLUMN IF NOT EXISTS bag_order_number TEXT,
ADD COLUMN IF NOT EXISTS bag_embroidery_color TEXT,
ADD COLUMN IF NOT EXISTS toiletry_bag_color TEXT,
ADD COLUMN IF NOT EXISTS toiletry_bag_labeled TEXT;

-- Add non-clothing items field
ALTER TABLE bags_of_hope
ADD COLUMN IF NOT EXISTS toy_activity TEXT;

-- Add clothing fields
ALTER TABLE bags_of_hope
ADD COLUMN IF NOT EXISTS tops TEXT,
ADD COLUMN IF NOT EXISTS bottoms TEXT,
ADD COLUMN IF NOT EXISTS pajamas TEXT,
ADD COLUMN IF NOT EXISTS underwear TEXT,
ADD COLUMN IF NOT EXISTS diaper_pullup TEXT,
ADD COLUMN IF NOT EXISTS shoes TEXT,
ADD COLUMN IF NOT EXISTS coat TEXT;

-- Add comments for documentation
COMMENT ON COLUMN bags_of_hope.child_first_name IS 'Child''s first name';
COMMENT ON COLUMN bags_of_hope.child_last_name IS 'Child''s last name';
COMMENT ON COLUMN bags_of_hope.birthday IS 'Child''s date of birth';
COMMENT ON COLUMN bags_of_hope.child_age IS 'Child''s age in years (calculated from birthday)';
COMMENT ON COLUMN bags_of_hope.ethnicity IS 'Child''s ethnicity';
COMMENT ON COLUMN bags_of_hope.pickup_location IS 'Pickup location for the bag';
COMMENT ON COLUMN bags_of_hope.bag_embroidery_company IS 'Company handling bag embroidery';
COMMENT ON COLUMN bags_of_hope.bag_order_number IS 'Order number for the bag';
COMMENT ON COLUMN bags_of_hope.bag_embroidery_color IS 'Color for bag embroidery (child''s favorite color)';
COMMENT ON COLUMN bags_of_hope.toiletry_bag_color IS 'Color of toiletry bag';
COMMENT ON COLUMN bags_of_hope.toiletry_bag_labeled IS 'Label information for toiletry bag';
COMMENT ON COLUMN bags_of_hope.toy_activity IS 'Toy or activity items needed';
COMMENT ON COLUMN bags_of_hope.tops IS 'Tops clothing needs';
COMMENT ON COLUMN bags_of_hope.bottoms IS 'Bottoms clothing needs';
COMMENT ON COLUMN bags_of_hope.pajamas IS 'Pajamas/sleepwear needs';
COMMENT ON COLUMN bags_of_hope.underwear IS 'Underwear needs';
COMMENT ON COLUMN bags_of_hope.diaper_pullup IS 'Diaper/pullup/overnight needs';
COMMENT ON COLUMN bags_of_hope.shoes IS 'Shoe needs (use only if needed)';
COMMENT ON COLUMN bags_of_hope.coat IS 'Coat needs (use only if needed)';
