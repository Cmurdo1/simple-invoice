
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

console.log(`Function 'process-lead' up and running!`);

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { 'x-my-custom-header': 'process-lead' } } }
    );

    const { 
      poster_name, 
      contact_info, 
      job_description, 
      location, 
      post_url, 
      date_posted 
    } = await req.json();

    // Insert lead into the database
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .insert({
        poster_name,
        contact_info,
        job_description,
        location,
        post_url,
        date_posted: date_posted ? new Date(date_posted).toISOString() : null,
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error inserting lead:', leadError);
      throw leadError;
    }

    // Call extract-line-items function
    const { data: lineItemsData, error: lineItemsError } = await supabaseClient.functions.invoke(
      'extract-line-items',
      { body: { job_description } }
    );

    if (lineItemsError) {
      console.error('Error invoking extract-line-items:', lineItemsError);
      throw lineItemsError;
    }

    const line_items = lineItemsData.line_items;

    // Create an estimate (invoice with type 'estimate')
    const { data: estimate, error: estimateError } = await supabaseClient
      .from('invoices')
      .insert({
        customer_name: poster_name || 'Potential Customer',
        customer_email: contact_info && contact_info.includes('@') ? contact_info : null,
        job_description,
        line_items,
        total_amount: line_items.reduce((sum: number, item: any) => sum + item.amount, 0),
        type: 'estimate',
        status: 'draft', // or 'sent' if we send it immediately
        lead_id: lead.id, // Link to the newly created lead
      })
      .select()
      .single();

    if (estimateError) {
      console.error('Error creating estimate:', estimateError);
      throw estimateError;
    }

    // Update the lead with the estimate_id
    const { error: updateLeadError } = await supabaseClient
      .from('leads')
      .update({ estimate_id: estimate.id })
      .eq('id', lead.id);

    if (updateLeadError) {
      console.error('Error updating lead with estimate_id:', updateLeadError);
      throw updateLeadError;
    }

    // If email is available, send the estimate
    if (estimate.customer_email) {
      // Generate PDF (this part needs to be handled by a separate utility or function)
      // For now, we'll assume the send-invoice-email function can handle it or we'll generate a simple text estimate.
      // The existing `send-invoice-email` function likely expects an invoice ID to generate the PDF.
      // We need to ensure the PDF generation utility is accessible or integrate it here.

      // For now, let's assume send-invoice-email can take an estimate ID and generate PDF.
      const { data: emailData, error: emailError } = await supabaseClient.functions.invoke(
        'send-invoice-email',
        { body: { invoice_id: estimate.id, recipient_email: estimate.customer_email, is_estimate: true } }
      );

      if (emailError) {
        console.error('Error invoking send-invoice-email:', emailError);
        // Do not throw error here, as lead and estimate are already saved.
      }
    }

    return new Response(JSON.stringify({ message: 'Lead processed successfully', lead_id: lead.id, estimate_id: estimate.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
