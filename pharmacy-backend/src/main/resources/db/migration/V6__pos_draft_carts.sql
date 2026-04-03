CREATE TABLE IF NOT EXISTS pos_draft_carts (
    pharmacy_id BIGINT NOT NULL PRIMARY KEY REFERENCES pharmacies (id) ON DELETE CASCADE,
    lines_json  TEXT        NOT NULL DEFAULT '[]',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
