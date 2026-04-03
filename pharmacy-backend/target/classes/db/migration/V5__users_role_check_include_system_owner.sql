-- Existing DBs may have a legacy CHECK constraint that doesn't allow SYSTEM_OWNER.
-- Recreate users_role_check with current enum values.

DO $m$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'users'
    ) THEN
        -- Drop old check constraint if present
        IF EXISTS (
            SELECT 1
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            WHERE t.relname = 'users'
              AND c.conname = 'users_role_check'
        ) THEN
            ALTER TABLE users DROP CONSTRAINT users_role_check;
        END IF;

        -- Ensure current allowed role values
        ALTER TABLE users
            ADD CONSTRAINT users_role_check
                CHECK (role IN ('SYSTEM_OWNER', 'PHARMACY_ADMIN', 'CASHIER'));
    END IF;
END $m$;

