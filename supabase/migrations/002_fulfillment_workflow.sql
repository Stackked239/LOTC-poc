-- LOTC Inventory Management System
-- Fulfillment Workflow Migration
-- Run this in your Supabase SQL Editor

-- Update bags_of_hope status check constraint to support new workflow
ALTER TABLE bags_of_hope DROP CONSTRAINT IF EXISTS bags_of_hope_status_check;

ALTER TABLE bags_of_hope ADD CONSTRAINT bags_of_hope_status_check
  CHECK (status IN (
    'pending',          -- Request created, waiting to be picked
    'picking',          -- Currently being picked
    'packing',          -- Items picked, being packed
    'ready_to_ship',    -- Packed and ready to ship
    'in_transit',       -- Shipped, in transit
    'ready_for_pickup', -- At destination, ready for pickup
    'delivered',        -- Delivered to recipient
    'cancelled'         -- Cancelled
  ));

-- Add new columns for tracking workflow timestamps
ALTER TABLE bags_of_hope
  ADD COLUMN IF NOT EXISTS picked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipping_carrier TEXT,
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Migrate existing data: 'in_progress' -> 'picking', 'packed' -> 'ready_to_ship'
UPDATE bags_of_hope SET status = 'picking' WHERE status = 'in_progress';
UPDATE bags_of_hope SET status = 'ready_to_ship' WHERE status = 'packed';

-- Create index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_bags_of_hope_status ON bags_of_hope(status);
