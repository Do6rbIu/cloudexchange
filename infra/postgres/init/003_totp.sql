-- Cloud24 Exchange · schema v3 — two-factor authentication (TOTP)
--
-- One row per user who has set up an authenticator app. The secret is
-- stored encrypted at the application layer (AES-256-GCM with a key
-- derived from SESSION_SECRET) — never in plaintext.

CREATE TABLE IF NOT EXISTS user_totp (
    email          citext PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
    -- AES-256-GCM payload: iv:authTag:ciphertext, all hex-encoded.
    secret_enc     text NOT NULL,
    -- TOTP becomes mandatory at login only once confirmed.
    confirmed      boolean NOT NULL DEFAULT false,
    -- bcrypt hashes of one-time backup codes, JSON array of strings.
    backup_codes   jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at     timestamptz NOT NULL DEFAULT now(),
    confirmed_at   timestamptz
);

CREATE INDEX IF NOT EXISTS user_totp_confirmed_idx ON user_totp (email) WHERE confirmed;
