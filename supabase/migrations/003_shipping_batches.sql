-- LOTC Inventory Management System
-- Shipping Batches Migration
-- Run this in your Supabase SQL Editor

-- Create shipping_batches table
CREATE TABLE IF NOT EXISTS shipping_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',             -- Batch is open, can add more bags
    'ready_to_ship',    -- Batch closed, ready for courier pickup
    'in_transit',       -- Courier has picked up
    'ready_for_pickup', -- At destination
    'delivered',        -- All bags delivered
    'cancelled'         -- Batch cancelled
  )),
  courier_name TEXT,
  tracking_number TEXT,
  notes TEXT,
  scheduled_pickup_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add batch_id to bags_of_hope
ALTER TABLE bags_of_hope
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES shipping_batches(id);

-- Create index for batch lookups
CREATE INDEX IF NOT EXISTS idx_bags_of_hope_batch_id ON bags_of_hope(batch_id);
CREATE INDEX IF NOT EXISTS idx_shipping_batches_status ON shipping_batches(status);

-- Function to generate batch number (BATCH-YYYYMMDD-XXX)
CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS TEXT AS $$
DECLARE
  today_date TEXT;
  sequence_num INTEGER;
  new_batch_number TEXT;
BEGIN
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');

  -- Count batches created today to get sequence number
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM shipping_batches
  WHERE batch_number LIKE 'BATCH-' || today_date || '-%';

  new_batch_number := 'BATCH-' || today_date || '-' || LPAD(sequence_num::TEXT, 3, '0');

  RETURN new_batch_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate batch number on insert
CREATE OR REPLACE FUNCTION set_batch_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_number IS NULL THEN
    NEW.batch_number := generate_batch_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_batch_number ON shipping_batches;
CREATE TRIGGER trigger_set_batch_number
  BEFORE INSERT ON shipping_batches
  FOR EACH ROW
  EXECUTE FUNCTION set_batch_number();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_shipping_batch_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_batch_timestamp ON shipping_batches;
CREATE TRIGGER trigger_update_batch_timestamp
  BEFORE UPDATE ON shipping_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_batch_timestamp();

-- RLS Policies
ALTER TABLE shipping_batches ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (until auth is added)
CREATE POLICY "Batches are viewable by everyone" ON shipping_batches
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create batches" ON shipping_batches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update batches" ON shipping_batches
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete batches" ON shipping_batches
  FOR DELETE USING (true);
