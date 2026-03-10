-- Monthly plan: planned expense items (single editable template)
CREATE TABLE IF NOT EXISTS monthly_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monthly_plan_items_position ON monthly_plan_items (position);

-- Single row table for plan settings (monthly income)
CREATE TABLE IF NOT EXISTS monthly_plan_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  monthly_income DECIMAL(12, 2) CHECK (monthly_income IS NULL OR monthly_income >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO monthly_plan_settings (id, monthly_income) VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed default planned expense items (only if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM monthly_plan_items LIMIT 1) THEN
    INSERT INTO monthly_plan_items (label, amount, position) VALUES
      ('Rent of house', 15000, 1),
      ('Gas', 1500, 2),
      ('Electricity', 1000, 3),
      ('Wifi bill', 500, 4),
      ('Food', 9000, 5),
      ('Transportation', 3000, 6),
      ('Father-Mother', 6000, 7),
      ('Cow-Ox debt', 10000, 8);
  END IF;
END $$;

COMMENT ON TABLE monthly_plan_items IS 'Single editable monthly plan: planned expense line items';
COMMENT ON TABLE monthly_plan_settings IS 'Plan settings: monthly_income (one row)';
