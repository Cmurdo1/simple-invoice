import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      poster_name,
      contact_info,
      job_description,
      location,
      post_url,
      date_posted,
    } = await req.json();

    if (!job_description) {
      return new Response(JSON.stringify({ error: 'job_description is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1. Insert lead into the database
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        poster_name: poster_name || 'Unknown',
        contact_info: contact_info || null,
        job_description,
        location: location || null,
        post_url: post_url || null,
        date_posted: date_posted ? new Date(date_posted).toISOString() : null,
        status: 'new',
        source: source || 'craigslist',
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error inserting lead:', leadError);
      throw leadError;
    }

    console.log('Lead saved:', lead.id);

    // 2. Generate line items via extract-line-items function
    let line_items: any[] = [];
    let total_amount = 0;

    try {
      const extractResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/extract-line-items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ job_description }),
        }
      );
      const extractData = await extractResponse.json();
      if (extractData.line_items) {
        line_items = extractData.line_items;
        total_amount = line_items.reduce((sum: number, item: any) => sum + (item.amount || item.total || 0), 0);
      }
    } catch (extractErr) {
      console.error('Error extracting line items:', extractErr);
      // Non-fatal — continue without line items
    }

    // 3. Create an estimate record linked to this lead
    // We need a user_id — use the service role to find any matching user or use a system user
    // For auto-generated leads from scraper, we create unowned estimates (user_id = null workaround via service role)
    // We'll store lead_id reference in job_description as a tag for now
    const { data: estimate, error: estimateError } = await supabase
      .from('invoices')
      .insert({
        job_description: `[Lead:${lead.id}] ${job_description}`,
        total_amount,
        type: 'estimate',
        status: 'draft',
        notes: `Auto-generated from Craigslist lead.\nContact: ${contact_info || 'N/A'}\nLocation: ${location || 'N/A'}\nSource: ${post_url || 'N/A'}`,
        // user_id is required — use a placeholder that signals auto-lead
        // The service role bypasses RLS so we can insert without auth.uid()
        user_id: '00000000-0000-0000-0000-000000000000',
      })
      .select()
      .single();

    if (estimateError) {
      console.error('Error creating estimate:', estimateError);
      // Non-fatal — lead is saved, just no estimate
    } else {
      // Insert line items
      if (line_items.length > 0 && estimate) {
        const items = line_items.map((item: any, idx: number) => ({
          invoice_id: estimate.id,
          description: item.description || item.name || 'Service',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || item.amount || 0,
          total: item.total || item.amount || 0,
          sort_order: idx,
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(items);
        if (itemsError) {
          console.error('Error inserting invoice items:', itemsError);
        }
      }

      // Update lead with estimate_id
      if (estimate) {
        await supabase
          .from('leads')
          .update({ estimate_id: estimate.id, status: 'estimated' })
          .eq('id', lead.id);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Lead processed successfully',
        lead_id: lead.id,
        estimate_id: estimate?.id || null,
        line_items_count: line_items.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('process-lead error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
