-- NWB.CREATIVE Orders Table Schema
-- Run this in Supabase SQL Editor

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    judul VARCHAR(500) NOT NULL,
    konsep TEXT NOT NULL,
    teks_tambahan TEXT,
    logo TEXT,
    warna VARCHAR(100),
    ukuran VARCHAR(50),
    info_lainnya TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'revision', 'completed', 'cancelled')),
    price DECIMAL(12,0) DEFAULT NULL,
    estimated_duration INTEGER DEFAULT NULL,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster order number lookups
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (for order tracking)
CREATE POLICY "Allow anonymous read" ON orders
    FOR SELECT USING (true);

-- Allow anonymous insert (for order creation)
CREATE POLICY "Allow anonymous insert" ON orders
    FOR INSERT WITH CHECK (true);

-- Allow anonymous update (for admin - temporary, should use auth later)
CREATE POLICY "Allow anonymous update" ON orders
    FOR UPDATE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SITE SETTINGS TABLE (for logo, etc)
-- =============================================
CREATE TABLE site_settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default settings
INSERT INTO site_settings (key, value) VALUES 
    ('logo_url', NULL),
    ('site_name', 'NWB.CREATIVE');

-- RLS for site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update settings" ON site_settings FOR UPDATE USING (true);

-- =============================================
-- PORTFOLIO TABLE (for work images)
-- =============================================
CREATE TABLE portfolio (
    id BIGSERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    title VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- RLS for portfolio
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read portfolio" ON portfolio FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert portfolio" ON portfolio FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update portfolio" ON portfolio FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete portfolio" ON portfolio FOR DELETE USING (true);

-- =============================================
-- ORDER MEDIA TABLE (for order attachments/references)
-- =============================================
CREATE TABLE order_media (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    uploaded_by VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for faster order lookups
CREATE INDEX idx_order_media_order_id ON order_media(order_id);

-- RLS for order_media
ALTER TABLE order_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read order_media" ON order_media FOR SELECT USING (true);
CREATE POLICY "Allow insert order_media" ON order_media FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete order_media" ON order_media FOR DELETE USING (true);
