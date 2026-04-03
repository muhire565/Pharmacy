-- Adds locking fields for owner-managed tenant suspension.

DO $m$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pharmacies') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pharmacies' AND column_name = 'locked') THEN
            ALTER TABLE pharmacies ADD COLUMN locked BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pharmacies' AND column_name = 'locked_reason') THEN
            ALTER TABLE pharmacies ADD COLUMN locked_reason VARCHAR(500);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pharmacies' AND column_name = 'locked_at') THEN
            ALTER TABLE pharmacies ADD COLUMN locked_at TIMESTAMPTZ;
        END IF;
    END IF;
END $m$;

