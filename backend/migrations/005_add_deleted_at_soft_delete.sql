-- Soft delete: set deleted_at instead of removing the row
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses (deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN expenses.deleted_at IS 'When set, the expense is soft-deleted and excluded from list/get.';
