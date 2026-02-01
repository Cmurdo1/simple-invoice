import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FeedbackWithInvoice {
  id: string;
  invoice_id: string;
  rating: number | null;
  comment: string | null;
  client_name: string | null;
  created_at: string;
  invoice_number: string | null;
  client_business_name: string | null;
}

export function useFeedback() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feedback', user?.id],
    queryFn: async (): Promise<FeedbackWithInvoice[]> => {
      if (!user) return [];

      // First get all user's invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, invoice_number, client:clients(name)')
        .eq('user_id', user.id);

      if (invoicesError) throw invoicesError;
      if (!invoices || invoices.length === 0) return [];

      const invoiceIds = invoices.map(inv => inv.id);

      // Then get feedback for those invoices
      const { data: feedback, error: feedbackError } = await supabase
        .from('invoice_feedback')
        .select('*')
        .in('invoice_id', invoiceIds)
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      // Map feedback with invoice info
      return (feedback || []).map(fb => {
        const invoice = invoices.find(inv => inv.id === fb.invoice_id);
        return {
          ...fb,
          invoice_number: invoice?.invoice_number || null,
          client_business_name: (invoice?.client as any)?.name || null,
        };
      });
    },
    enabled: !!user,
  });
}

export function useAverageRating() {
  const { data: feedback } = useFeedback();
  
  if (!feedback || feedback.length === 0) return null;
  
  const ratingsWithValue = feedback.filter(f => f.rating !== null);
  if (ratingsWithValue.length === 0) return null;
  
  const sum = ratingsWithValue.reduce((acc, f) => acc + (f.rating || 0), 0);
  return sum / ratingsWithValue.length;
}