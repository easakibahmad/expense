-- Create expenses table (matches frontend Expense type)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(50) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for listing/filtering by date (most common query)
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date DESC);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);

-- Index for note search (optional, for ILIKE)
CREATE INDEX IF NOT EXISTS idx_expenses_note ON expenses (note) WHERE note IS NOT NULL;

COMMENT ON TABLE expenses IS 'User expense records; category values: Food, Transport, Bills, Shopping, Health, Entertainment, Other';
