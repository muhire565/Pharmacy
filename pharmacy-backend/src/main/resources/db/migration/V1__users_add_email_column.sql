-- Existing DBs may have `users` without `email` (Hibernate ddl-auto=update often skips new columns).
-- On an empty database this block is skipped; Hibernate then creates the full `users` table.

DO $migration$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'users'
    )
        AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'email'
        ) THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255);
        UPDATE users
        SET email = 'user_' || id::text || '@migrated.pharmacy.local'
        WHERE email IS NULL;
        ALTER TABLE users ALTER COLUMN email SET NOT NULL;
    END IF;
END $migration$;
