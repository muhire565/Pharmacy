CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    pharmacy_id BIGINT NOT NULL REFERENCES pharmacies (id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users (id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    amount NUMERIC(14, 2) NOT NULL,
    incurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_pharmacy_incurred ON expenses (pharmacy_id, incurred_at DESC);
