import { openDB, IDBPDatabase } from 'idb';

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

let _db: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB('HonestInvoiceDB', 1, {
    upgrade(database) {
      const clientStore = database.createObjectStore('clients', { keyPath: 'id' });
      clientStore.createIndex('by_user', 'user_id');

      const invoiceStore = database.createObjectStore('invoices', { keyPath: 'id' });
      invoiceStore.createIndex('by_user', 'user_id');

      const itemStore = database.createObjectStore('invoice_items', { keyPath: 'id' });
      itemStore.createIndex('by_invoice', 'invoice_id');

      database.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
    },
  });
  return _db;
}

// Typed store helpers
export const db = {
  clients: {
    getAll: async (): Promise<OfflineClient[]> => (await getDB()).getAll('clients'),
    get: async (id: string): Promise<OfflineClient | undefined> => (await getDB()).get('clients', id),
    put: async (v: OfflineClient): Promise<void> => { await (await getDB()).put('clients', v); },
    update: async (id: string, changes: Partial<OfflineClient>): Promise<void> => {
      const db2 = await getDB();
      const existing = await db2.get('clients', id);
      if (existing) await db2.put('clients', { ...existing, ...changes });
    },
  },
  invoices: {
    getAll: async (): Promise<OfflineInvoice[]> => (await getDB()).getAll('invoices'),
    get: async (id: string): Promise<OfflineInvoice | undefined> => (await getDB()).get('invoices', id),
    put: async (v: OfflineInvoice): Promise<void> => { await (await getDB()).put('invoices', v); },
    update: async (id: string, changes: Partial<OfflineInvoice>): Promise<void> => {
      const db2 = await getDB();
      const existing = await db2.get('invoices', id);
      if (existing) await db2.put('invoices', { ...existing, ...changes });
    },
  },
  invoice_items: {
    getAll: async (): Promise<OfflineInvoiceItem[]> => (await getDB()).getAll('invoice_items'),
    get: async (id: string): Promise<OfflineInvoiceItem | undefined> => (await getDB()).get('invoice_items', id),
    put: async (v: OfflineInvoiceItem): Promise<void> => { await (await getDB()).put('invoice_items', v); },
    update: async (id: string, changes: Partial<OfflineInvoiceItem>): Promise<void> => {
      const db2 = await getDB();
      const existing = await db2.get('invoice_items', id);
      if (existing) await db2.put('invoice_items', { ...existing, ...changes });
    },
    where: (_field: string) => ({
      equals: async (val: string): Promise<OfflineInvoiceItem[]> => {
        const idb = await getDB();
        return idb.getAllFromIndex('invoice_items', 'by_invoice', val);
      },
    }),
  },
  sync_queue: {
    getAll: async (): Promise<SyncQueueItem[]> => (await getDB()).getAll('sync_queue'),
    orderBy: (_field: string) => ({
      toArray: async (): Promise<SyncQueueItem[]> => {
        const items: SyncQueueItem[] = await (await getDB()).getAll('sync_queue');
        return items.sort((a, b) => a.created_at.localeCompare(b.created_at));
      },
    }),
    add: async (v: SyncQueueItem): Promise<number> => (await getDB()).add('sync_queue', v) as Promise<number>,
    update: async (id: number, changes: Partial<SyncQueueItem>): Promise<void> => {
      const db2 = await getDB();
      const existing = await db2.get('sync_queue', id);
      if (existing) await db2.put('sync_queue', { ...existing, ...changes });
    },
    delete: async (id: number): Promise<void> => { await (await getDB()).delete('sync_queue', id); },
  },
};

export function generateId(): string {
  return crypto.randomUUID();
}

export function isOnline(): boolean {
  return navigator.onLine;
}
