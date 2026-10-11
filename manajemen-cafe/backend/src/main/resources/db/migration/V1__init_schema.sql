-- V1__init_schema.sql: Initial Schema for Cafe Management System (Multi-Tenant & Multi-Outlet)

-- 1. Tenants (SaaS Accounts)
CREATE TABLE tenants (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    plan VARCHAR(30) DEFAULT 'FREE',
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Outlets (Branches per Tenant)
CREATE TABLE outlets (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    receipt_header TEXT,
    receipt_footer TEXT,
    tax_percentage NUMERIC(5,2) DEFAULT 0.00,
    service_charge_percentage NUMERIC(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_outlets_tenant_id ON outlets(tenant_id);

-- 3. Users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    outlet_id BIGINT REFERENCES outlets(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL, -- OWNER, ADMIN, CASHIER, BARISTA
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_username UNIQUE (tenant_id, username),
    CONSTRAINT uq_tenant_email UNIQUE (tenant_id, email)
);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_outlet_id ON users(outlet_id);

-- 4. Categories
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_categories_tenant_id ON categories(tenant_id);

-- 5. Products
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    image_url TEXT,
    base_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_category_id ON products(category_id);

-- 6. Product Variants
CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_adjustment NUMERIC(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_variants_product_id ON product_variants(product_id);

-- 7. Modifiers
CREATE TABLE modifiers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_modifiers_tenant_id ON modifiers(tenant_id);

-- 8. Dining Tables
CREATE TABLE dining_tables (
    id BIGSERIAL PRIMARY KEY,
    outlet_id BIGINT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 4,
    status VARCHAR(30) DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, RESERVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_dining_tables_outlet_id ON dining_tables(outlet_id);

-- 9. Orders
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    outlet_id BIGINT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    order_type VARCHAR(30) NOT NULL DEFAULT 'DINE_IN', -- DINE_IN, TAKEAWAY
    table_id BIGINT REFERENCES dining_tables(id) ON DELETE SET NULL,
    cashier_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(50),
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15,2) DEFAULT 0.00,
    tax_amount NUMERIC(15,2) DEFAULT 0.00,
    service_charge_amount NUMERIC(15,2) DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PAID', -- PENDING_PAYMENT, PAID, IN_PREPARATION, READY, COMPLETED, CANCELLED
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_outlet_id ON orders(outlet_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 10. Order Items
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot VARCHAR(150) NOT NULL,
    variant_name_snapshot VARCHAR(100),
    unit_price_snapshot NUMERIC(15,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal NUMERIC(15,2) NOT NULL,
    notes TEXT
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 11. Payments
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL, -- CASH, BANK_TRANSFER, QRIS, DEBIT
    amount_paid NUMERIC(15,2) NOT NULL,
    change_amount NUMERIC(15,2) DEFAULT 0.00,
    reference_number VARCHAR(100),
    status VARCHAR(30) DEFAULT 'SUCCESS',
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_payments_order_id ON payments(order_id);

-- 12. Sync Logs / Queue
CREATE TABLE sync_records (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    outlet_id BIGINT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    client_sync_id VARCHAR(100) UNIQUE NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'SYNCED',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sync_records_tenant_id ON sync_records(tenant_id);
