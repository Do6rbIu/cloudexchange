-- Cloud24 Exchange · schema v1
--
-- Tables seeded into the postgres-data volume on first boot. Re-running
-- docker-compose against an existing volume is a no-op (init scripts are
-- ignored when /var/lib/postgresql/data is non-empty).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ────────────────────────────────────────────────────────────────────────
-- Application users.
--
-- This is the *Cloud24 Exchange* user record (roles, profile, audit ties).
-- The actual mailbox authentication still happens against Dovecot in
-- Phase 1 — Phase 2 wires Postfix/Dovecot to read this table via
-- proxy_lookup, at which point password_hash becomes authoritative.
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           citext NOT NULL UNIQUE,
    display_name    text NOT NULL DEFAULT '',
    password_hash   text,                                  -- bcrypt; null until Phase 2
    role            text NOT NULL DEFAULT 'user'
                       CHECK (role IN ('user', 'admin')),
    quota_bytes     bigint NOT NULL DEFAULT 5368709120,    -- 5 GiB default
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    last_login_at   timestamptz
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role) WHERE is_active;

-- ────────────────────────────────────────────────────────────────────────
-- Append-only audit log.
-- Every login, admin action and configuration change lands here.
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id              bigserial PRIMARY KEY,
    occurred_at     timestamptz NOT NULL DEFAULT now(),
    actor_email     citext,                 -- null for anonymous events
    action          text NOT NULL,          -- e.g. 'login', 'admin.user.create'
    target          text,                   -- subject of the action, free-form
    ip_address      inet,
    user_agent      text,
    result          text NOT NULL DEFAULT 'success'
                       CHECK (result IN ('success', 'failure')),
    detail          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log (actor_email, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log (action, occurred_at DESC);

-- ────────────────────────────────────────────────────────────────────────
-- Application settings — key/value with audit trail.
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
    key             text PRIMARY KEY,
    value           jsonb NOT NULL,
    updated_at      timestamptz NOT NULL DEFAULT now(),
    updated_by      citext
);

INSERT INTO app_settings (key, value) VALUES
    ('feature.demo_login', 'true'::jsonb),
    ('feature.signup',     'false'::jsonb),
    ('feature.2fa',        'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────
-- Bootstrap admin: the demo user gets the admin role automatically so
-- the UI's admin pages light up out of the box. In real deployments
-- this row should be removed and a real admin provisioned.
-- ────────────────────────────────────────────────────────────────────────
INSERT INTO users (email, display_name, role)
VALUES ('igor.petrov@cloudexchange.local', 'Игорь Петров', 'admin')
ON CONFLICT (email) DO NOTHING;
