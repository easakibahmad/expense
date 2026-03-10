-- Ensure id has a default so INSERT without id works (e.g. if table was created without it)
ALTER TABLE expenses
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
