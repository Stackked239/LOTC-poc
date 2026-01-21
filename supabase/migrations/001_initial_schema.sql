-- LOTC Inventory Management System
-- Initial Database Schema Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- Categories lookup table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age_group TEXT NOT NULL CHECK (age_group IN ('baby', 'toddler', 'school_age', 'teen', 'neutral')),
  gender TEXT NOT NULL CHECK (gender IN ('boy', 'girl', 'neutral')),
  item_type TEXT NOT NULL,
  standard_value_new DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  standard_value_used DECIMAL(10,2) GENERATED ALWAYS AS (standard_value_new * 0.5) STORED,
  reorder_point INTEGER DEFAULT 10,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bags of Hope (must be created before inventory_transactions due to FK)
CREATE TABLE IF NOT EXISTS bags_of_hope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT,
  child_age_group TEXT NOT NULL,
  child_gender TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'packed', 'delivered', 'cancelled')),
  notes TEXT,
  packed_by UUID REFERENCES auth.users(id),
  packed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory transactions (all ins and outs)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('intake', 'pick', 'adjustment', 'thrift_out', 'disposal')),
  source_type TEXT CHECK (source_type IN ('donation', 'purchase', 'transfer')),
  condition TEXT CHECK (condition IN ('new', 'used')),
  quantity INTEGER NOT NULL,
  unit_value DECIMAL(10,2),
  total_value DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_value) STORED,
  notes TEXT,
  bag_of_hope_id UUID REFERENCES bags_of_hope(id),
  receipt_reference TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current inventory levels
CREATE TABLE IF NOT EXISTS inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) UNIQUE NOT NULL,
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_new INTEGER DEFAULT 0,
  quantity_used INTEGER DEFAULT 0,
  total_value DECIMAL(10,2) DEFAULT 0,
  last_intake_date TIMESTAMPTZ,
  last_pick_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries for QuickBooks export
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('in_kind_donation', 'purchase_expense', 'inventory_out')),
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  source_transaction_id UUID REFERENCES inventory_transactions(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'exported')),
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users/Staff profiles (extends Supabase auth)
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'volunteer' CHECK (role IN ('admin', 'staff', 'volunteer')),
  can_intake BOOLEAN DEFAULT true,
  can_pick BOOLEAN DEFAULT true,
  can_approve_journal_entries BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_categories_age_gender ON categories(age_group, gender);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_category ON inventory_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created ON inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_category ON inventory_levels(category_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_bags_of_hope_status ON bags_of_hope(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update inventory levels after any transaction
CREATE OR REPLACE FUNCTION update_inventory_levels()
RETURNS TRIGGER AS $$
DECLARE
  new_quantity_on_hand INTEGER;
  new_quantity_new INTEGER;
  new_quantity_used INTEGER;
  new_total_value DECIMAL(10,2);
  last_intake TIMESTAMPTZ;
  last_pick TIMESTAMPTZ;
BEGIN
  -- Calculate aggregated values
  SELECT
    COALESCE(SUM(CASE
      WHEN transaction_type = 'intake' THEN quantity
      WHEN transaction_type IN ('pick', 'thrift_out', 'disposal') THEN -quantity
      WHEN transaction_type = 'adjustment' THEN quantity
      ELSE 0
    END), 0),
    COALESCE(SUM(CASE
      WHEN transaction_type = 'intake' AND condition = 'new' THEN quantity
      WHEN transaction_type IN ('pick', 'thrift_out', 'disposal') AND condition = 'new' THEN -quantity
      WHEN transaction_type = 'adjustment' AND condition = 'new' THEN quantity
      ELSE 0
    END), 0),
    COALESCE(SUM(CASE
      WHEN transaction_type = 'intake' AND condition = 'used' THEN quantity
      WHEN transaction_type IN ('pick', 'thrift_out', 'disposal') AND condition = 'used' THEN -quantity
      WHEN transaction_type = 'adjustment' AND condition = 'used' THEN quantity
      ELSE 0
    END), 0),
    COALESCE(SUM(CASE
      WHEN transaction_type = 'intake' THEN total_value
      WHEN transaction_type IN ('pick', 'thrift_out', 'disposal') THEN -total_value
      WHEN transaction_type = 'adjustment' THEN total_value
      ELSE 0
    END), 0)
  INTO new_quantity_on_hand, new_quantity_new, new_quantity_used, new_total_value
  FROM inventory_transactions
  WHERE category_id = NEW.category_id;

  -- Get last intake and pick dates
  SELECT MAX(created_at) INTO last_intake
  FROM inventory_transactions
  WHERE category_id = NEW.category_id AND transaction_type = 'intake';

  SELECT MAX(created_at) INTO last_pick
  FROM inventory_transactions
  WHERE category_id = NEW.category_id AND transaction_type = 'pick';

  -- Upsert inventory level
  INSERT INTO inventory_levels (
    category_id,
    quantity_on_hand,
    quantity_new,
    quantity_used,
    total_value,
    last_intake_date,
    last_pick_date,
    updated_at
  )
  VALUES (
    NEW.category_id,
    new_quantity_on_hand,
    new_quantity_new,
    new_quantity_used,
    new_total_value,
    last_intake,
    last_pick,
    NOW()
  )
  ON CONFLICT (category_id)
  DO UPDATE SET
    quantity_on_hand = EXCLUDED.quantity_on_hand,
    quantity_new = EXCLUDED.quantity_new,
    quantity_used = EXCLUDED.quantity_used,
    total_value = EXCLUDED.total_value,
    last_intake_date = EXCLUDED.last_intake_date,
    last_pick_date = EXCLUDED.last_pick_date,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate journal entry from intake transaction
CREATE OR REPLACE FUNCTION generate_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
  category_name TEXT;
BEGIN
  -- Only process intake transactions
  IF NEW.transaction_type = 'intake' THEN
    -- Get category name
    SELECT name INTO category_name FROM categories WHERE id = NEW.category_id;

    IF NEW.source_type = 'donation' THEN
      -- In-kind donation: Debit Expense, Credit In-Kind Donation Revenue
      INSERT INTO journal_entries (
        entry_date,
        entry_type,
        debit_account,
        credit_account,
        amount,
        description,
        source_transaction_id
      )
      VALUES (
        CURRENT_DATE,
        'in_kind_donation',
        'Closet Inventory Expense - ' || category_name,
        'In-Kind Donations - Non-Cash Goods',
        NEW.total_value,
        'In-kind donation: ' || NEW.quantity || ' ' || category_name || ' (' || NEW.condition || ')',
        NEW.id
      );
    ELSIF NEW.source_type = 'purchase' THEN
      -- Purchase: Debit Expense, Credit Cash/AP
      INSERT INTO journal_entries (
        entry_date,
        entry_type,
        debit_account,
        credit_account,
        amount,
        description,
        source_transaction_id
      )
      VALUES (
        CURRENT_DATE,
        'purchase_expense',
        'Closet Inventory Expense - ' || category_name,
        'Accounts Payable / Cash',
        NEW.total_value,
        'Purchase: ' || NEW.quantity || ' ' || category_name || COALESCE(' - Ref: ' || NEW.receipt_reference, ''),
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update inventory levels after transaction
DROP TRIGGER IF EXISTS inventory_transaction_trigger ON inventory_transactions;
CREATE TRIGGER inventory_transaction_trigger
AFTER INSERT ON inventory_transactions
FOR EACH ROW EXECUTE FUNCTION update_inventory_levels();

-- Trigger to generate journal entry after intake
DROP TRIGGER IF EXISTS journal_entry_trigger ON inventory_transactions;
CREATE TRIGGER journal_entry_trigger
AFTER INSERT ON inventory_transactions
FOR EACH ROW EXECUTE FUNCTION generate_journal_entry();

-- Trigger to update updated_at on categories
DROP TRIGGER IF EXISTS categories_updated_at ON categories;
CREATE TRIGGER categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE bags_of_hope ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for categories (read by all authenticated, write by admin/staff)
CREATE POLICY "Categories are viewable by authenticated users" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Categories are editable by admins" ON categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Policies for inventory_transactions
CREATE POLICY "Transactions are viewable by authenticated users" ON inventory_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Transactions can be created by authorized users" ON inventory_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE id = auth.uid() AND (can_intake = true OR can_pick = true)
    )
  );

-- Policies for inventory_levels
CREATE POLICY "Inventory levels are viewable by authenticated users" ON inventory_levels
  FOR SELECT TO authenticated USING (true);

-- Allow system to update inventory levels (via trigger)
CREATE POLICY "System can update inventory levels" ON inventory_levels
  FOR ALL TO authenticated USING (true);

-- Policies for bags_of_hope
CREATE POLICY "Bags are viewable by authenticated users" ON bags_of_hope
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Bags can be created by users with pick permission" ON bags_of_hope
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE id = auth.uid() AND can_pick = true
    )
  );

CREATE POLICY "Bags can be updated by authorized users" ON bags_of_hope
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE id = auth.uid() AND can_pick = true
    )
  );

-- Policies for journal_entries
CREATE POLICY "Journal entries are viewable by authenticated users" ON journal_entries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Journal entries can be updated by approvers" ON journal_entries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE id = auth.uid() AND can_approve_journal_entries = true
    )
  );

-- System can insert journal entries (via trigger)
CREATE POLICY "System can insert journal entries" ON journal_entries
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for staff_profiles
CREATE POLICY "Staff profiles are viewable by authenticated users" ON staff_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON staff_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON staff_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow new users to create their profile
CREATE POLICY "Users can create their own profile" ON staff_profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- ============================================
-- SEED DATA - Categories
-- ============================================

INSERT INTO categories (name, age_group, gender, item_type, standard_value_new, reorder_point, display_order) VALUES
-- Baby Boy
('Baby Boy Tops', 'baby', 'boy', 'tops', 8.00, 15, 1),
('Baby Boy Bottoms', 'baby', 'boy', 'bottoms', 10.00, 15, 2),
('Baby Boy Sleepwear', 'baby', 'boy', 'sleepwear', 12.00, 10, 3),
-- Baby Girl
('Baby Girl Tops', 'baby', 'girl', 'tops', 8.00, 15, 4),
('Baby Girl Bottoms', 'baby', 'girl', 'bottoms', 10.00, 15, 5),
('Baby Girl Sleepwear', 'baby', 'girl', 'sleepwear', 12.00, 10, 6),
-- Toddler Boy
('Toddler Boy Tops', 'toddler', 'boy', 'tops', 10.00, 15, 7),
('Toddler Boy Bottoms', 'toddler', 'boy', 'bottoms', 12.00, 15, 8),
('Toddler Boy Sleepwear', 'toddler', 'boy', 'sleepwear', 15.00, 10, 9),
-- Toddler Girl
('Toddler Girl Tops', 'toddler', 'girl', 'tops', 10.00, 15, 10),
('Toddler Girl Bottoms', 'toddler', 'girl', 'bottoms', 12.00, 15, 11),
('Toddler Girl Sleepwear', 'toddler', 'girl', 'sleepwear', 15.00, 10, 12),
-- School Age Boy (7-11)
('School Age Boy Tops', 'school_age', 'boy', 'tops', 12.00, 20, 13),
('School Age Boy Bottoms', 'school_age', 'boy', 'bottoms', 15.00, 20, 14),
('School Age Boy Sleepwear', 'school_age', 'boy', 'sleepwear', 18.00, 10, 15),
-- School Age Girl
('School Age Girl Tops', 'school_age', 'girl', 'tops', 12.00, 20, 16),
('School Age Girl Bottoms', 'school_age', 'girl', 'bottoms', 15.00, 20, 17),
('School Age Girl Sleepwear', 'school_age', 'girl', 'sleepwear', 18.00, 10, 18),
-- Teen Boy (12+)
('Teen Boy Tops', 'teen', 'boy', 'tops', 15.00, 15, 19),
('Teen Boy Bottoms', 'teen', 'boy', 'bottoms', 20.00, 15, 20),
('Teen Boy Sleepwear', 'teen', 'boy', 'sleepwear', 20.00, 10, 21),
-- Teen Girl
('Teen Girl Tops', 'teen', 'girl', 'tops', 15.00, 15, 22),
('Teen Girl Bottoms', 'teen', 'girl', 'bottoms', 20.00, 15, 23),
('Teen Girl Sleepwear', 'teen', 'girl', 'sleepwear', 20.00, 10, 24),
-- Gender Neutral / Shared Categories
('Toiletries', 'neutral', 'neutral', 'toiletries', 5.00, 50, 25),
('Toys', 'neutral', 'neutral', 'toys', 10.00, 30, 26),
('Books', 'neutral', 'neutral', 'books', 8.00, 20, 27),
('Bedding/Blankets', 'neutral', 'neutral', 'bedding', 25.00, 15, 28),
('Shoes', 'neutral', 'neutral', 'shoes', 20.00, 20, 29),
('Undergarments', 'neutral', 'neutral', 'undergarments', 8.00, 30, 30),
('Socks', 'neutral', 'neutral', 'socks', 5.00, 40, 31)
ON CONFLICT DO NOTHING;

-- Initialize inventory levels for all categories
INSERT INTO inventory_levels (category_id, quantity_on_hand, quantity_new, quantity_used, total_value)
SELECT id, 0, 0, 0, 0 FROM categories
ON CONFLICT (category_id) DO NOTHING;
