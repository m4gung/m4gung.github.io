-- ==============================================================
-- V1__init_schema.sql : Initial Database Schema
-- Barbershop Management System (Multi-Outlet Support)
-- ==============================================================

-- 1. Branches Table (Cabang Toko / Outlet)
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    manager_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Shop Settings Table
CREATE TABLE IF NOT EXISTS shop_settings (
    id VARCHAR(50) PRIMARY KEY,
    shop_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    receipt_footer TEXT,
    storage_mode VARCHAR(30) DEFAULT 'GOOGLE_SHEETS',
    google_apps_script_url TEXT,
    default_commission_type VARCHAR(20) DEFAULT 'PERCENTAGE',
    default_commission_value NUMERIC(10, 2) DEFAULT 35.00,
    default_daily_meal_allowance NUMERIC(12, 2) DEFAULT 20000.00,
    auto_meal_allowance_on_attendance BOOLEAN DEFAULT TRUE,
    active_branch_id VARCHAR(50) REFERENCES branches(id),
    currency VARCHAR(10) DEFAULT 'IDR',
    timezone VARCHAR(50) DEFAULT 'Asia/Makassar',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Services Table
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    duration_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Products Retail Table (Pomade, Clay, Tonic, dll)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) REFERENCES branches(id),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(12, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Barbers Table
CREATE TABLE IF NOT EXISTS barbers (
    id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) REFERENCES branches(id),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    commission_type VARCHAR(20) DEFAULT 'DEFAULT',
    commission_value NUMERIC(10, 2) DEFAULT 0,
    daily_meal_allowance NUMERIC(12, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    join_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    haircut_notes TEXT,
    total_visits INT DEFAULT 0,
    total_spent NUMERIC(15, 2) DEFAULT 0,
    last_visit_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Attendances Table
CREATE TABLE IF NOT EXISTS attendances (
    id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) REFERENCES branches(id),
    barber_id VARCHAR(50) NOT NULL REFERENCES barbers(id),
    attendance_date DATE NOT NULL,
    check_in_time VARCHAR(20),
    check_out_time VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    meal_allowance_granted BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_barber_date UNIQUE (barber_id, attendance_date)
);

-- 8. Staff Allowances Table (Uang Makan, Bonus, Tips)
CREATE TABLE IF NOT EXISTS staff_allowances (
    id VARCHAR(50) PRIMARY KEY,
    barber_id VARCHAR(50) NOT NULL REFERENCES barbers(id),
    allowance_date DATE NOT NULL,
    type VARCHAR(30) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) REFERENCES branches(id),
    branch_name VARCHAR(100),
    idempotency_key VARCHAR(100) UNIQUE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(50) REFERENCES customers(id),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(30),
    cashier_name VARCHAR(100) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    discount_amount NUMERIC(15, 2) DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    amount_paid NUMERIC(15, 2) NOT NULL,
    change_amount NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    cancellation_reason TEXT,
    raw_items_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Transaction Items Table (Snapshot Jasa & Produk)
CREATE TABLE IF NOT EXISTS transaction_items (
    id VARCHAR(50) PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL, -- 'SERVICE' atau 'PRODUCT'
    reference_id VARCHAR(50) NOT NULL,
    name_snapshot VARCHAR(100) NOT NULL,
    price_snapshot NUMERIC(12, 2) NOT NULL,
    cost_price_snapshot NUMERIC(12, 2) DEFAULT 0,
    quantity INT NOT NULL DEFAULT 1,
    barber_id VARCHAR(50) REFERENCES barbers(id),
    barber_name_snapshot VARCHAR(100),
    calculated_commission NUMERIC(12, 2) DEFAULT 0,
    subtotal NUMERIC(15, 2) NOT NULL
);

-- 11. Expenses Table (Pengeluaran Toko)
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) REFERENCES branches(id),
    expense_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    recorded_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_branch ON transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(attendance_date);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
