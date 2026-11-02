-- VendorDomain core schema (PostgreSQL 15+)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS tenants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
 slug text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL UNIQUE,
 display_name text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tenant_memberships (
 tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('owner','admin','operator','viewer')),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,user_id)
);
CREATE TABLE IF NOT EXISTS projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 name text NOT NULL,
 environment text NOT NULL CHECK(environment IN ('development','staging','production')),
 region text,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,name)
);
CREATE TABLE IF NOT EXISTS domains (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
 fqdn text NOT NULL,
 registrar text,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','active','expired','failed')),
 verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,fqdn)
);
CREATE TABLE IF NOT EXISTS dns_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
 record_type text NOT NULL CHECK(record_type IN ('A','AAAA','CNAME','MX','TXT','NS','CAA','SRV')),
 name text NOT NULL,
 content text NOT NULL,
 ttl integer NOT NULL DEFAULT 1 CHECK(ttl=1 OR ttl BETWEEN 60 AND 86400),
 provider_ref text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS service_instances (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
 service_key text NOT NULL,
 provider text,
 region text,
 status text NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','provisioning','active','failed','deleted')),
 configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
 actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
 action text NOT NULL,
 resource_type text NOT NULL,
 resource_id text,
 result text NOT NULL,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domains_tenant ON domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_instances_tenant ON service_instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_created ON audit_events(tenant_id,created_at DESC);
