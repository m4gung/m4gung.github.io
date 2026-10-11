-- V4__idempotency_and_audit_trail.sql: Idempotency keys and User Activity Audit Trail

-- 1. Idempotency Keys (Mencegah transaksi ganda & duplikasi sync)
CREATE TABLE idempotency_keys (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(150) NOT NULL,
    endpoint VARCHAR(200) NOT NULL,
    request_hash VARCHAR(100),
    response_code INT,
    response_body TEXT,
    status VARCHAR(30) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_tenant_idempotency_key UNIQUE (tenant_id, idempotency_key)
);
CREATE INDEX idx_idempotency_tenant_key ON idempotency_keys(tenant_id, idempotency_key);
CREATE INDEX idx_idempotency_created_at ON idempotency_keys(created_at);

-- 2. Audit Trail Logs (Pencatatan riwayat aktivitas operasional penting)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,       -- CREATE, UPDATE, DELETE, VOID, STOCK_ADJUST, PRICE_CHANGE, LOGIN
    entity_type VARCHAR(100) NOT NULL,  -- ORDER, PRODUCT, INGREDIENT, EXPENSE, USER, SETTING
    entity_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
