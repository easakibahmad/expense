-- Add created_at if the table was created without it (e.g. pre-migration or manual)
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
