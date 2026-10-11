-- V3__purchasing_and_expenses.sql: Migration for Suppliers, Purchases, and Operational Expenses

-- 1. Suppliers
CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_suppliers_tenant_id ON suppliers(tenant_id);

-- 2. Purchases (Pembelian Bahan Baku Masuk)
CREATE TABLE purchases (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    outlet_id BIGINT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(15,2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'PAID', -- PAID, UNPAID, PARTIAL
    payment_method VARCHAR(50) DEFAULT 'CASH', -- CASH, TRANSFER, CREDIT
    status VARCHAR(50) DEFAULT 'RECEIVED',     -- RECEIVED, DRAFT, CANCELLED
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_purchases_tenant_id ON purchases(tenant_id);
CREATE INDEX idx_purchases_outlet_id ON purchases(outlet_id);
CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_purchases_purchase_date ON purchases(purchase_date);

-- 3. Purchase Items
CREATE TABLE purchase_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC(15,2) NOT NULL,
    unit_cost NUMERIC(15,2) NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL
);
CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_ingredient_id ON purchase_items(ingredient_id);

-- 4. Operational Expenses (Biaya Pengeluaran Harian)
CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    outlet_id BIGINT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- UTILITY, SALARY, RENT, MAINTENANCE, MARKETING, SUPPLIES, OTHER
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CASH', -- CASH, TRANSFER
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    receipt_ref VARCHAR(100),
    recorded_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX idx_expenses_outlet_id ON expenses(outlet_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
