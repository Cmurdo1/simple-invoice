import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBMIT-FEEDBACK] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, token, rating, comment, client_name } = await req.json();
    logStep("Request received", { invoice_id, rating, hasComment: !!comment });

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

    // Validate the feedback token and get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, feedback_token, invoice_number, user_id')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      logStep("Invoice not found", { error: invoiceError?.message });
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invoice.feedback_token !== token) {
      logStep("Invalid token");
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
      logStep("Error inserting feedback", { error: insertError.message });
      return new Response(
        JSON.stringify({ error: 'Failed to submit feedback' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    logStep("Feedback inserted successfully");

    // Send email notification to the invoice owner
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && invoice.user_id) {
      try {
        // Get the owner's profile for email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, business_name')
          .eq('id', invoice.user_id)
          .single();

        if (profile?.email) {
          const resend = new Resend(resendKey);
          const starDisplay = '★'.repeat(rating) + '☆'.repeat(5 - rating);
          
          await resend.emails.send({
            from: 'HonestInvoice <notifications@honestinvoice.com>',
            to: [profile.email],
            subject: `New ${rating}-star feedback on Invoice ${invoice.invoice_number || 'N/A'}`,
            html: `
              <!DOCTYPE html>
              <html>
                <body style="font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      <h1 style="color: #228B22; margin: 0 0 20px 0;">New Client Feedback!</h1>
                      <p style="color: #333; font-size: 16px;">You received feedback on <strong>Invoice ${invoice.invoice_number || 'N/A'}</strong></p>
                      
                      <div style="background: linear-gradient(135deg, #228B22 0%, #1e7a1e 100%); color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0; font-size: 32px;">${starDisplay}</p>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">${rating} out of 5 stars</p>
                      </div>
                      
                      ${client_name ? `<p style="color: #666;"><strong>From:</strong> ${client_name}</p>` : ''}
                      ${comment ? `
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #228B22;">
                          <strong style="color: #333;">Comment:</strong>
                          <p style="color: #666; margin: 8px 0 0 0;">${comment}</p>
                        </div>
                      ` : ''}
                      
                      <p style="color: #666; margin-top: 25px; font-size: 14px;">
                        View all your feedback on your <a href="https://honestinvoice.com/dashboard" style="color: #228B22;">dashboard</a>.
                      </p>
                      
                      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px;">Powered by <strong>HonestInvoice</strong></p>
                      </div>
                    </div>
                  </div>
                </body>
              </html>
            `,
          });
          logStep("Notification email sent", { to: profile.email });
        }
      } catch (emailError) {
        // Don't fail the feedback submission if email fails
        logStep("Warning: Failed to send notification email", { error: String(emailError) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Feedback submitted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logStep("ERROR", { message: String(error) });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});