-- Migration: Add customer_type, notes, lat, lng to clients table
-- Run this in Supabase SQL Editor

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS customer_type TEXT CHECK (customer_type IN ('customer', 'company', 'government')),
  ADD COLUMN IF NOT EXISTS notes         TEXT,
  ADD COLUMN IF NOT EXISTS lat           DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng           DOUBLE PRECISION;
