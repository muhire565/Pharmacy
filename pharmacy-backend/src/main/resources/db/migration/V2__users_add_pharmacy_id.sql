-- Multi-tenant users require pharmacy_id FK. Older schemas only had id, username, password, role, etc.

DO $m$
DECLARE
    legacy_pharmacy_id BIGINT;
    has_pharmacies    BOOLEAN;
    has_users         BOOLEAN;
    need_pharmacy_col BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'users'
    ) INTO has_users;

    IF NOT has_users THEN
        NULL;
    ELSE
        SELECT NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'pharmacy_id'
        ) INTO need_pharmacy_col;

        IF need_pharmacy_col THEN
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'pharmacies'
            ) INTO has_pharmacies;

            IF has_pharmacies THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pharmacies WHERE email = 'legacy.placeholder@migrated.local'
                ) THEN
                    INSERT INTO pharmacies (name, country_code, phone_e164, email, address, created_at)
                    VALUES (
                        'Migrated legacy pharmacy',
                        'US',
                        '+10000000000',
                        'legacy.placeholder@migrated.local',
                        'Holds pre-migration users; safe to delete after reassigning users.',
                        NOW()
                    );
                END IF;

                SELECT id
                INTO legacy_pharmacy_id
                FROM pharmacies
                WHERE email = 'legacy.placeholder@migrated.local'
                LIMIT 1;

                IF legacy_pharmacy_id IS NULL THEN
                    SELECT MIN(id) INTO legacy_pharmacy_id FROM pharmacies;
                END IF;

                IF legacy_pharmacy_id IS NOT NULL THEN
                    ALTER TABLE users ADD COLUMN pharmacy_id BIGINT;

                    UPDATE users
                    SET username = LEFT(
                            REGEXP_REPLACE(
                                    id::text || '_' || COALESCE(NULLIF(TRIM(username), ''), 'user'),
                                    '[^a-zA-Z0-9_]',
                                    '_',
                                    'g'
                            ),
                            64
                    );

                    UPDATE users
                    SET pharmacy_id = legacy_pharmacy_id
                    WHERE pharmacy_id IS NULL;

                    ALTER TABLE users
                        ALTER COLUMN pharmacy_id SET NOT NULL;

                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'fk_users_pharmacy'
                    ) THEN
                        ALTER TABLE users
                            ADD CONSTRAINT fk_users_pharmacy
                                FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id);
                    END IF;

                    CREATE UNIQUE INDEX IF NOT EXISTS uk_users_pharmacy_username ON users (pharmacy_id, username);
                END IF;
            END IF;
        END IF;
    END IF;
END $m$;
