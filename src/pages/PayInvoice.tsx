import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, CreditCard, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface PublicInvoice {
  id: string;
  invoice_number: string | null;
  status: string;
  total_amount: number;
  tax_amount: number;
  job_description: string | null;
  due_date: string | null;
  type: string | null;
  client?: { name: string; email: string | null } | null;
  invoice_items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
  }>;
  profiles?: { business_name: string | null; email: string | null } | null;
}

export default function PayInvoice() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      try {
        // We need a public read on invoice for payment page. 
        // Use a service-level read via edge function approach, but since RLS requires auth
        // we use a public-facing edge function or anon read.
        // For now, fetch via the public supabase anon client but we need a policy.
        // We'll create a dedicated edge function for this.
        const { data, error } = await supabase.functions.invoke('get-public-invoice', {
          body: { invoice_id: id },
        });

        if (error || data?.error) throw new Error(data?.error || error?.message || 'Invoice not found');
        setInvoice(data.invoice);
      } catch (err: any) {
        setError(err.message || 'Invoice not found');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handlePay = async () => {
    if (!invoice) return;

    // Payment link requires the contractor to be authed — we invoke as anon via public function
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-public-invoice-payment', {
        body: { invoice_id: invoice.id },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start payment. Please try again.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your payment has been processed. You'll receive a confirmation email shortly.
            </p>
            <Badge className="bg-green-100 text-green-700 text-sm px-3 py-1">Invoice Paid</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <XCircle className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">Payment Cancelled</h1>
            <p className="text-muted-foreground">
              Your payment was not completed. You can try again below.
            </p>
            {invoice && (
              <Button onClick={handlePay} disabled={paying} className="gap-2 w-full">
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Invoice Not Found</h1>
            <p className="text-muted-foreground">{error || 'This payment link is invalid or has expired.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = (invoice.invoice_items || []).reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  ) || Number(invoice.total_amount);
  const taxAmount = Number(invoice.tax_amount) || 0;
  const total = Number(invoice.total_amount) || subtotal + taxAmount;
  const isPaid = invoice.status === 'paid';

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">
              {invoice.profiles?.business_name || 'Invoice'}
            </span>
          </div>
          <h1 className="text-3xl font-bold">
            {invoice.invoice_number || 'Payment Request'}
          </h1>
          {invoice.job_description && (
            <p className="text-muted-foreground">{invoice.job_description}</p>
          )}
          <Badge
            className={
              isPaid
                ? 'bg-green-100 text-green-700'
                : invoice.status === 'sent'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-muted text-muted-foreground'
            }
          >
            {isPaid ? 'Paid' : invoice.status === 'sent' ? 'Payment Due' : invoice.status}
          </Badge>
        </div>

        {/* Line items */}
        <Card>
          <CardHeader className="pb-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Invoice Details
            </h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {(invoice.invoice_items || []).length > 0 ? (
              <>
                {invoice.invoice_items!.map((item) => (
                  <div key={item.id} className="flex justify-between items-start py-1">
                    <div>
                      <p className="font-medium text-sm">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(item.quantity)} × ${Number(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <span className="font-medium text-sm">
                      ${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex justify-between py-1">
                <span className="text-sm">{invoice.job_description || 'Services rendered'}</span>
                <span className="font-medium text-sm">${subtotal.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t pt-3 mt-2 space-y-1">
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total Due</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {invoice.due_date && (
              <p className="text-xs text-muted-foreground pt-1">
                Due: {new Date(invoice.due_date).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pay button */}
        {isPaid ? (
          <Card>
            <CardContent className="py-6 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="font-semibold">This invoice has been paid. Thank you!</p>
            </CardContent>
          </Card>
        ) : (
          <Button
            size="lg"
            className="w-full gap-2 text-base"
            onClick={handlePay}
            disabled={paying}
          >
            {paying ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="h-5 w-5" />
            )}
            {paying ? 'Redirecting to payment...' : `Pay $${total.toFixed(2)} securely`}
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Powered by <strong>HonestInvoice</strong> · Secured by Stripe
        </p>
      </div>
    </div>
  );
}
