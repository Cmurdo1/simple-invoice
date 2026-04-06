import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OWNER_EMAIL = 'murdochcpm_08@yahoo.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Tool definitions for the AI agent
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_clients',
      description: 'List all clients for the owner account. Returns client names, emails, phones, addresses.',
      parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Max clients to return (default 50)' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_client',
      description: 'Create a new client.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_client',
      description: 'Update a client by ID.',
      parameters: {
        type: 'object',
        properties: {
          client_id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
        },
        required: ['client_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_invoices',
      description: 'List invoices/estimates for the owner. Can filter by type (invoice/estimate) and status.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['invoice', 'estimate'] },
          status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue'] },
          limit: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_estimate',
      description: 'Create an estimate/invoice with AI-generated line items from a job description. This uses the extract-line-items AI engine.',
      parameters: {
        type: 'object',
        properties: {
          job_description: { type: 'string', description: 'Description of the work to estimate' },
          client_id: { type: 'string', description: 'Optional client ID to link to' },
          type: { type: 'string', enum: ['invoice', 'estimate'], description: 'Defaults to estimate' },
        },
        required: ['job_description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_invoice_email',
      description: 'Send an invoice or estimate to a client via email.',
      parameters: {
        type: 'object',
        properties: {
          invoice_id: { type: 'string', description: 'The invoice/estimate ID to send' },
          client_email: { type: 'string' },
          client_name: { type: 'string' },
        },
        required: ['invoice_id', 'client_email', 'client_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_support_email',
      description: 'Send an email from support@honestinvoice.com to anyone.',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email (comma-separated for multiple)' },
          subject: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_leads',
      description: 'List incoming leads from scrapers/Nextdoor. Can filter by status and source.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['new', 'estimated', 'contacted'] },
          source: { type: 'string', enum: ['craigslist', 'nextdoor'] },
          limit: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'process_lead',
      description: 'Take a lead and generate an estimate from it, then optionally send to the contact.',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string' },
          send_estimate: { type: 'boolean', description: 'If true and contact_info is an email, send the estimate' },
        },
        required: ['lead_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_stats',
      description: 'Get summary stats: total invoices, estimates, leads, revenue, etc.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_lead_status',
      description: 'Update the status of a lead.',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string' },
          status: { type: 'string', enum: ['new', 'estimated', 'contacted', 'converted', 'rejected'] },
        },
        required: ['lead_id', 'status'],
      },
    },
  },
];

// Tool execution
async function executeTool(
  name: string,
  args: any,
  supabase: any,
  ownerUserId: string,
): Promise<string> {
  try {
    switch (name) {
      case 'list_clients': {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', ownerUserId)
          .order('created_at', { ascending: false })
          .limit(args.limit || 50);
        if (error) throw error;
        return JSON.stringify({ clients: data, count: data.length });
      }

      case 'create_client': {
        const { data, error } = await supabase
          .from('clients')
          .insert({ user_id: ownerUserId, name: args.name, email: args.email || null, phone: args.phone || null, address: args.address || null })
          .select()
          .single();
        if (error) throw error;
        return JSON.stringify({ success: true, client: data });
      }

      case 'update_client': {
        const updates: any = {};
        if (args.name) updates.name = args.name;
        if (args.email !== undefined) updates.email = args.email;
        if (args.phone !== undefined) updates.phone = args.phone;
        if (args.address !== undefined) updates.address = args.address;
        const { data, error } = await supabase
          .from('clients')
          .update(updates)
          .eq('id', args.client_id)
          .eq('user_id', ownerUserId)
          .select()
          .single();
        if (error) throw error;
        return JSON.stringify({ success: true, client: data });
      }

      case 'list_invoices': {
        let query = supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('user_id', ownerUserId)
          .order('created_at', { ascending: false })
          .limit(args.limit || 20);
        if (args.type) query = query.eq('type', args.type);
        if (args.status) query = query.eq('status', args.status);
        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ invoices: data, count: data.length });
      }

      case 'create_estimate': {
        // Call extract-line-items to get AI-generated line items
        const extractRes = await fetch(`${SUPABASE_URL}/functions/v1/extract-line-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify({ job_description: args.job_description }),
        });
        const extractData = await extractRes.json();
        const lineItems = extractData.line_items || extractData.items || [];
        const totalAmount = lineItems.reduce((sum: number, item: any) => sum + ((item.quantity || 1) * (item.unit_price || 0)), 0);

        // Create the invoice/estimate
        const { data: invoice, error: invErr } = await supabase
          .from('invoices')
          .insert({
            user_id: ownerUserId,
            job_description: args.job_description,
            total_amount: totalAmount,
            type: args.type || 'estimate',
            status: 'draft',
            client_id: args.client_id || null,
          })
          .select()
          .single();
        if (invErr) throw invErr;

        // Insert line items
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

        return JSON.stringify({ success: true, invoice_id: invoice.id, invoice_number: invoice.invoice_number, total_amount: totalAmount, line_items_count: lineItems.length, line_items: lineItems });
      }

      case 'send_invoice_email': {
        // Fetch invoice details
        const { data: inv, error: invErr } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', args.invoice_id)
          .single();
        if (invErr) throw invErr;

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name, email')
          .eq('id', ownerUserId)
          .single();

        // Call send-invoice-email (needs auth token — use service role to invoke)
        const sendRes = await fetch(`${SUPABASE_URL}/functions/v1/send-invoice-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
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
        return JSON.stringify({ success: true, message: `Email sent to ${args.client_email}` });
      }

      case 'send_support_email': {
        const sendRes = await fetch(`${SUPABASE_URL}/functions/v1/send-support-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify({ to: args.to, subject: args.subject, body: args.body }),
        });
        const result = await sendRes.json();
        if (!sendRes.ok) throw new Error(result.error || 'Failed to send email');
        return JSON.stringify({ success: true, message: `Support email sent to ${args.to}` });
      }

      case 'list_leads': {
        let query = supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(args.limit || 30);
        if (args.status) query = query.eq('status', args.status);
        if (args.source) query = query.eq('source', args.source);
        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ leads: data, count: data.length });
      }

      case 'process_lead': {
        // Fetch the lead
        const { data: lead, error: leadErr } = await supabase
          .from('leads')
          .select('*')
          .eq('id', args.lead_id)
          .single();
        if (leadErr) throw leadErr;

        // Generate estimate via process-lead function logic
        const processRes = await fetch(`${SUPABASE_URL}/functions/v1/process-lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
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

        // Optionally send estimate if contact is email
        if (args.send_estimate && lead.contact_info?.includes('@') && processResult.estimate_id) {
          const { data: est } = await supabase.from('invoices').select('*').eq('id', processResult.estimate_id).single();
          if (est) {
            await fetch(`${SUPABASE_URL}/functions/v1/send-invoice-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
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
            return JSON.stringify({ success: true, message: `Estimate created and sent to ${lead.contact_info}`, estimate_id: processResult.estimate_id });
          }
        }

        return JSON.stringify({ success: true, message: 'Lead processed and estimate created', ...processResult });
      }

      case 'get_dashboard_stats': {
        const [invoices, estimates, leads, paidInvoices] = await Promise.all([
          supabase.from('invoices').select('id', { count: 'exact' }).eq('user_id', ownerUserId).eq('type', 'invoice'),
          supabase.from('invoices').select('id', { count: 'exact' }).eq('user_id', ownerUserId).eq('type', 'estimate'),
          supabase.from('leads').select('id', { count: 'exact' }),
          supabase.from('invoices').select('total_amount').eq('user_id', ownerUserId).eq('status', 'paid'),
        ]);
        const totalRevenue = (paidInvoices.data || []).reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);
        return JSON.stringify({
          total_invoices: invoices.count || 0,
          total_estimates: estimates.count || 0,
          total_leads: leads.count || 0,
          total_revenue: totalRevenue,
        });
      }

      case 'update_lead_status': {
        const { error } = await supabase.from('leads').update({ status: args.status }).eq('id', args.lead_id);
        if (error) throw error;
        return JSON.stringify({ success: true, message: `Lead status updated to ${args.status}` });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    console.error(`Tool ${name} error:`, err);
    return JSON.stringify({ error: err.message || 'Tool execution failed' });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify owner identity
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.email !== OWNER_EMAIL) {
      return new Response(JSON.stringify({ error: 'Unauthorized — owner only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `You are the Nerve Center AI Agent for Honest Invoice — a contractor invoicing platform. You work EXCLUSIVELY for the owner (murdochcpm_08@yahoo.com).

Your capabilities:
- Manage clients (list, create, update)
- Create invoices and estimates with AI-generated line items
- Send invoices/estimates via email to clients
- Send support emails from support@honestinvoice.com
- Monitor and process incoming leads from Craigslist and Nextdoor scrapers
- View dashboard stats and revenue data
- Process leads into estimates and send them automatically

When asked to create an estimate, use the create_estimate tool with the job description. When asked to send something, use the appropriate email tool.

Be concise, professional, and action-oriented. When you perform actions, confirm what you did with relevant details (IDs, amounts, etc.). If you're unsure about something, ask for clarification.

The lead pipeline: Leads come in from Craigslist/Nextdoor scrapers → you can process them into estimates → optionally send estimates to contacts.

Current date: ${new Date().toISOString().split('T')[0]}`;

    // Build conversation with system prompt
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // Call AI with tools — loop for multi-turn tool calling
    let currentMessages = [...fullMessages];
    let maxIterations = 8;
    let finalContent = '';

    while (maxIterations-- > 0) {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: currentMessages,
          tools: TOOLS,
          temperature: 0.3,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error('AI gateway error:', aiResponse.status, errText);
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limited, try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        throw new Error(`AI error: ${aiResponse.status}`);
      }

      const data = await aiResponse.json();
      const choice = data.choices?.[0];
      if (!choice) throw new Error('No AI response');

      const msg = choice.message;
      currentMessages.push(msg);

      // If no tool calls, we're done
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        finalContent = msg.content || '';
        break;
      }

      // Execute all tool calls
      for (const toolCall of msg.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs: any = {};
        try {
          toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch { /* empty args */ }

        console.log(`Executing tool: ${toolName}`, toolArgs);
        const result = await executeTool(toolName, toolArgs, supabase, user.id);

        currentMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    }

    return new Response(
      JSON.stringify({ content: finalContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('nerve-agent error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
