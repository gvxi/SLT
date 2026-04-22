-- ============================================================
-- SLT Business Management App — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Updated_at trigger helper
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  lang_preference TEXT NOT NULL DEFAULT 'en' CHECK (lang_preference IN ('en', 'ar')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- ============================================================
-- 2. clients
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en       TEXT NOT NULL,
  name_ar       TEXT,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  customer_type TEXT CHECK (customer_type IN ('customer', 'company', 'government')),
  notes         TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku           TEXT NOT NULL UNIQUE,
  name_en       TEXT NOT NULL,
  name_ar       TEXT,
  category      TEXT,
  unit_price    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock_qty     INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS products_sku_idx ON products(sku);
CREATE INDEX IF NOT EXISTS products_created_by_idx ON products(created_by);

-- ============================================================
-- 4. tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'review', 'done')),
  priority      TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date      DATE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_assignee_id_idx ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS tasks_created_by_idx ON tasks(created_by);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);

-- ============================================================
-- 5. task_checklists
-- ============================================================
CREATE TABLE IF NOT EXISTS task_checklists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  is_done       BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_checklists_task_id_idx ON task_checklists(task_id);

-- ============================================================
-- 6. invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number   TEXT UNIQUE,
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  tax_pct          NUMERIC(5, 2) NOT NULL DEFAULT 0,
  discount         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes_en         TEXT,
  notes_ar         TEXT,
  created_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS invoices_client_id_idx ON invoices(client_id);
CREATE INDEX IF NOT EXISTS invoices_created_by_idx ON invoices(created_by);
CREATE INDEX IF NOT EXISTS invoices_issue_date_idx ON invoices(issue_date);

-- ============================================================
-- 7. invoice_items
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  description   TEXT NOT NULL DEFAULT '',
  qty           NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_price    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON invoice_items(invoice_id);

-- ============================================================
-- 8. quotations
-- ============================================================
CREATE TABLE IF NOT EXISTS quotations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number     TEXT UNIQUE,
  client_id            UUID REFERENCES clients(id) ON DELETE SET NULL,
  status               TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  issue_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date          DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  tax_pct              NUMERIC(5, 2) NOT NULL DEFAULT 0,
  discount             NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes_en             TEXT,
  notes_ar             TEXT,
  created_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  converted_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS quotations_status_idx ON quotations(status);
CREATE INDEX IF NOT EXISTS quotations_client_id_idx ON quotations(client_id);
CREATE INDEX IF NOT EXISTS quotations_created_by_idx ON quotations(created_by);

-- ============================================================
-- 9. quotation_items
-- ============================================================
CREATE TABLE IF NOT EXISTS quotation_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id    UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  description     TEXT NOT NULL DEFAULT '',
  qty             NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quotation_items_quotation_id_idx ON quotation_items(quotation_id);
