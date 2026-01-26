import { db, isOnline, type OfflineClient, type OfflineInvoice, type OfflineInvoiceItem } from './offlineDb';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SyncStatus = 'idle' | 'syncing' | 'error';

class SyncEngine {
  private status: SyncStatus = 'idle';
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  getStatus(): SyncStatus {
    return this.status;
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: SyncStatus) {
    this.status = status;
    this.listeners.forEach((listener) => listener(status));
  }

  // Initialize sync engine - start periodic sync
  start(intervalMs: number = 30000) {
    if (this.syncInterval) return;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Start periodic sync
    this.syncInterval = setInterval(() => {
      if (isOnline()) {
        this.sync();
      }
    }, intervalMs);

    // Initial sync if online
    if (isOnline()) {
      this.sync();
    }
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    toast.success('Back online! Syncing data...');
    this.sync();
  };

  private handleOffline = () => {
    toast.info('You are offline. Changes will sync when connection is restored.');
    this.setStatus('idle');
  };

  // Main sync function
  async sync(): Promise<void> {
    if (this.status === 'syncing' || !isOnline()) return;

    this.setStatus('syncing');

    try {
      // Process pending changes from sync queue
      await this.processSyncQueue();

      // Pull latest from Supabase
      await this.pullFromSupabase();

      this.setStatus('idle');
    } catch (error) {
      console.error('Sync error:', error);
      this.setStatus('error');
    }
  }

  // Push local changes to Supabase
  private async processSyncQueue(): Promise<void> {
    const queueItems = await db.sync_queue.orderBy('created_at').toArray();

    for (const item of queueItems) {
      try {
        switch (item.table) {
          case 'clients':
            await this.syncClient(item);
            break;
          case 'invoices':
            await this.syncInvoice(item);
            break;
          case 'invoice_items':
            await this.syncInvoiceItem(item);
            break;
        }

        // Remove from queue on success
        if (item.id) {
          await db.sync_queue.delete(item.id);
        }
      } catch (error) {
        console.error(`Failed to sync ${item.table}:`, error);
        // Update attempt count
        if (item.id && item.attempts < 5) {
          await db.sync_queue.update(item.id, { attempts: item.attempts + 1 });
        }
      }
    }
  }

  private async syncClient(item: { operation: string; record_id: string; data: Record<string, unknown> }) {
    const { operation, record_id, data } = item;
    const typedData = data as unknown as OfflineClient;

    if (operation === 'delete') {
      await supabase.from('clients').delete().eq('id', record_id);
    } else if (operation === 'create') {
      const { synced, deleted, ...cleanData } = typedData;
      await supabase.from('clients').insert(cleanData);
    } else if (operation === 'update') {
      const { synced, deleted, ...cleanData } = typedData;
      await supabase.from('clients').update(cleanData).eq('id', record_id);
    }

    // Mark as synced locally
    await db.clients.update(record_id, { synced: true });
  }

  private async syncInvoice(item: { operation: string; record_id: string; data: Record<string, unknown> }) {
    const { operation, record_id, data } = item;
    const typedData = data as unknown as OfflineInvoice;

    if (operation === 'delete') {
      await supabase.from('invoices').delete().eq('id', record_id);
    } else if (operation === 'create') {
      const { synced, deleted, ...cleanData } = typedData;
      await supabase.from('invoices').insert(cleanData);
    } else if (operation === 'update') {
      const { synced, deleted, ...cleanData } = typedData;
      await supabase.from('invoices').update(cleanData).eq('id', record_id);
    }

    await db.invoices.update(record_id, { synced: true });
  }

  private async syncInvoiceItem(item: { operation: string; record_id: string; data: Record<string, unknown> }) {
    const { operation, record_id, data } = item;
    const typedData = data as unknown as OfflineInvoiceItem;

    if (operation === 'delete') {
      await supabase.from('invoice_items').delete().eq('id', record_id);
    } else if (operation === 'create') {
      const { synced, deleted, ...cleanData } = typedData;
      await supabase.from('invoice_items').insert(cleanData);
    } else if (operation === 'update') {
      const { synced, deleted, ...cleanData } = typedData;
      await supabase.from('invoice_items').update(cleanData).eq('id', record_id);
    }

    await db.invoice_items.update(record_id, { synced: true });
  }

  // Pull data from Supabase
  private async pullFromSupabase(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Pull clients
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id);

    if (clients) {
      for (const client of clients) {
        const existing = await db.clients.get(client.id);
        if (!existing || new Date(client.updated_at) > new Date(existing.updated_at)) {
          await db.clients.put({ ...client, synced: true, deleted: false });
        }
      }
    }

    // Pull invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id);

    if (invoices) {
      for (const invoice of invoices) {
        const existing = await db.invoices.get(invoice.id);
        if (!existing || new Date(invoice.updated_at) > new Date(existing.updated_at)) {
          await db.invoices.put({
            ...invoice,
            total_amount: Number(invoice.total_amount),
            tax_amount: Number(invoice.tax_amount),
            synced: true,
            deleted: false,
          });
        }
      }
    }

    // Pull invoice items
    const invoiceIds = invoices?.map((i) => i.id) || [];
    if (invoiceIds.length > 0) {
      const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds);

      if (items) {
        for (const item of items) {
          const existing = await db.invoice_items.get(item.id);
          if (!existing) {
            await db.invoice_items.put({
              ...item,
              quantity: Number(item.quantity),
              unit_price: Number(item.unit_price),
              total: Number(item.total),
              sort_order: item.sort_order ?? 0,
              synced: true,
              deleted: false,
            });
          }
        }
      }
    }
  }

  // Add item to sync queue
  async queueChange(
    table: 'clients' | 'invoices' | 'invoice_items',
    operation: 'create' | 'update' | 'delete',
    recordId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await db.sync_queue.add({
      table,
      operation,
      record_id: recordId,
      data,
      created_at: new Date().toISOString(),
      attempts: 0,
    });

    // Trigger sync if online
    if (isOnline()) {
      this.sync();
    }
  }
}

export const syncEngine = new SyncEngine();
