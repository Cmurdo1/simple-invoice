import { Link } from 'react-router-dom';
import { useInvoices } from '@/hooks/useInvoices';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  DollarSign, 
  FileText, 
  Clock,
  Loader2,
  ClipboardList,
  CreditCard,
  CheckCircle2,
  Zap,
  Users,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { ReferEarnCard } from '@/components/dashboard/ReferEarnCard';
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

  const monthlyPaidInvoices = onlyInvoices.filter((inv) =>
    inv.status === 'paid' &&
    isWithinInterval(new Date(inv.updated_at), { start: monthStart, end: monthEnd })
  );

  const monthlyRevenue = monthlyPaidInvoices
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
                {monthlyPaidInvoices.length} paid invoices
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Button asChild variant="outline" className="h-auto flex-col gap-2 py-5">
                <Link to="/create?type=invoice">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">New Invoice</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto flex-col gap-2 py-5">
                <Link to="/create?type=estimate">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">New Estimate</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto flex-col gap-2 py-5">
                <Link to="/clients">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Clients</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto flex-col gap-2 py-5">
                <Link to="/settings">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Settings className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Alert */}
        {(() => {
          const overdue = (allInvoices || []).filter(inv => inv.status === 'overdue' && inv.type === 'invoice');
          if (overdue.length === 0) return null;
          return (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">{overdue.length} overdue invoice{overdue.length !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">
                      ${overdue.reduce((s, i) => s + Number(i.total_amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} outstanding
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" variant="destructive">
                  <Link to="/dashboard" className="flex items-center gap-1">
                    Review <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </AppLayout>
  );
}