-- PlanetBintang Hosting Account + File Manager integration
-- Prerequisites: migrations/001_core.sql and 002_account_identity.sql
-- PostgreSQL 15+. Apply once to the selected Neon/Postgres database.
CREATE TABLE IF NOT EXISTS hosting_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  service_type text NOT NULL CHECK (service_type IN ('website','domain','dns','ssl','database','email','storage','application','hosting','backup')),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 180),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','provisioning','active','suspended','failed','deleted')),
  notes text NOT NULL DEFAULT '',
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hosting_services_tenant ON hosting_services(tenant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hosting_services_status ON hosting_services(tenant_id,status);

CREATE TABLE IF NOT EXISTS file_manager_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  path text NOT NULL CHECK (length(path) BETWEEN 1 AND 500),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 180),
  entry_kind text NOT NULL DEFAULT 'file' CHECK (entry_kind IN ('file','folder')),
  content_type text NOT NULL DEFAULT 'application/octet-stream',
  content text NOT NULL DEFAULT '',
  byte_size bigint NOT NULL DEFAULT 0 CHECK (byte_size BETWEEN 0 AND 524288),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,path)
);
CREATE INDEX IF NOT EXISTS idx_file_manager_tenant_path ON file_manager_entries(tenant_id,path);
CREATE INDEX IF NOT EXISTS idx_file_manager_tenant_updated ON file_manager_entries(tenant_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS hosting_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hosting_audit_tenant_created ON hosting_audit_events(tenant_id,created_at DESC);

-- File Manager stores account metadata and REIC configuration records.
-- Binary uploads require a separate object-storage adapter.
