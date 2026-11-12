-- HOSTING REIC: identity, tenant, service and File Manager metadata.
-- Apply only to the configured PostgreSQL backend after reviewing environment and backups.
create extension if not exists pgcrypto;
create extension if not exists citext;
create table if not exists hosting_tenants (
 id uuid primary key default gen_random_uuid(), name text not null,
 status text not null default 'pending' check (status in ('pending','active','suspended','closed')),
 created_at timestamptz not null default now()
);
create table if not exists hosting_users (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references hosting_tenants(id),
 email citext not null, display_name text not null, password_hash text not null,
 email_verified_at timestamptz, status text not null default 'pending',
 created_at timestamptz not null default now(), unique(tenant_id,email)
);
create table if not exists hosting_roles (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references hosting_tenants(id),
 name text not null, permissions jsonb not null default '[]'::jsonb, unique(tenant_id,name)
);
create table if not exists hosting_memberships (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references hosting_tenants(id),
 user_id uuid not null references hosting_users(id), role_id uuid not null references hosting_roles(id),
 status text not null default 'active', unique(tenant_id,user_id)
);
create table if not exists hosting_sessions (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references hosting_tenants(id),
 user_id uuid not null references hosting_users(id), token_hash text not null unique,
 expires_at timestamptz not null, revoked_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists hosting_services (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references hosting_tenants(id),
 service_type text not null, name text not null, status text not null default 'pending',
 resource_quota jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists hosting_domains (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references hosting_tenants(id),
 domain_name citext not null, status text not null default 'pending', metadata jsonb not null default '{}'::jsonb,
 unique(tenant_id,domain_name)
);
create table if not exists hosting_file_objects (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references hosting_tenants(id),
 owner_user_id uuid references hosting_users(id), parent_id uuid references hosting_file_objects(id),
 name text not null, object_key text not null, mime_type text, size_bytes bigint not null default 0,
 checksum_sha256 text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
 unique(tenant_id,object_key)
);
create table if not exists hosting_file_permissions (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references hosting_tenants(id),
 file_id uuid not null references hosting_file_objects(id), principal_type text not null,
 principal_id uuid not null, permission text not null, unique(tenant_id,file_id,principal_type,principal_id,permission)
);
create table if not exists hosting_activity (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references hosting_tenants(id),
 actor_user_id uuid references hosting_users(id), action text not null, resource text not null,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists hosting_users_tenant_idx on hosting_users(tenant_id);
create index if not exists hosting_files_parent_idx on hosting_file_objects(tenant_id,parent_id);
create index if not exists hosting_activity_tenant_time_idx on hosting_activity(tenant_id,created_at desc);
-- Production hardening: enable RLS and create policies using tenant_id from verified server session.
-- Never expose DB credentials or service-role keys to browser JavaScript.
