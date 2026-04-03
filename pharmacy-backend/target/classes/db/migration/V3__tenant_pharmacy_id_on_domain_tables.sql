-- Hibernate ddl-auto=update often adds FKs before columns on existing tables.
-- Adds pharmacy_id + FK + indexes for all tenant-scoped tables (same pattern as users).
--
-- Flyway runs before Hibernate: `pharmacies` may not exist yet on a fresh DB — create it here
-- so this migration (and FK targets) always succeed. Hibernate will align the table afterward.

CREATE TABLE IF NOT EXISTS pharmacies
(
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(100)  NOT NULL,
    country_code VARCHAR(2)    NOT NULL,
    phone_e164   VARCHAR(20)   NOT NULL,
    email        VARCHAR(255)  NOT NULL,
    logo_path    VARCHAR(500),
    address      VARCHAR(250)  NOT NULL,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pharmacies_email ON pharmacies (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pharmacies_name ON pharmacies (name);

INSERT INTO pharmacies (name, country_code, phone_e164, email, address, created_at)
SELECT 'Migrated legacy pharmacy',
       'US',
       '+10000000000',
       'legacy.placeholder@migrated.local',
       'Flyway: default tenant for migrated rows.',
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM pharmacies WHERE email = 'legacy.placeholder@migrated.local');

DO $main$
DECLARE
    legacy_id BIGINT;
    r           RECORD;
BEGIN
    SELECT id
    INTO legacy_id
    FROM pharmacies
    WHERE email = 'legacy.placeholder@migrated.local'
    LIMIT 1;

    IF legacy_id IS NULL THEN
        SELECT MIN(id) INTO legacy_id FROM pharmacies;
    END IF;

    IF legacy_id IS NULL THEN
        RAISE NOTICE 'V3: no pharmacies row — skip pharmacy_id backfill (create a pharmacy first).';
    ELSE
        -- ---------- suppliers ----------
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers')
            AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'pharmacy_id')
        THEN
            ALTER TABLE suppliers ADD COLUMN pharmacy_id BIGINT;
            UPDATE suppliers SET pharmacy_id = legacy_id WHERE pharmacy_id IS NULL;
            ALTER TABLE suppliers ALTER COLUMN pharmacy_id SET NOT NULL;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_suppliers_pharmacy') THEN
                ALTER TABLE suppliers
                    ADD CONSTRAINT fk_suppliers_pharmacy FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id);
            END IF;
            CREATE INDEX IF NOT EXISTS idx_suppliers_pharmacy ON suppliers (pharmacy_id);
        END IF;

        -- ---------- products (drop old global barcode unique, then composite) ----------
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products')
            AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'pharmacy_id')
        THEN
            FOR r IN
                SELECT c.conname AS cname, pg_get_constraintdef(c.oid) AS def
                FROM pg_constraint c
                         INNER JOIN pg_class cl ON cl.oid = c.conrelid
                WHERE cl.relname = 'products'
                  AND c.contype = 'u'
                LOOP
                    IF r.def LIKE '%barcode%' AND r.def NOT LIKE '%pharmacy_id%' THEN
                        EXECUTE format('ALTER TABLE products DROP CONSTRAINT %I', r.cname);
                    END IF;
                END LOOP;

            ALTER TABLE products ADD COLUMN pharmacy_id BIGINT;
            UPDATE products SET pharmacy_id = legacy_id WHERE pharmacy_id IS NULL;
            ALTER TABLE products ALTER COLUMN pharmacy_id SET NOT NULL;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_pharmacy') THEN
                ALTER TABLE products
                    ADD CONSTRAINT fk_products_pharmacy FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id);
            END IF;
            CREATE INDEX IF NOT EXISTS idx_products_pharmacy ON products (pharmacy_id);
            CREATE UNIQUE INDEX IF NOT EXISTS uk_product_pharmacy_barcode ON products (pharmacy_id, barcode);
        END IF;

        -- ---------- sales (prefer cashier user's pharmacy) ----------
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales')
            AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'pharmacy_id')
        THEN
            ALTER TABLE sales ADD COLUMN pharmacy_id BIGINT;
            UPDATE sales s
            SET pharmacy_id = u.pharmacy_id
            FROM users u
            WHERE s.user_id = u.id
              AND s.pharmacy_id IS NULL;
            UPDATE sales SET pharmacy_id = legacy_id WHERE pharmacy_id IS NULL;
            ALTER TABLE sales ALTER COLUMN pharmacy_id SET NOT NULL;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sales_pharmacy') THEN
                ALTER TABLE sales
                    ADD CONSTRAINT fk_sales_pharmacy FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id);
            END IF;
            CREATE INDEX IF NOT EXISTS idx_sales_pharmacy ON sales (pharmacy_id);
        END IF;

        -- ---------- audit_logs ----------
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs')
            AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'pharmacy_id')
        THEN
            ALTER TABLE audit_logs ADD COLUMN pharmacy_id BIGINT;
            UPDATE audit_logs SET pharmacy_id = legacy_id WHERE pharmacy_id IS NULL;
            ALTER TABLE audit_logs ALTER COLUMN pharmacy_id SET NOT NULL;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_audit_logs_pharmacy') THEN
                ALTER TABLE audit_logs
                    ADD CONSTRAINT fk_audit_logs_pharmacy FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id);
            END IF;
            CREATE INDEX IF NOT EXISTS idx_audit_pharmacy ON audit_logs (pharmacy_id);
        END IF;

        -- ---------- stock_movements (derive from product) ----------
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movements')
            AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'pharmacy_id')
        THEN
            ALTER TABLE stock_movements ADD COLUMN pharmacy_id BIGINT;
            UPDATE stock_movements sm
            SET pharmacy_id = p.pharmacy_id
            FROM products p
            WHERE sm.product_id = p.id
              AND sm.pharmacy_id IS NULL
              AND p.pharmacy_id IS NOT NULL;
            UPDATE stock_movements SET pharmacy_id = legacy_id WHERE pharmacy_id IS NULL;
            ALTER TABLE stock_movements ALTER COLUMN pharmacy_id SET NOT NULL;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_stock_movements_pharmacy') THEN
                ALTER TABLE stock_movements
                    ADD CONSTRAINT fk_stock_movements_pharmacy FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id);
            END IF;
            CREATE INDEX IF NOT EXISTS idx_stock_mv_pharmacy ON stock_movements (pharmacy_id);
        END IF;
    END IF;
END $main$;
