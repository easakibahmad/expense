-- Per-month plans: one plan per year_month (e.g. 2026-03)
CREATE TABLE IF NOT EXISTS monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month VARCHAR(7) NOT NULL UNIQUE CHECK (year_month ~ '^\d{4}-\d{2}$'),
  monthly_income DECIMAL(12, 2) CHECK (monthly_income IS NULL OR monthly_income >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monthly_plans_year_month ON monthly_plans (year_month);

-- Add plan_id to items (nullable first for migration)
ALTER TABLE monthly_plan_items ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES monthly_plans(id) ON DELETE CASCADE;

-- Migrate existing data: create one plan for current month and attach existing items
INSERT INTO monthly_plans (id, year_month, monthly_income, updated_at)
SELECT gen_random_uuid(), to_char(NOW(), 'YYYY-MM'),
  (SELECT monthly_income FROM monthly_plan_settings WHERE id = 1 LIMIT 1),
  NOW()
ON CONFLICT (year_month) DO NOTHING;

UPDATE monthly_plan_items mpi
SET plan_id = (SELECT id FROM monthly_plans WHERE year_month = to_char(NOW(), 'YYYY-MM') LIMIT 1)
WHERE plan_id IS NULL;

ALTER TABLE monthly_plan_items ALTER COLUMN plan_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_monthly_plan_items_plan_id ON monthly_plan_items (plan_id);

-- Drop old single-row settings table
DROP TABLE IF EXISTS monthly_plan_settings;

COMMENT ON TABLE monthly_plans IS 'One row per month: year_month (YYYY-MM), monthly_income';
COMMENT ON COLUMN monthly_plan_items.plan_id IS 'FK to monthly_plans: items belong to a specific month';
