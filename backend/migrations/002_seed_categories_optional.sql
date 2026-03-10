-- Optional: add a categories reference table for validation (can be extended later)
-- Frontend uses: Food, Transport, Bills, Shopping, Health, Entertainment, Other
-- This migration is optional; API validates against the same list in code.

-- Add check constraint for allowed categories (optional but enforces consistency)
ALTER TABLE expenses
  DROP CONSTRAINT IF EXISTS expenses_category_check;

ALTER TABLE expenses
  ADD CONSTRAINT expenses_category_check
  CHECK (category IN (
    'Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Other'
  ));
