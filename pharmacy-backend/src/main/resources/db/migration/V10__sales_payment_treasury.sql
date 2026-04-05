ALTER TABLE sales
    ADD COLUMN payment_method VARCHAR(32) NOT NULL DEFAULT 'CASH';

CREATE INDEX idx_sales_payment ON sales (pharmacy_id, payment_method);

CREATE TABLE treasury_movements (
    id BIGSERIAL PRIMARY KEY,
    pharmacy_id BIGINT NOT NULL REFERENCES pharmacies (id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users (id) ON DELETE SET NULL,
    movement_type VARCHAR(32) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_treasury_ph_created ON treasury_movements (pharmacy_id, created_at DESC);
