-- Email verification, password reset tokens, TOTP (authenticator app) for MFA
ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN email_verification_token_hash VARCHAR(64),
    ADD COLUMN email_verification_expires_at TIMESTAMPTZ,
    ADD COLUMN password_reset_token_hash VARCHAR(64),
    ADD COLUMN password_reset_expires_at TIMESTAMPTZ,
    ADD COLUMN mfa_secret VARCHAR(64),
    ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN users.mfa_secret IS 'Base32 TOTP shared secret; null when MFA not configured';
