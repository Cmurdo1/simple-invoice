import { Link } from 'react-router-dom';
import { useInvoices } from '@/hooks/useInvoices';
import { useFeedback, useAverageRating } from '@/hooks/useFeedback';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  DollarSign, 
  FileText, 
  Clock,
  Loader2,
  Star,
  MessageSquare,
  ClipboardList,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { InvoiceStatus } from '@/types/database';
import { useState } from 'react';

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function Dashboard() {
  const { data: allInvoices, isLoading } = useInvoices();
  const { data: feedback, isLoading: feedbackLoading } = useFeedback();
  const averageRating = useAverageRating();
  const [activeTab, setActiveTab] = useState('all');

  // Filter based on tab
  const invoices = allInvoices?.filter(inv => {
    if (activeTab === 'all') return true;
    if (activeTab === 'invoices') return inv.type === 'invoice';
    if (activeTab === 'estimates') return inv.type === 'estimate';
    return true;
  }) || [];

  // Calculate monthly stats (for invoices only)
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const onlyInvoices = allInvoices?.filter(inv => inv.type === 'invoice') || [];
  const onlyEstimates = allInvoices?.filter(inv => inv.type === 'estimate') || [];

  const monthlyInvoices = onlyInvoices.filter((inv) =>
    isWithinInterval(new Date(inv.created_at), { start: monthStart, end: monthEnd })
  );

  const monthlyRevenue = monthlyInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const pendingAmount = onlyInvoices
    .filter((inv) => inv.status === 'sent')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const estimateAmount = onlyEstimates
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              {format(now, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/create?type=estimate">
                <Plus className="h-4 w-4" />
                New Estimate
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to="/create?type=invoice">
                <Plus className="h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue This Month
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {monthlyInvoices.filter((i) => i.status === 'paid').length} paid invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payments
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {onlyInvoices.filter((i) => i.status === 'sent').length} awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open Estimates
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${estimateAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {onlyEstimates.length} pending estimates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* List with Tabs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle>Recent Activity</CardTitle>
            <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-[480px]">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="estimates">Estimates</TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  Payments
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-6">
            {activeTab === 'payments' ? (
              (() => {
                const paidInvoices = (allInvoices || [])
                  .filter(inv => inv.status === 'paid' && inv.type === 'invoice')
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                const totalPaid = paidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
                return isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : paidInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CreditCard className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mb-2 text-lg font-semibold">No payments yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Payments will appear here once clients pay their invoices
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-3">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">{paidInvoices.length} payment{paidInvoices.length !== 1 ? 's' : ''} received</span>
                      </div>
                      <span className="font-bold text-green-700 dark:text-green-400">
                        ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} total
                      </span>
                    </div>
                    <div className="space-y-2">
                      {paidInvoices.map((invoice) => (
                        <Link
                          key={invoice.id}
                          to={`/invoice/${invoice.id}`}
                          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{invoice.client?.name || 'No client'}</span>
                                <span className="text-xs text-muted-foreground">{invoice.invoice_number}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(invoice.updated_at), 'MMM d, yyyy • h:mm a')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600 dark:text-green-400">
                              +${Number(invoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })()
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-semibold">No {activeTab === 'all' ? 'items' : activeTab} yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Create your first {activeTab === 'estimates' ? 'estimate' : 'invoice'} to get started
                </p>
                <Button asChild>
                  <Link to={`/create?type=${activeTab === 'estimates' ? 'estimate' : 'invoice'}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create {activeTab === 'estimates' ? 'Estimate' : 'Invoice'}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.slice(0, 10).map((invoice) => (
                  <Link
                    key={invoice.id}
                    to={`/invoice/${invoice.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {invoice.invoice_number || 'Draft'}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn('capitalize', statusColors[invoice.status])}
                        >
                          {invoice.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          {invoice.type}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {invoice.client?.name || 'No client'} • {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${Number(invoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Feedback */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Client Feedback
            </CardTitle>
            {averageRating !== null && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">avg</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {feedbackLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !feedback || feedback.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Star className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-semibold">No feedback yet</h3>
                <p className="text-sm text-muted-foreground">
                  Feedback will appear here when clients rate your invoices
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedback.slice(0, 5).map((fb) => (
                  <div key={fb.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {fb.client_name || fb.client_business_name || 'Anonymous'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            on {fb.invoice_number || 'Invoice'}
                          </span>
                        </div>
                        {fb.comment && (
                          <p className="text-sm text-muted-foreground">{fb.comment}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(fb.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {fb.rating && (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                'h-4 w-4',
                                star <= fb.rating!
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground/30'
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {feedback.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground">
                    +{feedback.length - 5} more feedback entries
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}