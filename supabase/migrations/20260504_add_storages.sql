-- ============================================================
-- Storage / warehouse management
-- ============================================================

-- 1. storages
CREATE TABLE IF NOT EXISTS storages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en     TEXT NOT NULL,
  name_ar     TEXT,
  icon        TEXT NOT NULL DEFAULT 'Warehouse',
  description TEXT,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER storages_updated_at
  BEFORE UPDATE ON storages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS storages_created_by_idx ON storages(created_by);

-- 2. product_storages (per-location quantity)
CREATE TABLE IF NOT EXISTS product_storages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_id UUID NOT NULL REFERENCES storages(id) ON DELETE RESTRICT,
  qty        INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, storage_id)
);

CREATE INDEX IF NOT EXISTS product_storages_product_id_idx ON product_storages(product_id);
CREATE INDEX IF NOT EXISTS product_storages_storage_id_idx ON product_storages(storage_id);

-- 3. transfer_number_seq
CREATE TABLE IF NOT EXISTS transfer_number_seq (
  year    INTEGER NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (year)
);

-- 4. storage_transfers
CREATE TABLE IF NOT EXISTS storage_transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT UNIQUE,
  from_storage_id UUID NOT NULL REFERENCES storages(id) ON DELETE RESTRICT,
  to_storage_id   UUID NOT NULL REFERENCES storages(id) ON DELETE RESTRICT,
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT storage_transfers_diff_storages CHECK (from_storage_id <> to_storage_id)
);

CREATE INDEX IF NOT EXISTS storage_transfers_from_idx       ON storage_transfers(from_storage_id);
CREATE INDEX IF NOT EXISTS storage_transfers_to_idx         ON storage_transfers(to_storage_id);
CREATE INDEX IF NOT EXISTS storage_transfers_created_by_idx ON storage_transfers(created_by);

-- 5. storage_transfer_items
CREATE TABLE IF NOT EXISTS storage_transfer_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES storage_transfers(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty         INTEGER NOT NULL CHECK (qty > 0),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS storage_transfer_items_transfer_id_idx ON storage_transfer_items(transfer_id);

-- 6. Auto-number function + trigger (matches invoice/quotation pattern)
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

-- 7. Extend profiles.start_page to include 'storages'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_start_page_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_start_page_check
    CHECK (start_page IN ('dashboard','tasks','products','storages','invoices','quotations','customers','settings'));

-- 8. RLS
ALTER TABLE storages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_storages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_transfers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_transfer_items ENABLE ROW LEVEL SECURITY;

-- storages: all authenticated read; creator or admin write
CREATE POLICY "storages_select_authenticated"
  ON storages FOR SELECT TO authenticated USING (true);

CREATE POLICY "storages_insert_authenticated"
  ON storages FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "storages_update_own_or_admin"
  ON storages FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "storages_delete_own_or_admin"
  ON storages FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- product_storages: shared global resource — all authenticated can read/write
CREATE POLICY "product_storages_select_authenticated"
  ON product_storages FOR SELECT TO authenticated USING (true);

CREATE POLICY "product_storages_insert_authenticated"
  ON product_storages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "product_storages_update_authenticated"
  ON product_storages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "product_storages_delete_authenticated"
  ON product_storages FOR DELETE TO authenticated USING (true);

-- storage_transfers: all authenticated read; creator inserts
CREATE POLICY "storage_transfers_select_authenticated"
  ON storage_transfers FOR SELECT TO authenticated USING (true);

CREATE POLICY "storage_transfers_insert_authenticated"
  ON storage_transfers FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- storage_transfer_items: all authenticated read; inherits parent transfer access
CREATE POLICY "storage_transfer_items_select_authenticated"
  ON storage_transfer_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "storage_transfer_items_insert_transfer_access"
  ON storage_transfer_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM storage_transfers
      WHERE storage_transfers.id = transfer_id
        AND (
          storage_transfers.created_by = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );
