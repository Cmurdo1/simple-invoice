import Dexie, { type EntityTable } from 'dexie';

// Types for offline storage
export interface OfflineClient {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  synced: boolean;
  deleted: boolean;
}

export interface OfflineInvoice {
  id: string;
  user_id: string;
  client_id: string | null;
  invoice_number: string | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  total_amount: number;
  tax_amount: number;
  notes: string | null;
  job_description: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  synced: boolean;
  deleted: boolean;
}

export interface OfflineInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
  created_at: string;
  synced: boolean;
  deleted: boolean;
}

export interface SyncQueueItem {
  id?: number;
  table: 'clients' | 'invoices' | 'invoice_items';
  operation: 'create' | 'update' | 'delete';
  record_id: string;
  data: Record<string, unknown>;
  created_at: string;
  attempts: number;
}

// Extend Dexie for TypeScript
class OfflineDatabase extends Dexie {
  clients!: EntityTable<OfflineClient, 'id'>;
  invoices!: EntityTable<OfflineInvoice, 'id'>;
  invoice_items!: EntityTable<OfflineInvoiceItem, 'id'>;
  sync_queue!: EntityTable<SyncQueueItem, 'id'>;

  constructor() {
    super('HonestInvoiceDB');
    
    this.version(1).stores({
      clients: 'id, user_id, synced, deleted',
      invoices: 'id, user_id, client_id, status, synced, deleted',
      invoice_items: 'id, invoice_id, synced, deleted',
      sync_queue: '++id, table, operation, record_id, created_at',
    });
  }
}

export const db = new OfflineDatabase();

// Helper to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}
