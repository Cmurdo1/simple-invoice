// Custom types for the application

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Profile {
  id: string;
  business_name: string | null;
  logo_url: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
  tax_rate: number;
  brand_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  invoice_number: string | null;
  status: InvoiceStatus;
  total_amount: number;
  tax_amount: number;
  notes: string | null;
  job_description: string | null;
  due_date: string | null;
  feedback_token: string | null;
  created_at: string;
  updated_at: string;
  client?: Client | null;
  invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
  created_at: string;
}

export interface InvoiceFeedback {
  id: string;
  invoice_id: string;
  rating: number | null;
  comment: string | null;
  client_name: string | null;
  created_at: string;
}

export interface ExtractedLineItem {
  description: string;
  quantity: number;
  unit_price: number;
}
