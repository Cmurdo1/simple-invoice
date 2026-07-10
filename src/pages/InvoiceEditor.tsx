import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Loader2, Plus, Trash2, Save, Download, ArrowLeft,
  Send, Mail, Link as LinkIcon, Copy, FileText, ClipboardList,
  User, Calendar, DollarSign, StickyNote, Receipt, Briefcase,
  CheckCircle, Clock, AlertCircle, Percent, Split,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { InvoiceStatus } from '@/types/database';
import { exportInvoiceToPDF } from '@/lib/pdfExport';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { calculateLateFee } from '@/lib/lateFees';

const statusConfig: Record<InvoiceStatus, { label: string; class: string; icon: React.ReactNode }> = {
  draft:   { label: 'Draft',   class: 'bg-muted text-muted-foreground border border-border',       icon: <Clock className="h-3 w-3" /> },
  sent:    { label: 'Sent',    class: 'bg-blue-100 text-blue-700 border border-blue-200',           icon: <Send className="h-3 w-3" /> },
  paid:    { label: 'Paid',    class: 'bg-emerald-100 text-emerald-700 border border-emerald-200',  icon: <CheckCircle className="h-3 w-3" /> },
  overdue: { label: 'Overdue', class: 'bg-red-100 text-red-700 border border-red-200',              icon: <AlertCircle className="h-3 w-3" /> },
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
  const [notes, setNotes] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [sendAsEstimate, setSendAsEstimate] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [lateFeePercent, setLateFeePercent] = useState<string>('');
  const [isSplitting, setIsSplitting] = useState(false);

  useEffect(() => {
    if (invoice) {
      if (invoice.invoice_items) {
        setLocalItems(
          invoice.invoice_items.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            isNew: false,
          }))
        );
      }
      setSendAsEstimate(invoice.type === 'estimate');
      setNotes(invoice.notes || '');
      setJobDescription(invoice.job_description || '');
      setLateFeePercent(
        invoice.late_fee_percent != null
          ? String(invoice.late_fee_percent)
          : String(profile?.default_late_fee_percent ?? 1.5)
      );
    }
  }, [invoice, profile?.default_late_fee_percent]);

  const handleAddItem = () => {
    setLocalItems([...localItems, { description: '', quantity: 1, unit_price: 0, isNew: true }]);
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

      // Save notes + job description + late fee
      await updateInvoice.mutateAsync({
        id,
        notes,
        job_description: jobDescription,
        type: sendAsEstimate ? 'estimate' : 'invoice',
        late_fee_percent: lateFeePercent === '' ? null : Number(lateFeePercent),
      });

      await recalculateTotals.mutateAsync({ invoice_id: id, tax_rate: profile?.tax_rate || 0 });
      toast.success(`${sendAsEstimate ? 'Estimate' : 'Invoice'} saved successfully`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save');
    }
  };

  const handleSplitDeposit = async () => {
    if (!invoice || !id) return;
    if (invoice.is_deposit) {
      toast.error('This is already a deposit invoice.');
      return;
    }
    const principal = Number(invoice.total_amount) || 0;
    if (principal <= 0) {
      toast.error('Save the invoice with a total first.');
      return;
    }
    setIsSplitting(true);
    try {
      const halfAmount = +(principal / 2).toFixed(2);
      // Create the deposit invoice (child)
      const { data: deposit, error: dErr } = await supabase
        .from('invoices')
        .insert({
          user_id: invoice.user_id,
          client_id: invoice.client_id,
          job_description: `50% materials/parts deposit for ${invoice.invoice_number || 'invoice'}${invoice.job_description ? ' — ' + invoice.job_description : ''}`,
          status: 'draft',
          type: 'invoice',
          is_deposit: true,
          deposit_percent: 50,
          parent_invoice_id: invoice.id,
          total_amount: halfAmount,
          tax_amount: 0,
          late_fee_percent: invoice.late_fee_percent,
        })
        .select()
        .single();
      if (dErr || !deposit) throw dErr || new Error('Failed to create deposit');

      // One-item line describing the deposit
      const { error: itemErr } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: deposit.id,
          description: '50% deposit — materials & parts',
          quantity: 1,
          unit_price: halfAmount,
          sort_order: 0,
        });
      if (itemErr) throw itemErr;

      toast.success('Deposit invoice created (50% upfront)');
      navigate(`/invoice/${deposit.id}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to create deposit');
    } finally {
      setIsSplitting(false);
    }
  };

  const handleMarkAsSent = async () => {
    if (!id) return;
    await updateInvoice.mutateAsync({ id, status: 'sent' as InvoiceStatus });
    toast.success('Marked as sent');
  };

  const handleMarkAsPaid = async () => {
    if (!id) return;
    await updateInvoice.mutateAsync({ id, status: 'paid' as InvoiceStatus });
    toast.success('Marked as paid');
  };

  const handleExportPDF = async () => {
    if (!subscription.subscribed) {
      toast.error('PDF export is a Pro feature.');
      return;
    }
    if (!invoice) return;
    try {
      await exportInvoiceToPDF({
        invoice: { ...invoice, total_amount: Number(invoice.total_amount), tax_amount: Number(invoice.tax_amount) },
        items: invoice.invoice_items || [],
        client: invoice.client,
        profile,
        isPro: subscription.subscribed,
        documentType: sendAsEstimate ? 'estimate' : 'invoice',
      });
      toast.success('PDF exported!');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const handleCopyPaymentLink = () => {
    if (!id) return;
    const url = `${window.location.origin}/pay/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopyingLink(true);
      toast.success('Payment link copied!');
      setTimeout(() => setIsCopyingLink(false), 2000);
    });
  };

  const handleSendEmail = async () => {
    if (!subscription.subscribed) {
      toast.error('Email sending is a Pro feature.');
      return;
    }
    if (!invoice?.client?.email) {
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
          document_type: sendAsEstimate ? 'estimate' : 'invoice',
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      await updateInvoice.mutateAsync({ id: invoice.id, status: 'sent' as InvoiceStatus });
      toast.success(`${sendAsEstimate ? 'Estimate' : 'Invoice'} emailed to ${invoice.client.email}!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDueDateChange = async (value: string) => {
    if (!id) return;
    await updateInvoice.mutateAsync({ id, due_date: value === 'completion' ? null : value });
  };

  const handleClientChange = async (clientId: string) => {
    if (!id) return;
    await updateInvoice.mutateAsync({ id, client_id: clientId === 'none' ? null : clientId });
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
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  const subtotal = localItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxRate = profile?.tax_rate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const currentLateFee = calculateLateFee(
    total,
    invoice.due_date,
    lateFeePercent === '' ? 0 : Number(lateFeePercent),
  );

  const isEstimateMode = sendAsEstimate;
  const accentColor = isEstimateMode
    ? (profile?.estimate_color || '#2563eb')
    : (profile?.brand_color || '#228B22');
  const status = statusConfig[invoice.status];
  const selectedClient = clients?.find((c) => c.id === invoice.client_id);

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-0">

        {/* ── Hero Header ────────────────────────────────────────────── */}
        <div
          className="rounded-xl mb-6 overflow-hidden shadow-sm"
          style={{ border: `1px solid ${accentColor}30` }}
        >
          {/* Accent top bar */}
          <div className="h-1 w-full" style={{ background: accentColor }} />

          <div
            className="px-6 py-5"
            style={{ background: `linear-gradient(135deg, ${accentColor}12 0%, ${accentColor}04 100%)` }}
          >
            {/* Top row: back + doc type toggle */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </button>

              {/* Document type switcher */}
              <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: `${accentColor}15` }}>
                <button
                  onClick={() => setSendAsEstimate(false)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                    !isEstimateMode
                      ? 'text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  style={!isEstimateMode ? { background: accentColor } : {}}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Invoice
                </button>
                <button
                  onClick={() => setSendAsEstimate(true)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                    isEstimateMode
                      ? 'text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  style={isEstimateMode ? { background: accentColor } : {}}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Estimate
                </button>
              </div>
            </div>

            {/* Main heading row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                  style={{ background: accentColor }}
                >
                  {isEstimateMode
                    ? <ClipboardList className="h-7 w-7 text-white" />
                    : <Receipt className="h-7 w-7 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold tracking-tight">
                      {invoice.invoice_number || `Draft ${isEstimateMode ? 'Estimate' : 'Invoice'}`}
                    </h1>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', status.class)}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isEstimateMode
                      ? 'Non-binding cost breakdown — sent before work begins'
                      : 'Request for payment — legally binding upon sending'}
                  </p>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex flex-wrap gap-2">
                {invoice.status === 'draft' && (
                  <Button variant="outline" size="sm" onClick={handleMarkAsSent} className="gap-1.5 h-9">
                    <Send className="h-3.5 w-3.5" />
                    Mark Sent
                  </Button>
                )}
                {invoice.status === 'sent' && (
                  <Button variant="outline" size="sm" onClick={handleMarkAsPaid} className="gap-1.5 h-9 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Mark Paid
                  </Button>
                )}
                <Button
                  variant="outline" size="sm"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !invoice.client?.email}
                  className="gap-1.5 h-9"
                  title={!invoice.client?.email ? 'Client needs an email address' : ''}
                >
                  {isSendingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  Email
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5 h-9">
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyPaymentLink} className="gap-1.5 h-9">
                  {isCopyingLink ? <Copy className="h-3.5 w-3.5 text-emerald-500" /> : <LinkIcon className="h-3.5 w-3.5" />}
                  {isCopyingLink ? 'Copied!' : 'Pay Link'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column: details */}
          <div className="lg:col-span-2 space-y-5">

            {/* Client & dates */}
            <Card className="overflow-hidden">
              <div className="h-0.5 w-full" style={{ background: accentColor }} />
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" style={{ color: accentColor }} />
                  Client & Billing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Client
                  </label>
                  <Select value={invoice.client_id || 'none'} onValueChange={handleClientChange}>
                    <SelectTrigger className="w-full">
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
                  {selectedClient && (
                    <div className="mt-2 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-0.5">
                      {selectedClient.email && <div>✉ {selectedClient.email}</div>}
                      {selectedClient.phone && <div>📞 {selectedClient.phone}</div>}
                      {selectedClient.address && <div>📍 {selectedClient.address}</div>}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    {isEstimateMode ? 'Valid Until' : 'Due Date'}
                  </label>
                  <Select value={invoice.due_date || 'completion'} onValueChange={handleDueDateChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completion">Upon Job Completion</SelectItem>
                      <SelectItem value={new Date().toISOString().split('T')[0]}>Today</SelectItem>
                      <SelectItem value={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>In 7 days</SelectItem>
                      <SelectItem value={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>In 14 days</SelectItem>
                      <SelectItem value={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>In 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card className="overflow-hidden">
              <div className="h-0.5 w-full" style={{ background: accentColor }} />
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" style={{ color: accentColor }} />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe the work to be performed or completed..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[90px] resize-none text-sm"
                />
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="overflow-hidden">
              <div className="h-0.5 w-full" style={{ background: accentColor }} />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" style={{ color: accentColor }} />
                    Line Items
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={handleAddItem} className="gap-1.5 h-8 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2 border-b">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2 text-right">{isEstimateMode ? 'Hrs / Qty' : 'Hrs'}</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-1" />
                </div>

                {/* Items */}
                <div className="space-y-2 mt-2">
                  {localItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-center py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors group"
                    >
                      <div className="col-span-5">
                        <Input
                          placeholder="e.g. Labor – Brake pad replacement"
                          value={item.description}
                          onChange={(e) => handleUpdateLocalItem(index, 'description', e.target.value)}
                          className="h-8 text-sm border-transparent bg-transparent focus:bg-background focus:border-input"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number" min="0" step="0.25"
                          className="h-8 text-right text-sm border-transparent bg-transparent focus:bg-background focus:border-input"
                          value={item.quantity}
                          onChange={(e) => handleUpdateLocalItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                          <Input
                            type="number" min="0" step="0.01"
                            className="h-8 text-right text-sm pl-5 border-transparent bg-transparent focus:bg-background focus:border-input"
                            value={item.unit_price}
                            onChange={(e) => handleUpdateLocalItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold tabular-nums">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </div>
                      <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {localItems.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No line items yet</p>
                      <p className="text-xs mt-1">Click "Add Item" to get started</p>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium tabular-nums">${subtotal.toFixed(2)}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                      <span className="tabular-nums">${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div
                    className="flex justify-between text-base font-bold rounded-lg px-3 py-2.5 mt-1"
                    style={{ background: `${accentColor}15`, color: accentColor }}
                  >
                    <span>Total</span>
                    <span className="tabular-nums">${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="overflow-hidden">
              <div className="h-0.5 w-full" style={{ background: accentColor }} />
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4" style={{ color: accentColor }} />
                  Notes & Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Payment terms, warranty info, disclaimers, or any other notes for the client..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                />
              </CardContent>
            </Card>

          </div>

          {/* Right column: summary + payment link */}
          <div className="space-y-5">

            {/* Live Summary Card */}
            <Card className="overflow-hidden sticky top-4">
              <div className="h-1 w-full" style={{ background: accentColor }} />

              {/* Mini-invoice preview */}
              <div className="px-5 py-4" style={{ background: `${accentColor}08` }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>
                      {isEstimateMode ? 'Estimate' : 'Invoice'}
                    </p>
                    <p className="text-base font-bold mt-0.5">{invoice.invoice_number || 'DRAFT'}</p>
                  </div>
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ background: accentColor }}
                  >
                    {isEstimateMode
                      ? <ClipboardList className="h-5 w-5 text-white" />
                      : <Receipt className="h-5 w-5 text-white" />}
                  </div>
                </div>

                {/* Client info */}
                <div className="space-y-1 text-xs text-muted-foreground border-t pt-3 mt-3">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 flex-shrink-0" />
                    <span className="font-medium text-foreground">{invoice.client?.name || '—'}</span>
                  </div>
                  {invoice.client?.email && (
                    <div className="flex items-center gap-1.5 ml-4">
                      <span>{invoice.client.email}</span>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="space-y-1 text-xs text-muted-foreground border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span>Date issued</span>
                    <span className="font-medium text-foreground">{format(new Date(invoice.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isEstimateMode ? 'Valid until' : 'Due date'}</span>
                    <span className="font-medium text-foreground">
                      {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'On completion'}
                    </span>
                  </div>
                </div>

                {/* Items summary */}
                {localItems.length > 0 && (
                  <div className="border-t pt-3 mt-3 space-y-1.5">
                    {localItems.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[120px]">{item.description || 'Item'}</span>
                        <span className="font-medium tabular-nums">${(item.quantity * item.unit_price).toFixed(2)}</span>
                      </div>
                    ))}
                    {localItems.length > 4 && (
                      <div className="text-xs text-muted-foreground">+{localItems.length - 4} more items</div>
                    )}
                  </div>
                )}

                {/* Total */}
                <div
                  className="rounded-lg px-3 py-2.5 mt-4 flex justify-between items-center"
                  style={{ background: accentColor }}
                >
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wide">Total Due</span>
                  <span className="text-lg font-bold text-white tabular-nums">${total.toFixed(2)}</span>
                </div>

                {/* Business name */}
                {profile?.business_name && (
                  <p className="text-center text-xs text-muted-foreground mt-3">{profile.business_name}</p>
                )}
              </div>

              <CardContent className="pt-4 space-y-3">
                {/* Save button */}
                <Button
                  className="w-full gap-2 text-white font-semibold h-10"
                  style={{ background: accentColor }}
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4" />
                  Save {isEstimateMode ? 'Estimate' : 'Invoice'}
                </Button>

                {/* Status actions */}
                {invoice.status === 'draft' && (
                  <Button variant="outline" className="w-full gap-2 h-9 text-sm" onClick={handleMarkAsSent}>
                    <Send className="h-3.5 w-3.5" />
                    Mark as Sent
                  </Button>
                )}
                {invoice.status === 'sent' && (
                  <Button variant="outline" className="w-full gap-2 h-9 text-sm text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={handleMarkAsPaid}>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Mark as Paid
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Link */}
            <Card className="overflow-hidden">
              <div className="h-0.5 w-full" style={{ background: accentColor }} />
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" style={{ color: accentColor }} />
                  Payment Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Share with your client for online payment via Stripe.
                </p>
                <div className="flex items-center gap-2 rounded-lg border bg-muted px-2.5 py-2 text-xs font-mono text-muted-foreground overflow-hidden">
                  <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{`${window.location.origin}/pay/${id}`}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleCopyPaymentLink}>
                  {isCopyingLink ? (
                    <><Copy className="h-3.5 w-3.5 text-emerald-500" /> Copied!</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copy Link</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-card p-3">
                <p className="text-xs text-muted-foreground">Items</p>
                <p className="text-2xl font-bold mt-0.5">{localItems.length}</p>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <p className="text-xs text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold mt-0.5">{invoice.sent_count ?? 0}×</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
