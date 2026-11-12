-- VendorDomain account identity and File Manager metadata
-- Apply with a reviewed backup before production migration.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS auth_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_expiry ON auth_sessions(user_id,expires_at DESC);

CREATE TABLE IF NOT EXISTS account_files (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 180),
 file_type text NOT NULL DEFAULT 'document',
 folder text NOT NULL DEFAULT 'Dokumen Akun',
 storage_key text,
 byte_size bigint NOT NULL DEFAULT 0 CHECK(byte_size BETWEEN 0 AND 52428800),
 storage_mode text NOT NULL DEFAULT 'metadata-reference' CHECK(storage_mode IN ('metadata-reference','object-storage')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_account_files_tenant_created ON account_files(tenant_id,created_at DESC);

-- Existing users are not automatically given a password. They must complete
-- a secure password enrollment/reset flow before password login is enabled.
