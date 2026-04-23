import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OWNER_EMAIL = 'murdochcpm_08@yahoo.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_TRUE_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const CEO_MODEL_DEFAULT = 'google/gemini-2.5-pro';
const WORKER_MODEL_DEFAULT = 'google/gemini-2.5-flash';

// =============================================================================
// AUDIT LOG
// =============================================================================
async function logAction(
  supabase: any,
  params: {
    agent_role: string;
    action_type: string;
    target?: string;
    reasoning?: string;
    payload?: any;
    result?: any;
    status?: 'success' | 'error' | 'skipped';
    triggered_by?: string;
    run_id?: string | null;
  },
) {
  try {
    await supabase.from('ai_actions').insert({
      agent_role: params.agent_role,
      action_type: params.action_type,
      target: params.target ?? null,
      reasoning: params.reasoning ?? null,
      payload: params.payload ?? null,
      result: params.result ?? null,
      status: params.status ?? 'success',
      triggered_by: params.triggered_by ?? 'chat',
      run_id: params.run_id ?? null,
    });
  } catch (err) {
    console.error('logAction failed:', err);
  }
}

// =============================================================================
// STRIPE HELPERS
// =============================================================================
async function stripeFetch(path: string, init: RequestInit = {}) {
  if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured');
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(init.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${data.error?.message || JSON.stringify(data)}`);
  return data;
}

function formEncode(obj: Record<string, any>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  return params.toString();
}

// =============================================================================
// WORKER TOOL DEFINITIONS — scoped per role
// =============================================================================

const SALES_TOOLS = [
  { type: 'function', function: { name: 'list_leads', description: 'List leads from the pipeline. Filter by status (new/estimated/contacted) or source.', parameters: { type: 'object', properties: { status: { type: 'string' }, source: { type: 'string' }, limit: { type: 'number' } } } } },
  { type: 'function', function: { name: 'process_lead', description: 'Generate AI estimate from a lead. Set send_estimate=true to email it (requires email contact).', parameters: { type: 'object', properties: { lead_id: { type: 'string' }, send_estimate: { type: 'boolean' } }, required: ['lead_id'] } } },
  { type: 'function', function: { name: 'update_lead_status', description: 'Mark lead as new/estimated/contacted/converted/rejected.', parameters: { type: 'object', properties: { lead_id: { type: 'string' }, status: { type: 'string' } }, required: ['lead_id', 'status'] } } },
  { type: 'function', function: { name: 'create_estimate', description: 'Create estimate or invoice from a job description.', parameters: { type: 'object', properties: { job_description: { type: 'string' }, client_id: { type: 'string' }, type: { type: 'string', enum: ['invoice', 'estimate'] } }, required: ['job_description'] } } },
  { type: 'function', function: { name: 'send_invoice_email', description: 'Send an invoice/estimate to a client.', parameters: { type: 'object', properties: { invoice_id: { type: 'string' }, client_email: { type: 'string' }, client_name: { type: 'string' } }, required: ['invoice_id', 'client_email', 'client_name'] } } },
];

const OPS_TOOLS = [
  { type: 'function', function: { name: 'list_clients', description: 'List clients.', parameters: { type: 'object', properties: { limit: { type: 'number' } } } } },
  { type: 'function', function: { name: 'create_client', description: 'Add a new client.', parameters: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' } }, required: ['name'] } } },
  { type: 'function', function: { name: 'update_client', description: 'Update a client.', parameters: { type: 'object', properties: { client_id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' } }, required: ['client_id'] } } },
  { type: 'function', function: { name: 'list_invoices', description: 'List invoices/estimates. Filter by type or status.', parameters: { type: 'object', properties: { type: { type: 'string' }, status: { type: 'string' }, limit: { type: 'number' } } } } },
  { type: 'function', function: { name: 'send_invoice_email', description: 'Send invoice to client.', parameters: { type: 'object', properties: { invoice_id: { type: 'string' }, client_email: { type: 'string' }, client_name: { type: 'string' } }, required: ['invoice_id', 'client_email', 'client_name'] } } },
  { type: 'function', function: { name: 'send_email', description: 'Send a custom email from support@honestinvoice.com.', parameters: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } } },
];

const FINANCE_TOOLS = [
  { type: 'function', function: { name: 'list_invoices', description: 'List invoices/estimates.', parameters: { type: 'object', properties: { type: { type: 'string' }, status: { type: 'string' }, limit: { type: 'number' } } } } },
  { type: 'function', function: { name: 'send_invoice_email', description: 'Send/resend an invoice.', parameters: { type: 'object', properties: { invoice_id: { type: 'string' }, client_email: { type: 'string' }, client_name: { type: 'string' } }, required: ['invoice_id', 'client_email', 'client_name'] } } },
  { type: 'function', function: { name: 'stripe_list_customers', description: 'List Stripe customers, optionally filtered by email.', parameters: { type: 'object', properties: { email: { type: 'string' }, limit: { type: 'number' } } } } },
  { type: 'function', function: { name: 'stripe_list_subscriptions', description: 'List Stripe subscriptions for a customer or all active.', parameters: { type: 'object', properties: { customer_id: { type: 'string' }, status: { type: 'string' }, limit: { type: 'number' } } } } },
  { type: 'function', function: { name: 'stripe_cancel_subscription', description: 'Cancel a subscription. cancel_at_period_end=true keeps service until period ends.', parameters: { type: 'object', properties: { subscription_id: { type: 'string' }, cancel_at_period_end: { type: 'boolean' } }, required: ['subscription_id'] } } },
  { type: 'function', function: { name: 'stripe_refund', description: 'Refund a charge or payment intent.', parameters: { type: 'object', properties: { charge_or_payment_intent: { type: 'string' }, amount_cents: { type: 'number' }, reason: { type: 'string' } }, required: ['charge_or_payment_intent'] } } },
  { type: 'function', function: { name: 'send_payment_reminder', description: 'Email a Pro upgrade / payment reminder to a user.', parameters: { type: 'object', properties: { to: { type: 'string' }, name: { type: 'string' } }, required: ['to'] } } },
  { type: 'function', function: { name: 'send_email', description: 'Send a custom email from support@honestinvoice.com.', parameters: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } } },
];

const MARKETING_TOOLS = [
  { type: 'function', function: { name: 'send_email', description: 'Send a marketing/outreach email from support@honestinvoice.com.', parameters: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } } },
  { type: 'function', function: { name: 'list_clients', description: 'List clients (for outreach targeting).', parameters: { type: 'object', properties: { limit: { type: 'number' } } } } },
  { type: 'function', function: { name: 'list_leads', description: 'List leads (for follow-up campaigns).', parameters: { type: 'object', properties: { status: { type: 'string' }, limit: { type: 'number' } } } } },
];

const CUSTODIAN_TOOLS = [
  { type: 'function', function: { name: 'get_dashboard_stats', description: 'Overall stats: invoices, estimates, leads, revenue.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'list_recent_actions', description: 'Recent AI actions across all roles for audit.', parameters: { type: 'object', properties: { limit: { type: 'number' }, hours: { type: 'number' } } } } },
  { type: 'function', function: { name: 'list_invoices', description: 'List invoices for KPI computation.', parameters: { type: 'object', properties: { type: { type: 'string' }, status: { type: 'string' }, limit: { type: 'number' } } } } },
  { type: 'function', function: { name: 'list_leads', description: 'List leads for pipeline KPIs.', parameters: { type: 'object', properties: { status: { type: 'string' }, limit: { type: 'number' } } } } },
  { type: 'function', function: { name: 'send_email', description: 'Email the daily/weekly report to the owner.', parameters: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } } },
];

// =============================================================================
// TOOL EXECUTION (shared by all roles)
// =============================================================================
async function executeTool(
  name: string,
  args: any,
  ctx: { supabase: any; ownerUserId: string; agent_role: string; run_id: string | null; triggered_by: string },
): Promise<string> {
  const { supabase, ownerUserId, agent_role, run_id, triggered_by } = ctx;

  const log = (action_type: string, target: string | undefined, payload: any, result: any, status: 'success' | 'error' = 'success') =>
    logAction(supabase, { agent_role, action_type, target, payload, result, status, triggered_by, run_id });

  try {
    switch (name) {
      case 'list_clients': {
        const { data, error } = await supabase.from('clients').select('*').eq('user_id', ownerUserId).order('created_at', { ascending: false }).limit(args.limit || 50);
        if (error) throw error;
        return JSON.stringify({ clients: data, count: data.length });
      }

      case 'create_client': {
        const { data, error } = await supabase.from('clients').insert({ user_id: ownerUserId, name: args.name, email: args.email || null, phone: args.phone || null, address: args.address || null }).select().single();
        if (error) throw error;
        await log('create_client', args.name, args, { id: data.id });
        return JSON.stringify({ success: true, client: data });
      }

      case 'update_client': {
        const updates: any = {};
        if (args.name) updates.name = args.name;
        if (args.email !== undefined) updates.email = args.email;
        if (args.phone !== undefined) updates.phone = args.phone;
        if (args.address !== undefined) updates.address = args.address;
        const { data, error } = await supabase.from('clients').update(updates).eq('id', args.client_id).eq('user_id', ownerUserId).select().single();
        if (error) throw error;
        await log('update_client', args.client_id, args, { id: data.id });
        return JSON.stringify({ success: true, client: data });
      }

      case 'list_invoices': {
        let query = supabase.from('invoices').select('*, invoice_items(*)').eq('user_id', ownerUserId).order('created_at', { ascending: false }).limit(args.limit || 20);
        if (args.type) query = query.eq('type', args.type);
        if (args.status) query = query.eq('status', args.status);
        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ invoices: data, count: data.length });
      }

      case 'create_estimate': {
        const extractRes = await fetch(`${SUPABASE_URL}/functions/v1/extract-line-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify({ job_description: args.job_description }),
        });
        const extractData = await extractRes.json();
        const lineItems = extractData.line_items || extractData.items || [];
        const totalAmount = lineItems.reduce((sum: number, item: any) => sum + ((item.quantity || 1) * (item.unit_price || 0)), 0);

        const { data: invoice, error: invErr } = await supabase.from('invoices').insert({
          user_id: ownerUserId,
          job_description: args.job_description,
          total_amount: totalAmount,
          type: args.type || 'estimate',
          status: 'draft',
          client_id: args.client_id || null,
        }).select().single();
        if (invErr) throw invErr;

        if (lineItems.length > 0) {
          const items = lineItems.map((item: any, idx: number) => ({
            invoice_id: invoice.id,
            description: item.description || 'Service',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            total: (item.quantity || 1) * (item.unit_price || 0),
            sort_order: idx,
          }));
          await supabase.from('invoice_items').insert(items);
        }
        await log('create_estimate', invoice.invoice_number || invoice.id, { job_description: args.job_description, type: args.type }, { invoice_id: invoice.id, total: totalAmount });
        return JSON.stringify({ success: true, invoice_id: invoice.id, invoice_number: invoice.invoice_number, total_amount: totalAmount, line_items_count: lineItems.length });
      }

      case 'send_invoice_email': {
        const { data: inv, error: invErr } = await supabase.from('invoices').select('*').eq('id', args.invoice_id).single();
        if (invErr) throw invErr;
        const { data: profile } = await supabase.from('profiles').select('business_name, email').eq('id', ownerUserId).single();

        const sendRes = await fetch(`${SUPABASE_URL}/functions/v1/send-invoice-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify({
            invoice_id: args.invoice_id,
            client_email: args.client_email,
            client_name: args.client_name,
            invoice_number: inv.invoice_number || 'DRAFT',
            total_amount: inv.total_amount || 0,
            due_date: inv.due_date,
            business_name: profile?.business_name || 'Honest Invoice',
            job_description: inv.job_description,
            document_type: inv.type || 'invoice',
          }),
        });
        const result = await sendRes.json();
        if (!sendRes.ok) throw new Error(result.error || 'Failed to send email');
        await log('send_invoice_email', args.client_email, { invoice_id: args.invoice_id }, { ok: true });
        return JSON.stringify({ success: true, message: `Email sent to ${args.client_email}` });
      }

      case 'send_email':
      case 'send_support_email': {
        const sendRes = await fetch(`${SUPABASE_URL}/functions/v1/send-support-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify({ to: args.to, subject: args.subject, body: args.body }),
        });
        const result = await sendRes.json();
        if (!sendRes.ok) throw new Error(result.error || 'Failed to send email');
        await log('send_email', args.to, { subject: args.subject }, { ok: true });
        return JSON.stringify({ success: true, message: `Email sent to ${args.to}` });
      }

      case 'list_leads': {
        let query = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(args.limit || 30);
        if (args.status) query = query.eq('status', args.status);
        if (args.source) query = query.eq('source', args.source);
        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ leads: data, count: data.length });
      }

      case 'process_lead': {
        const { data: lead, error: leadErr } = await supabase.from('leads').select('*').eq('id', args.lead_id).single();
        if (leadErr) throw leadErr;

        const processRes = await fetch(`${SUPABASE_URL}/functions/v1/process-lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify({
            poster_name: lead.poster_name,
            contact_info: lead.contact_info,
            job_description: lead.job_description,
            location: lead.location,
            post_url: lead.post_url,
            source: lead.source,
          }),
        });
        const processResult = await processRes.json();

        if (args.send_estimate && lead.contact_info?.includes('@') && processResult.estimate_id) {
          const { data: est } = await supabase.from('invoices').select('*').eq('id', processResult.estimate_id).single();
          if (est) {
            await fetch(`${SUPABASE_URL}/functions/v1/send-invoice-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
              body: JSON.stringify({
                invoice_id: est.id,
                client_email: lead.contact_info,
                client_name: lead.poster_name || 'Potential Customer',
                invoice_number: est.invoice_number || 'EST',
                total_amount: est.total_amount || 0,
                due_date: null,
                business_name: 'Honest Invoice',
                job_description: est.job_description,
                document_type: 'estimate',
              }),
            });
            await supabase.from('leads').update({ status: 'contacted' }).eq('id', args.lead_id);
            await log('process_lead', lead.contact_info, { lead_id: args.lead_id }, { sent: true, estimate_id: processResult.estimate_id });
            return JSON.stringify({ success: true, message: `Estimate sent to ${lead.contact_info}`, estimate_id: processResult.estimate_id });
          }
        }
        await log('process_lead', lead.poster_name || lead.id, { lead_id: args.lead_id }, processResult);
        return JSON.stringify({ success: true, message: 'Lead processed', ...processResult });
      }

      case 'update_lead_status': {
        const { error } = await supabase.from('leads').update({ status: args.status }).eq('id', args.lead_id);
        if (error) throw error;
        await log('update_lead_status', args.lead_id, args, { ok: true });
        return JSON.stringify({ success: true });
      }

      case 'get_dashboard_stats': {
        const [invoices, estimates, leads, paidInvoices, newLeads] = await Promise.all([
          supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', ownerUserId).eq('type', 'invoice'),
          supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', ownerUserId).eq('type', 'estimate'),
          supabase.from('leads').select('id', { count: 'exact', head: true }),
          supabase.from('invoices').select('total_amount').eq('user_id', ownerUserId).eq('status', 'paid'),
          supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        ]);
        const totalRevenue = (paidInvoices.data || []).reduce((s: number, i: any) => s + (i.total_amount || 0), 0);
        return JSON.stringify({
          total_invoices: invoices.count || 0,
          total_estimates: estimates.count || 0,
          total_leads: leads.count || 0,
          new_leads: newLeads.count || 0,
          total_revenue: totalRevenue,
        });
      }

      case 'list_recent_actions': {
        const hours = args.hours || 24;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase.from('ai_actions').select('agent_role, action_type, target, status, created_at').gte('created_at', since).order('created_at', { ascending: false }).limit(args.limit || 50);
        if (error) throw error;
        return JSON.stringify({ actions: data, count: data.length });
      }

      // ===== STRIPE =====
      case 'stripe_list_customers': {
        const params: any = { limit: args.limit || 5 };
        if (args.email) params.email = args.email;
        const result = await stripeFetch(`/customers?${formEncode(params)}`);
        return JSON.stringify({ customers: result.data?.map((c: any) => ({ id: c.id, email: c.email, name: c.name, created: c.created })) || [] });
      }

      case 'stripe_list_subscriptions': {
        const params: any = { limit: args.limit || 10 };
        if (args.customer_id) params.customer = args.customer_id;
        if (args.status) params.status = args.status;
        const result = await stripeFetch(`/subscriptions?${formEncode(params)}`);
        return JSON.stringify({
          subscriptions: result.data?.map((s: any) => ({
            id: s.id,
            customer: s.customer,
            status: s.status,
            current_period_end: s.current_period_end,
            cancel_at_period_end: s.cancel_at_period_end,
          })) || [],
        });
      }

      case 'stripe_cancel_subscription': {
        let result;
        if (args.cancel_at_period_end) {
          result = await stripeFetch(`/subscriptions/${args.subscription_id}`, {
            method: 'POST',
            body: formEncode({ cancel_at_period_end: 'true' }),
          });
        } else {
          result = await stripeFetch(`/subscriptions/${args.subscription_id}`, { method: 'DELETE' });
        }
        await log('stripe_cancel_subscription', args.subscription_id, args, { status: result.status, cancel_at_period_end: result.cancel_at_period_end });
        return JSON.stringify({ success: true, subscription_id: result.id, status: result.status, cancel_at_period_end: result.cancel_at_period_end });
      }

      case 'stripe_refund': {
        const body: any = { reason: args.reason || 'requested_by_customer' };
        if (args.charge_or_payment_intent.startsWith('pi_')) {
          body.payment_intent = args.charge_or_payment_intent;
        } else {
          body.charge = args.charge_or_payment_intent;
        }
        if (args.amount_cents) body.amount = args.amount_cents;
        const result = await stripeFetch('/refunds', { method: 'POST', body: formEncode(body) });
        await log('stripe_refund', args.charge_or_payment_intent, args, { id: result.id, amount: result.amount });
        return JSON.stringify({ success: true, refund_id: result.id, amount: result.amount });
      }

      case 'send_payment_reminder': {
        const name = args.name || 'there';
        const subject = 'Continue your Honest Invoice Pro service';
        const body = `Hi ${name},\n\nWe noticed your Honest Invoice Pro subscription needs attention. Pro gives you unlimited invoices, custom branding, email sending, and AI estimating — everything that makes your business look sharp and get paid faster.\n\nReady to continue? Just sign in and click "Upgrade" — it takes about 30 seconds:\nhttps://honestinvoice.com\n\nIf you have any questions, just reply to this email.\n\nThanks,\nThe Honest Invoice Team`;
        const sendRes = await fetch(`${SUPABASE_URL}/functions/v1/send-support-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify({ to: args.to, subject, body }),
        });
        const result = await sendRes.json();
        if (!sendRes.ok) throw new Error(result.error || 'Failed to send');
        await log('send_payment_reminder', args.to, args, { ok: true });
        return JSON.stringify({ success: true, message: `Payment reminder sent to ${args.to}` });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    console.error(`Tool ${name} error:`, err);
    await log(name, args.target || args.to || args.client_email || 'unknown', args, { error: err.message }, 'error');
    return JSON.stringify({ error: err.message || 'Tool execution failed' });
  }
}

// =============================================================================
// ROLE PERSONAS
// =============================================================================
const ROLE_PERSONAS: Record<string, { tools: any[]; system: string }> = {
  sales: {
    tools: SALES_TOOLS,
    system: `You are the SALES agent for Honest Invoice. Your mission: convert incoming leads into sent estimates as fast as possible.
Workflow:
1. Check new leads (list_leads with status='new')
2. For each promising lead with email contact, call process_lead with send_estimate=true
3. For phone-only leads, generate the estimate (send_estimate=false) and report back
4. Mark dead/spam leads as rejected
Be decisive. Don't ask permission for routine pipeline work.`,
  },
  ops: {
    tools: OPS_TOOLS,
    system: `You are the OPS agent for Honest Invoice. You manage the client roster and outbound invoice operations.
- Keep client records clean and complete
- Send invoices when asked
- Handle ad-hoc client emails professionally
Be concise and accurate.`,
  },
  finance: {
    tools: FINANCE_TOOLS,
    system: `You are the FINANCE agent for Honest Invoice. You handle Stripe subscriptions, refunds, and payment collection.
- For subscription cancellations, default to cancel_at_period_end=true unless told otherwise (let users keep service they paid for)
- Before sending payment reminders, verify the user actually has/had a Stripe customer record
- For refunds, confirm amount and reason
- Be professional and customer-friendly in all outbound emails`,
  },
  marketing: {
    tools: MARKETING_TOOLS,
    system: `You are the MARKETING agent for Honest Invoice. You write and send outreach, follow-ups, and re-engagement content.
- Brand voice: honest, no-BS, contractor-friendly, slightly cheeky
- Tagline themes: "Stripe for the Trades", "Get paid faster, look more pro"
- Keep emails SHORT — contractors don't read essays
- Always include a clear single CTA`,
  },
  custodian: {
    tools: CUSTODIAN_TOOLS,
    system: `You are the CUSTODIAN agent for Honest Invoice. You watch the system, compute KPIs, and surface anomalies.
- Daily brief = stats + top events from last 24h actions
- Flag anything weird: failed actions, abandoned leads, payment failures, sudden drops
- Send daily reports to the owner via email when asked
Keep reports tight, data-first, no fluff.`,
  },
};

// =============================================================================
// WORKER AGENT — runs a sub-task with scoped tools
// =============================================================================
async function runWorker(
  role: string,
  task: string,
  ctx: { supabase: any; ownerUserId: string; run_id: string | null; triggered_by: string; model: string },
): Promise<string> {
  const persona = ROLE_PERSONAS[role];
  if (!persona) return `Unknown role: ${role}`;

  const messages: any[] = [
    { role: 'system', content: persona.system + `\n\nCurrent date: ${new Date().toISOString().split('T')[0]}` },
    { role: 'user', content: task },
  ];

  let iterations = 6;
  let final = '';

  while (iterations-- > 0) {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: ctx.model, messages, tools: persona.tools, temperature: 0.3 }),
    });

    if (!res.ok) {
      const errTxt = await res.text();
      console.error(`Worker ${role} AI error:`, res.status, errTxt);
      return `[${role}] AI error ${res.status}: ${errTxt.slice(0, 200)}`;
    }

    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    if (!msg) return `[${role}] No response from AI`;
    messages.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      final = msg.content || '';
      break;
    }

    for (const tc of msg.tool_calls) {
      let args: any = {};
      try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
      console.log(`[${role}] -> ${tc.function.name}`, args);
      const result = await executeTool(tc.function.name, args, { ...ctx, agent_role: role });
      messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
    }
  }
  return final || `[${role}] task completed (no final summary)`;
}

// =============================================================================
// CEO ORCHESTRATOR — delegates to sub-agents
// =============================================================================
const CEO_TOOLS = [
  { type: 'function', function: { name: 'delegate_to_sales', description: 'Delegate to the Sales agent. Handles lead pipeline: process leads, send estimates, follow up.', parameters: { type: 'object', properties: { task: { type: 'string', description: 'Specific instruction for the Sales agent' } }, required: ['task'] } } },
  { type: 'function', function: { name: 'delegate_to_ops', description: 'Delegate to the Ops agent. Handles clients, invoices, day-to-day execution.', parameters: { type: 'object', properties: { task: { type: 'string' } }, required: ['task'] } } },
  { type: 'function', function: { name: 'delegate_to_finance', description: 'Delegate to the Finance agent. Handles Stripe (cancel/refund/reminder), billing.', parameters: { type: 'object', properties: { task: { type: 'string' } }, required: ['task'] } } },
  { type: 'function', function: { name: 'delegate_to_marketing', description: 'Delegate to the Marketing agent. Handles outreach, content, campaigns.', parameters: { type: 'object', properties: { task: { type: 'string' } }, required: ['task'] } } },
  { type: 'function', function: { name: 'delegate_to_custodian', description: 'Delegate to the Custodian agent. Handles KPIs, daily reports, audit, anomaly detection.', parameters: { type: 'object', properties: { task: { type: 'string' } }, required: ['task'] } } },
  { type: 'function', function: { name: 'get_dashboard_stats', description: 'Quick stats lookup without delegating.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'list_recent_actions', description: 'See what your team has been doing recently.', parameters: { type: 'object', properties: { hours: { type: 'number' }, limit: { type: 'number' } } } } },
];

const CEO_SYSTEM = `You are the CEO of the AI org running Honest Invoice — a contractor invoicing platform. You report ONLY to the human owner (murdochcpm_08@yahoo.com).

Your team:
- SALES: lead pipeline (Craigslist/Nextdoor leads → estimates → outreach)
- OPS: clients, invoices, daily execution
- FINANCE: Stripe subscriptions, refunds, payment reminders
- MARKETING: outreach, content, campaigns
- CUSTODIAN: KPIs, audit log, daily reports, anomaly detection

You delegate. You do NOT do execution work yourself unless it's a quick stats lookup. For anything that requires action, pick the right department and delegate clearly with specific instructions.

When the owner asks something:
1. If it's a single concrete request → delegate to one department
2. If it's broad ("run the company today") → delegate to multiple departments in parallel-feeling sequence
3. After delegation, summarize what happened in ONE concise paragraph for the owner

Be decisive, executive-tone, brief. Don't narrate your thinking — just act and report.

Current date: ${new Date().toISOString().split('T')[0]}`;

async function runCEO(
  userMessages: any[],
  ctx: { supabase: any; ownerUserId: string; run_id: string | null; triggered_by: string; ceo_model: string; worker_model: string },
): Promise<string> {
  const messages: any[] = [{ role: 'system', content: CEO_SYSTEM }, ...userMessages];
  let iterations = 8;
  let final = '';

  while (iterations-- > 0) {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: ctx.ceo_model, messages, tools: CEO_TOOLS, temperature: 0.4 }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('CEO AI error:', res.status, txt);
      if (res.status === 429) throw new Error('Rate limited, try again shortly.');
      if (res.status === 402) throw new Error('AI credits exhausted — top up your workspace.');
      throw new Error(`CEO AI error ${res.status}`);
    }

    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error('No CEO response');
    messages.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      final = msg.content || '';
      break;
    }

    for (const tc of msg.tool_calls) {
      let args: any = {};
      try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
      const fn = tc.function.name;
      console.log(`[CEO] -> ${fn}`, args);

      let toolResult: string;
      if (fn.startsWith('delegate_to_')) {
        const role = fn.replace('delegate_to_', '');
        await logAction(ctx.supabase, {
          agent_role: 'ceo',
          action_type: 'delegate',
          target: role,
          payload: { task: args.task },
          status: 'success',
          triggered_by: ctx.triggered_by,
          run_id: ctx.run_id,
        });
        toolResult = await runWorker(role, args.task, {
          supabase: ctx.supabase,
          ownerUserId: ctx.ownerUserId,
          run_id: ctx.run_id,
          triggered_by: ctx.triggered_by,
          model: ctx.worker_model,
        });
      } else {
        toolResult = await executeTool(fn, args, {
          supabase: ctx.supabase,
          ownerUserId: ctx.ownerUserId,
          agent_role: 'ceo',
          run_id: ctx.run_id,
          triggered_by: ctx.triggered_by,
        });
      }
      messages.push({ role: 'tool', tool_call_id: tc.id, content: toolResult });
    }
  }
  return final || 'Done.';
}

// =============================================================================
// HTTP HANDLER
// =============================================================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { messages, internal_secret, triggered_by, run_id } = body;

    let ownerUserId: string;
    let trigger = triggered_by || 'chat';
    let activeRunId: string | null = run_id || null;

    // Two auth paths: owner JWT (from chat) OR internal cron secret
    if (internal_secret && internal_secret === SUPABASE_SERVICE_ROLE_KEY) {
      // Internal call (cron). Look up owner by email.
      const { data: ownerProfile } = await supabase.from('profiles').select('id').eq('email', OWNER_EMAIL).maybeSingle();
      if (!ownerProfile) {
        return new Response(JSON.stringify({ error: 'Owner profile not found' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      ownerUserId = ownerProfile.id;
    } else {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user || user.email !== OWNER_EMAIL) {
        return new Response(JSON.stringify({ error: 'Unauthorized — owner only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      ownerUserId = user.id;
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Load org settings
    const { data: settings } = await supabase.from('ai_org_settings').select('*').eq('id', 1).maybeSingle();
    const ceo_model = settings?.ceo_model || CEO_MODEL_DEFAULT;
    const worker_model = settings?.worker_model || WORKER_MODEL_DEFAULT;

    const content = await runCEO(messages, { supabase, ownerUserId, run_id: activeRunId, triggered_by: trigger, ceo_model, worker_model });

    return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('nerve-agent error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
