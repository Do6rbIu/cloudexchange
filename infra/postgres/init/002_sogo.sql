-- Cloud24 Exchange · SOGo bootstrap
--
-- Provisions a dedicated role and database for SOGo's own metadata
-- (calendars, contacts, sessions, profiles). SOGo creates its own
-- tables on first connect (sogo_user_profile, sogo_folder_info, …),
-- so this file only ships the role, the database, and the user-source
-- VIEW that SOGo consults to find users.

-- ────────────────────────────────────────────────────────────────────
-- Role + database for SOGo's metadata
-- ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sogo') THEN
        CREATE ROLE sogo LOGIN PASSWORD 'sogo';
    END IF;
END$$;

SELECT 'CREATE DATABASE sogo OWNER sogo'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sogo')\gexec

GRANT ALL PRIVILEGES ON DATABASE sogo TO sogo;

\connect sogo

-- ────────────────────────────────────────────────────────────────────
-- VIEW: sogo_users
--
-- SOGo's SQL user source reads (c_uid, c_name, c_password, c_cn, mail).
-- We expose the canonical users table from the main `cloudexchange`
-- database via dblink so there's a *single source of truth* for who
-- exists. SOGo authenticates against IMAP regardless (see
-- SOGoAuthenticationType=imap), so c_password is a placeholder.
-- ────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS dblink;
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER IF NOT EXISTS cx_main
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'postgres', port '5432', dbname 'cloudexchange');

CREATE USER MAPPING IF NOT EXISTS FOR sogo
    SERVER cx_main
    OPTIONS (user 'cloudexchange', password 'cloudexchange-dev');

DROP FOREIGN TABLE IF EXISTS cx_users;
CREATE FOREIGN TABLE cx_users (
    id              uuid,
    email           text,
    display_name    text,
    role            text,
    quota_bytes     bigint,
    is_active       boolean
)
    SERVER cx_main
    OPTIONS (schema_name 'public', table_name 'users');

-- SOGo expects the view to look exactly like a users directory.
CREATE OR REPLACE VIEW sogo_users AS
SELECT
    email           AS c_uid,
    email           AS c_name,
    -- IMAP-authenticated; SOGo just needs a non-null placeholder.
    'imap-auth'     AS c_password,
    display_name    AS c_cn,
    email           AS mail
FROM cx_users
WHERE is_active = true;

GRANT SELECT ON sogo_users TO sogo;
