import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useInvoice,
  useUpdateInvoice,
  useAddInvoiceItems,
  useUpdateInvoiceItem,
  useDeleteInvoiceItem,
  useRecalculateInvoiceTotals,
} from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProfile } from '@/hooks/useProfile';
import { Loader2, Plus, Trash2, Save, Download, ArrowLeft, Send, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { InvoiceStatus } from '@/types/database';
import { exportInvoiceToPDF } from '@/lib/pdfExport';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function InvoiceEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id);
  const { data: clients } = useClients();
  const { data: profile } = useProfile();
  const { subscription } = useAuth();
  const updateInvoice = useUpdateInvoice();
  const addInvoiceItems = useAddInvoiceItems();
  const updateInvoiceItem = useUpdateInvoiceItem();
  const deleteInvoiceItem = useDeleteInvoiceItem();
  const recalculateTotals = useRecalculateInvoiceTotals();

  const [localItems, setLocalItems] = useState<Array<{
    id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    isNew?: boolean;
  }>>([]);

  useEffect(() => {
    if (invoice?.invoice_items) {
      setLocalItems(
        invoice.invoice_items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        }))
      );
    }
  }, [invoice]);

  const handleAddItem = () => {
    setLocalItems([
      ...localItems,
      { description: '', quantity: 1, unit_price: 0, isNew: true },
    ]);
  };

  const handleUpdateLocalItem = (index: number, field: string, value: string | number) => {
    const updated = [...localItems];
    updated[index] = { ...updated[index], [field]: value };
    setLocalItems(updated);
  };

  const handleRemoveItem = async (index: number) => {
    const item = localItems[index];
    if (item.id && id) {
      await deleteInvoiceItem.mutateAsync({ id: item.id, invoice_id: id });
    }
    setLocalItems(localItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      // Save new items
      const newItems = localItems.filter((item) => item.isNew && item.description);
      if (newItems.length > 0) {
        await addInvoiceItems.mutateAsync({
          invoice_id: id,
          items: newItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            sort_order: localItems.length + index,
          })),
        });
      }

      // Update existing items
      const existingItems = localItems.filter((item) => item.id && !item.isNew);
      for (const item of existingItems) {
        if (item.id) {
          await updateInvoiceItem.mutateAsync({
            id: item.id,
            invoice_id: id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
          });
        }
      }

      // Recalculate totals
      await recalculateTotals.mutateAsync({
        invoice_id: id,
        tax_rate: profile?.tax_rate || 0,
      });

      toast.success('Invoice saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save invoice');
    }
  };

  const handleMarkAsSent = async () => {
    if (!id) return;
    await updateInvoice.mutateAsync({ id, status: 'sent' as InvoiceStatus });
    toast.success('Invoice marked as sent');
  };

  const handleMarkAsPaid = async () => {
    if (!id) return;
    await updateInvoice.mutateAsync({ id, status: 'paid' as InvoiceStatus });
    toast.success('Invoice marked as paid');
  };

  const handleExportPDF = async () => {
    if (!subscription.subscribed) {
      toast.error('PDF export is a Pro feature. Upgrade to export invoices.');
      return;
    }
    
    if (!invoice) return;
    
    try {
      await exportInvoiceToPDF({
        invoice: {
          ...invoice,
          total_amount: Number(invoice.total_amount),
          tax_amount: Number(invoice.tax_amount),
        },
        items: invoice.invoice_items || [],
        client: invoice.client,
        profile,
        isPro: subscription.subscribed,
      });
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendEmail = async () => {
    if (!subscription.subscribed) {
      toast.error('Email sending is a Pro feature. Upgrade to send invoices via email.');
      return;
    }
    
    if (!invoice || !invoice.client?.email) {
      toast.error('Please assign a client with an email address first.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoice_id: invoice.id,
          client_email: invoice.client.email,
          client_name: invoice.client.name,
          invoice_number: invoice.invoice_number,
          total_amount: Number(invoice.total_amount),
          due_date: invoice.due_date,
          business_name: profile?.business_name,
          job_description: invoice.job_description,
        },
      });

      if (error) throw error;
      
      // Mark invoice as sent
      await updateInvoice.mutateAsync({ id: invoice.id, status: 'sent' as InvoiceStatus });
      
      toast.success(`Invoice emailed to ${invoice.client.email}!`);
    } catch (error) {
      console.error('Email sending error:', error);
      toast.error('Failed to send invoice email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleClientChange = async (clientId: string) => {
    if (!id) return;
    await updateInvoice.mutateAsync({ 
      id, 
      client_id: clientId === 'none' ? null : clientId 
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Invoice not found</h2>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  const subtotal = localItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const taxRate = profile?.tax_rate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {invoice.invoice_number || 'Draft Invoice'}
                </h1>
                <Badge className={cn('capitalize', statusColors[invoice.status])}>
                  {invoice.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {invoice.client?.name || 'No client assigned'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {invoice.status === 'draft' && (
              <Button variant="outline" onClick={handleMarkAsSent} className="gap-2">
                <Send className="h-4 w-4" />
                Mark as Sent
              </Button>
            )}
            {invoice.status === 'sent' && (
              <Button variant="outline" onClick={handleMarkAsPaid} className="gap-2 text-primary hover:text-primary/80">
                Mark as Paid
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleSendEmail}
              disabled={isSendingEmail || !invoice.client?.email}
              className="gap-2"
              title={!invoice.client?.email ? "Client needs an email address" : "Send invoice via email"}
            >
              {isSendingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Email Invoice
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={invoice.client_id || 'none'} 
              onValueChange={handleClientChange}
            >
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select a client..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Line Items</CardTitle>
            <Button size="sm" variant="outline" onClick={handleAddItem} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>

              {/* Items */}
              {localItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleUpdateLocalItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="text-right"
                      value={item.quantity}
                      onChange={(e) => handleUpdateLocalItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="text-right"
                      value={item.unit_price}
                      onChange={(e) => handleUpdateLocalItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {localItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No line items. Click "Add Item" to add one.
                </div>
              )}

              {/* Totals */}
              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax ({taxRate}%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg" onClick={handleSave} className="gap-2">
            <Save className="h-5 w-5" />
            Save Invoice
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
