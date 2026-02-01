import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, token, rating, comment, client_name } = await req.json();

    if (!invoice_id || !token) {
      return new Response(
        JSON.stringify({ error: 'Missing invoice_id or token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Rating must be between 1 and 5' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate the feedback token
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, feedback_token')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invoice.feedback_token !== token) {
      return new Response(
        JSON.stringify({ error: 'Invalid feedback token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if feedback already exists for this invoice
    const { data: existingFeedback } = await supabase
      .from('invoice_feedback')
      .select('id')
      .eq('invoice_id', invoice_id)
      .single();

    if (existingFeedback) {
      return new Response(
        JSON.stringify({ error: 'Feedback already submitted for this invoice' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the feedback
    const { error: insertError } = await supabase
      .from('invoice_feedback')
      .insert({
        invoice_id,
        rating,
        comment: comment || null,
        client_name: client_name || null,
      });

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit feedback' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Feedback submitted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Submit feedback error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});