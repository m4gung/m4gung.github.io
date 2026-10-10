-- V1: Inisialisasi Skema Inti Toko (Pengguna, Produk, Stok, Kasir, dan Pengaturan)

-- 1. Pengguna & Autentikasi
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'CASHIER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default:
-- owner / owner123 (BCrypt: $2a$10$w3dEomrC5c29g6HfZHsmgeG5H.p6iQ1d5r0/vO7V1iLwE9UjZgSjG)
-- cashier / cashier123 (BCrypt: $2a$10$r8x7Cj.x3Y1jO4/L6h5i2u4L4d5r0/vO7V1iLwE9UjZgSjG6kL)
INSERT INTO users (id, username, password_hash, full_name, role, is_active)
VALUES 
    ('USR-001', 'owner', '$2a$10$779i1z0i3JqCvyxLhQn1U.n7j0qVlTvhxHk48a54rLg3Q9sI5x22K', 'Pemilik Toko', 'OWNER', TRUE),
    ('USR-002', 'cashier', '$2a$10$779i1z0i3JqCvyxLhQn1U.n7j0qVlTvhxHk48a54rLg3Q9sI5x22K', 'Kasir Utama', 'CASHIER', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 2. Kategori Produk
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Produk & Persediaan
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    category_id VARCHAR(36) REFERENCES categories(id) ON DELETE SET NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'Pcs',
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);

-- 4. Riwayat Mutasi Stok
CREATE TABLE stock_mutations (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('IN_PURCHASE', 'OUT_SALE', 'ADJUSTMENT', 'RETURN')),
    quantity INTEGER NOT NULL,
    reference_no VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Pelanggan & Limit Kredit
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 5000000.00,
    current_debt NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Transaksi Penjualan Kasir
CREATE TABLE sales (
    id VARCHAR(36) PRIMARY KEY,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(36) REFERENCES customers(id),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    final_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cash_received NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    change_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('CASH', 'QRIS', 'TRANSFER', 'CREDIT')),
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('PAID', 'PARTIAL', 'UNPAID')),
    notes TEXT,
    due_date DATE,
    cashier_id VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_invoice ON sales(invoice_no);
CREATE INDEX idx_sales_date ON sales(created_at);

-- 7. Item Penjualan
CREATE TABLE sale_items (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00
);

-- 8. Pengaturan Toko & Integrasi QRIS / Bank
CREATE TABLE store_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO store_settings (setting_key, setting_value) VALUES
    ('store_name', 'Toko Berkah Bersama'),
    ('store_phone', '081234567890'),
    ('store_address', 'Jl. Trans Sulawesi No. 12, Kolaka'),
    ('bank_name', 'BCA'),
    ('bank_account_no', '1234567890'),
    ('bank_account_holder', 'Agung Maulana'),
    ('qris_image_url', ''),
    ('qris_string', '')
ON CONFLICT (setting_key) DO NOTHING;
