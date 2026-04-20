-- Add upfront_payment, location, phone_number to invoices table
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS upfront_payment NUMERIC(12,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT;
