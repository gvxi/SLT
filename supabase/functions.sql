-- ============================================================
-- SLT Business Management App — Functions & Triggers
-- Run AFTER schema.sql
-- ============================================================

-- ============================================================
-- Auto-number sequence tables
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_number_seq (
  year    INTEGER NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (year)
);

CREATE TABLE IF NOT EXISTS quotation_number_seq (
  year    INTEGER NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (year)
);

-- ============================================================
-- generate_invoice_number()
-- Returns 'INV-YYYY-NNNN', auto-incrementing per calendar year
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_counter  INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM now())::INTEGER;

  INSERT INTO invoice_number_seq (year, counter)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET counter = invoice_number_seq.counter + 1
  RETURNING counter INTO next_counter;

  RETURN 'INV-' || current_year::TEXT || '-' || LPAD(next_counter::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- generate_quotation_number()
-- Returns 'QUO-YYYY-NNNN', auto-incrementing per calendar year
-- ============================================================
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_counter  INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM now())::INTEGER;

  INSERT INTO quotation_number_seq (year, counter)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET counter = quotation_number_seq.counter + 1
  RETURNING counter INTO next_counter;

  RETURN 'QUO-' || current_year::TEXT || '-' || LPAD(next_counter::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Trigger: auto-set invoice_number on INSERT if null
-- ============================================================
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_set_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_invoice_number();

-- ============================================================
-- Trigger: auto-set quotation_number on INSERT if null
-- ============================================================
CREATE OR REPLACE FUNCTION set_quotation_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quotation_number IS NULL THEN
    NEW.quotation_number := generate_quotation_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotations_set_number
  BEFORE INSERT ON quotations
  FOR EACH ROW EXECUTE FUNCTION set_quotation_number();

-- ============================================================
-- handle_new_user()
-- Creates a profile row when a new auth.users record is created
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, lang_preference)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    'user',
    'en'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Auto-number sequence table for storage transfers
-- ============================================================
CREATE TABLE IF NOT EXISTS transfer_number_seq (
  year    INTEGER NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (year)
);

-- ============================================================
-- generate_transfer_number()
-- Returns 'TRF-YYYY-NNNN', auto-incrementing per calendar year
-- ============================================================
CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_counter  INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM now())::INTEGER;

  INSERT INTO transfer_number_seq (year, counter)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET counter = transfer_number_seq.counter + 1
  RETURNING counter INTO next_counter;

  RETURN 'TRF-' || current_year::TEXT || '-' || LPAD(next_counter::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Trigger: auto-set transfer_number on INSERT if null
-- ============================================================
CREATE OR REPLACE FUNCTION set_transfer_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transfer_number IS NULL THEN
    NEW.transfer_number := generate_transfer_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER storage_transfers_set_number
  BEFORE INSERT ON storage_transfers
  FOR EACH ROW EXECUTE FUNCTION set_transfer_number();
