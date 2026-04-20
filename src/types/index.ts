export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: "user" | "admin";
  lang_preference: "en" | "ar";
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name_en: string;
  name_ar: string | null;
  email: string;
  phone: string;
  address: string;
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
  status: "active" | "inactive";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "backlog" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  product_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Optional joined relations (returned by API selects)
  assignee?: { id: string; full_name: string; avatar_url: string | null } | null;
  product?: { id: string; name_en: string; name_ar: string | null; sku: string } | null;
  task_checklists?: TaskChecklist[];
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
  client_id: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  tax_pct: number;
  discount: number;
  notes_en: string | null;
  notes_ar: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
  sort_order: number;
}

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface Quotation {
  id: string;
  quotation_number: string;
  client_id: string;
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
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
  sort_order: number;
}
