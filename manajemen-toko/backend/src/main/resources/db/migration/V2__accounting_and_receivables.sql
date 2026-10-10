-- V2: Skema Akuntansi Lengkap (Double-Entry Bookkeeping) dan Piutang Kompleks

-- 1. Bagan Akun (Chart of Accounts)
CREATE TABLE chart_of_accounts (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ASET', 'KEWAJIBAN', 'EKUITAS', 'PENDAPATAN', 'BEBAN_HPP', 'BEBAN_OPERASIONAL')),
    normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('DEBIT', 'KREDIT')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Bagan Akun EMKM
INSERT INTO chart_of_accounts (code, name, type, normal_balance) VALUES
    ('1101', 'Kas Toko', 'ASET', 'DEBIT'),
    ('1102', 'Bank', 'ASET', 'DEBIT'),
    ('1103', 'Piutang Usaha', 'ASET', 'DEBIT'),
    ('1201', 'Persediaan Barang Dagang', 'ASET', 'DEBIT'),
    ('2101', 'Utang Usaha', 'KEWAJIBAN', 'KREDIT'),
    ('3101', 'Modal Pemilik', 'EKUITAS', 'KREDIT'),
    ('3201', 'Laba Ditahan', 'EKUITAS', 'KREDIT'),
    ('4101', 'Pendapatan Penjualan', 'PENDAPATAN', 'KREDIT'),
    ('5101', 'Beban Pokok Penjualan (HPP)', 'BEBAN_HPP', 'DEBIT'),
    ('6101', 'Beban Operasional Toko', 'BEBAN_OPERASIONAL', 'DEBIT')
ON CONFLICT (code) DO NOTHING;

-- 2. Header Jurnal Umum
CREATE TABLE journal_entries (
    id VARCHAR(36) PRIMARY KEY,
    entry_no VARCHAR(50) UNIQUE NOT NULL,
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_type VARCHAR(30) NOT NULL, -- 'SALE', 'PURCHASE', 'EXPENSE', 'PAYMENT', 'MANUAL'
    reference_id VARCHAR(100),
    description TEXT,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journal_entry_no ON journal_entries(entry_no);
CREATE INDEX idx_journal_date ON journal_entries(entry_date);

-- 3. Baris Jurnal Double-Entry
CREATE TABLE journal_lines (
    id VARCHAR(36) PRIMARY KEY,
    journal_entry_id VARCHAR(36) NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL REFERENCES chart_of_accounts(code),
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    CONSTRAINT chk_positive_amounts CHECK (debit >= 0 AND credit >= 0),
    CONSTRAINT chk_either_debit_or_credit CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

-- 4. Modul Piutang Pelanggan (Accounts Receivable)
CREATE TABLE receivables (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    invoice_no VARCHAR(50) NOT NULL,
    customer_id VARCHAR(36) NOT NULL REFERENCES customers(id),
    total_amount NUMERIC(15, 2) NOT NULL,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    remaining_amount NUMERIC(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'OVERDUE', 'PAID')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receivables_customer ON receivables(customer_id);
CREATE INDEX idx_receivables_due ON receivables(due_date);

-- 5. Riwayat Pembayaran Cicilan Piutang
CREATE TABLE receivable_payments (
    id VARCHAR(36) PRIMARY KEY,
    receivable_id VARCHAR(36) NOT NULL REFERENCES receivables(id) ON DELETE CASCADE,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('CASH', 'QRIS', 'TRANSFER')),
    notes TEXT,
    received_by VARCHAR(36) REFERENCES users(id)
);
