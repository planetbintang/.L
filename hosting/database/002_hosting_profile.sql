-- Add editable account profile fields without changing identity/authentication columns.
ALTER TABLE hosting_users
  ADD COLUMN IF NOT EXISTS profile jsonb NOT NULL DEFAULT '{}'::jsonb;
