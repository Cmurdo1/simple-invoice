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
  default_late_fee_percent: number;
  brand_color: string | null;
  estimate_color: string | null;
  stripe_customer_id: string | null;
  subscription_status: string | null;
  subscription_end: string | null;
  // Location fields for regional pricing
  zip_code: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  col_multiplier: number | null;
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
  type: 'invoice' | 'estimate';
  total_amount: number;
  tax_amount: number;
  notes: string | null;
  job_description: string | null;
  due_date: string | null;
  feedback_token: string | null;
  sent_count: number;
  late_fee_percent: number | null;
  parent_invoice_id: string | null;
  is_deposit: boolean;
  deposit_percent: number | null;
  last_reminder_sent_at: string | null;
  reminder_count: number;
  marked_overdue_at: string | null;
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
