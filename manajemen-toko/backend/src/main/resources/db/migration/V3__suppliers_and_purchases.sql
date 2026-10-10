-- V3: Skema Modul Supplier & Transaksi Pembelian Barang (Pengadaan Stok)

-- 1. Master Data Supplier
CREATE TABLE suppliers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Contoh Supplier Default
INSERT INTO suppliers (id, name, phone, address, is_active) VALUES
    ('SUP-001', 'PT Sumber Pangan Makmur', '081122334455', 'Kawasan Industri Pergudangan No. 8', TRUE),
    ('SUP-002', 'CV Berkah Retail Utama', '081299887711', 'Jl. Niaga Sentra Blok C-2', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Transaksi Pembelian Barang (Purchase Orders)
CREATE TABLE purchases (
    id VARCHAR(36) PRIMARY KEY,
    purchase_no VARCHAR(50) UNIQUE NOT NULL,
    supplier_id VARCHAR(36) REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(150) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('CASH', 'TRANSFER', 'CREDIT')),
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('PAID', 'UNPAID')),
    due_date DATE,
    notes TEXT,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchases_no ON purchases(purchase_no);
CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_purchases_date ON purchases(created_at);

-- 3. Detail Item Pembelian
CREATE TABLE purchase_items (
    id VARCHAR(36) PRIMARY KEY,
    purchase_id VARCHAR(36) NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00
);
