import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Invoice, InvoiceItem, InvoiceStatus } from '@/types/database';
import { toast } from 'sonner';

export function useInvoices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async (): Promise<Invoice[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user,
  });
}

export function useInvoice(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async (): Promise<Invoice | null> => {
      if (!user || !id) return null;

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*),
          invoice_items(*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Invoice | null;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (invoice: {
      client_id?: string | null;
      job_description?: string | null;
      notes?: string | null;
      due_date?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_id: invoice.client_id || null,
          job_description: invoice.job_description || null,
          notes: invoice.notes || null,
          due_date: invoice.due_date || null,
          status: 'draft' as InvoiceStatus,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Invoice Items
export function useAddInvoiceItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoice_id,
      items,
    }: {
      invoice_id: string;
      items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'total' | 'created_at'>[];
    }) => {
      const itemsToInsert = items.map((item, index) => ({
        invoice_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        sort_order: item.sort_order ?? index,
      }));

      const { data, error } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateInvoiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      invoice_id,
      ...updates
    }: Partial<InvoiceItem> & { id: string; invoice_id: string }) => {
      const { data, error } = await supabase
        .from('invoice_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, invoice_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', result.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteInvoiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, invoice_id }: { id: string; invoice_id: string }) => {
      const { error } = await supabase.from('invoice_items').delete().eq('id', id);
      if (error) throw error;
      return { invoice_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', result.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Recalculate invoice totals
export function useRecalculateInvoiceTotals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoice_id, tax_rate }: { invoice_id: string; tax_rate: number }) => {
      // Get all items for this invoice
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('quantity, unit_price')
        .eq('invoice_id', invoice_id);

      if (itemsError) throw itemsError;

      const subtotal = items?.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
        0
      ) || 0;

      const tax_amount = subtotal * (tax_rate / 100);
      const total_amount = subtotal + tax_amount;

      const { error } = await supabase
        .from('invoices')
        .update({ total_amount, tax_amount })
        .eq('id', invoice_id);

      if (error) throw error;
      return { invoice_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', result.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
