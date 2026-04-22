-- Migration: Add start_page to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS start_page TEXT
    CHECK (start_page IN ('dashboard','tasks','products','invoices','quotations','customers','settings')),
  ADD COLUMN IF NOT EXISTS bottom_nav_config JSONB;
