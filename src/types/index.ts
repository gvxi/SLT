export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: "user" | "admin";
  lang_preference: "en" | "ar";
  created_at: string;
  updated_at: string;
}

export type CustomerType = "customer" | "company" | "government";

export interface Client {
  id: string;
  name_en: string;
  name_ar: string | null;
  email: string;
  phone: string;
  address: string;
  customer_type: CustomerType | null;
  notes: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name_en: string;
  name_ar: string | null;
  category: string;
  unit_price: number;
  stock_qty: number;
  warning_limit_stock: number;
  status: "active" | "inactive";
  created_by: string;
  created_at: string;
  updated_at: string;
  product_storages?: ProductStorage[];
}

export type TaskStatus = "backlog"| "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskItem {
  id: string;
  task_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
  sort_order: number;
  product?: { id: string; name_en: string; name_ar: string | null; sku: string } | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  product_id: string | null;
  client_id: string | null;
  location: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Optional joined relations (returned by API selects)
  assignee?: { id: string; full_name: string; avatar_url: string | null } | null;
  product?: { id: string; name_en: string; name_ar: string | null; sku: string } | null;
  client?: { id: string; name_en: string; name_ar: string | null; phone?: string } | null;
  internal_notes: string | null;
  task_checklists?: TaskChecklist[];
  task_items?: TaskItem[];
}

export interface TaskChecklist {
  id: string;
  task_id: string;
  label: string;
  is_done: boolean;
  sort_order: number;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  tax_pct: number;
  discount: number;
  upfront_payment: number;
  location: string | null;
  phone_number: string | null;
  notes_en: string | null;
  notes_ar: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined relations
  client?: Client | null;
  invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
  sort_order: number;
  // Joined
  product?: { id: string; name_en: string; name_ar: string | null; sku: string } | null;
}

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface Quotation {
  id: string;
  quotation_number: string;
  client_id: string | null;
  status: QuotationStatus;
  issue_date: string;
  expiry_date: string;
  tax_pct: number;
  discount: number;
  notes_en: string | null;
  notes_ar: string | null;
  created_by: string;
  converted_invoice_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  client?: Client | null;
  quotation_items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
  sort_order: number;
  product?: { id: string; name_en: string; name_ar: string | null; sku: string } | null;
}

// Shared draft type for line item editing
export interface LineItemDraft {
  product_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
}

// ============================================================
// Storage / Warehouse management
// ============================================================

export interface Storage {
  id: string;
  name_en: string;
  name_ar: string | null;
  icon: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  /** Distinct products with qty > 0 in this storage */
  item_count?: number;
  /** Sum of qty across all products in this storage */
  qty_count?: number;
}

export interface ProductStorage {
  id: string;
  product_id: string;
  storage_id: string;
  qty: number;
  product?: {
    id: string;
    sku: string;
    name_en: string;
    name_ar: string | null;
    category: string;
    unit_price: number;
  } | null;
  storage?: Storage | null;
}

export interface StorageTransfer {
  id: string;
  transfer_number: string;
  from_storage_id: string;
  to_storage_id: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  from_storage?: Pick<Storage, "id" | "name_en" | "name_ar" | "icon"> | null;
  to_storage?: Pick<Storage, "id" | "name_en" | "name_ar" | "icon"> | null;
  storage_transfer_items?: StorageTransferItem[];
  creator?: { id: string; full_name: string } | null;
}

export interface StorageTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  qty: number;
  sort_order: number;
  created_at: string;
  product?: {
    id: string;
    sku: string;
    name_en: string;
    name_ar: string | null;
    category: string;
    unit_price: number;
  } | null;
}
