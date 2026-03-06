import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-INVOICE-EMAIL] ${step}${detailsStr}`);
};

interface InvoiceEmailRequest {
  invoice_id: string;
  client_email: string;
  client_name: string;
  invoice_number: string;
  total_amount: number;
  due_date: string | null;
  business_name: string;
  job_description: string | null;
  document_type?: 'invoice' | 'estimate';
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not set");
    logStep("Resend key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check subscription status and get brand colors from database
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("subscription_status, subscription_end, email, brand_color, estimate_color, logo_url, phone, address")
      .eq("id", user.id)
      .single();

    if (profileError) throw new Error(`Profile fetch error: ${profileError.message}`);

    const isPro = profile?.subscription_status === 'pro' && 
      (!profile.subscription_end || new Date(profile.subscription_end) > new Date());

    if (!isPro) {
      return new Response(JSON.stringify({ 
        error: "Email sending is a Pro feature. Please upgrade to send invoices via email." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }
    logStep("Pro subscription verified");

    const { 
      invoice_id,
      client_email, 
      client_name, 
      invoice_number,
      total_amount,
      due_date,
      business_name,
      job_description,
      document_type = 'invoice'
    }: InvoiceEmailRequest = await req.json();

    if (!client_email || !invoice_number || !invoice_id) {
      throw new Error("Missing required fields: client_email, invoice_number, and invoice_id are required");
    }
    
    const isEstimate = document_type === 'estimate';
    const docLabel = isEstimate ? 'Estimate' : 'Invoice';
    const docLabelLower = isEstimate ? 'estimate' : 'invoice';
    
    // Use custom brand colors from profile (Pro feature)
    const invoiceColor = profile?.brand_color || '#228B22';
    const estimateColor = profile?.estimate_color || '#2563eb';
    const primaryColor = isEstimate ? estimateColor : invoiceColor;
    
    // Create a darker shade for gradients
    const darkerColor = adjustColorBrightness(primaryColor, -20);
    
    logStep("Request data validated", { invoice_number, client_email, invoice_id, document_type, primaryColor });

    // Fetch invoice with feedback token and sent count
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select("feedback_token, sent_count")
      .eq("id", invoice_id)
      .single();

    if (invoiceError) {
      throw new Error(`Could not fetch invoice details: ${invoiceError.message}`);
    }

    // Check if the email send limit has been reached
    const sentCount = invoice?.sent_count || 0;
    if (sentCount >= 5) {
      return new Response(JSON.stringify({ 
        error: "This document has reached the maximum number of email sends. Please download the PDF or contact support if you need to send it again." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    const feedbackToken = invoice?.feedback_token;

    // Fetch invoice line items for itemized breakdown
    const { data: lineItems, error: itemsError } = await supabaseClient
      .from("invoice_items")
      .select("description, quantity, unit_price, total")
      .eq("invoice_id", invoice_id)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      logStep("Warning: Could not fetch line items", { error: itemsError.message });
    }
    logStep("Line items fetched", { count: lineItems?.length || 0 });

    const resend = new Resend(resendKey);

    const dueDateText = due_date 
      ? new Date(due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Upon Job Completion';

    // Calculate subtotal from line items
    const subtotal = lineItems?.reduce(
      (sum, item) => sum + (item.quantity * item.unit_price),
      0
    ) || total_amount;

    // Build the itemized line items HTML - MOBILE OPTIMIZED
    const lineItemsHtml = lineItems && lineItems.length > 0 
      ? lineItems.map((item: InvoiceItem) => `
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eee; color: #333; font-size: 14px; word-break: break-word;">${item.description}</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: center; color: #666; font-size: 14px; white-space: nowrap;">${item.quantity}</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; color: #666; font-size: 14px; white-space: nowrap;">$${item.unit_price.toFixed(2)}</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: #333; font-size: 14px; white-space: nowrap;">$${(item.quantity * item.unit_price).toFixed(2)}</td>
          </tr>
        `).join('')
      : '';

    // Mobile-first, fully responsive email template
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>${docLabel} ${invoice_number}</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style type="text/css">
            /* Reset styles */
            body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
            body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
            
            /* Mobile styles */
            @media only screen and (max-width: 600px) {
              .email-container { width: 100% !important; max-width: 100% !important; }
              .mobile-padding { padding: 20px 16px !important; }
              .mobile-stack { display: block !important; width: 100% !important; }
              .mobile-center { text-align: center !important; }
              .mobile-full-width { width: 100% !important; }
              .header-amount { font-size: 28px !important; }
              .table-responsive { font-size: 13px !important; }
              .table-responsive td { padding: 8px 6px !important; }
              .hide-mobile { display: none !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <!-- Preview text -->
          <div style="display: none; max-height: 0; overflow: hidden;">
            ${docLabel} ${invoice_number} - $${total_amount.toFixed(2)} from ${business_name || 'HonestInvoice'}
          </div>
          
          <!-- Main wrapper -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 20px 10px;">
                
                <!-- Email container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                  
                  <!-- Header with branding -->
                  <tr>
                    <td class="mobile-padding" style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #eee;">
                      ${profile?.logo_url ? `
                        <img src="${profile.logo_url}" alt="${business_name}" style="max-width: 150px; max-height: 60px; margin-bottom: 10px;">
                      ` : `
                        <h1 style="color: ${primaryColor}; margin: 0; font-size: 24px; font-weight: 700;">${business_name || 'HonestInvoice'}</h1>
                      `}
                      <p style="color: #666; margin: 8px 0 0 0; font-size: 14px;">Fair Prices. Honest Work.</p>
                    </td>
                  </tr>
                  
                  <!-- Amount banner -->
                  <tr>
                    <td class="mobile-padding" style="padding: 0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="background: linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%); padding: 25px 30px; text-align: center;">
                            <h2 style="color: #ffffff; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">${docLabel} ${invoice_number}</h2>
                            <p class="header-amount" style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 700;">$${total_amount.toFixed(2)}</p>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">${isEstimate ? 'Estimated Total' : `Due: ${dueDateText}`}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td class="mobile-padding" style="padding: 30px 40px;">
                      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                        Hello ${client_name || 'there'},
                      </p>
                      
                      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Please find your itemized ${docLabelLower} from <strong>${business_name || 'HonestInvoice'}</strong> below.
                      </p>
                      
                      ${job_description ? `
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 25px;">
                          <tr>
                            <td style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; border-left: 4px solid ${primaryColor};">
                              <strong style="color: #333; font-size: 14px;">Job Summary:</strong>
                              <p style="color: #666; margin: 8px 0 0 0; font-size: 14px; line-height: 1.5;">${job_description}</p>
                            </td>
                          </tr>
                        </table>
                      ` : ''}
                      
                      ${lineItems && lineItems.length > 0 ? `
                        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Itemized Breakdown</h3>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="table-responsive" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                          <thead>
                            <tr style="background-color: #f9f9f9;">
                              <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #333; border-bottom: 2px solid ${primaryColor}; font-size: 13px;">Description</th>
                              <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #333; border-bottom: 2px solid ${primaryColor}; font-size: 13px; width: 50px;">Qty</th>
                              <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #333; border-bottom: 2px solid ${primaryColor}; font-size: 13px; width: 70px;">Price</th>
                              <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #333; border-bottom: 2px solid ${primaryColor}; font-size: 13px; width: 80px;">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${lineItemsHtml}
                          </tbody>
                          <tfoot>
                            <tr style="background-color: #f9f9f9;">
                              <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: 600; color: #333; font-size: 14px;">Subtotal:</td>
                              <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #333; font-size: 14px;">$${subtotal.toFixed(2)}</td>
                            </tr>
                            ${total_amount !== subtotal ? `
                              <tr style="background-color: #f9f9f9;">
                                <td colspan="3" style="padding: 10px 8px; text-align: right; font-weight: 500; color: #666; font-size: 14px;">Tax:</td>
                                <td style="padding: 10px 8px; text-align: right; font-weight: 500; color: #666; font-size: 14px;">$${(total_amount - subtotal).toFixed(2)}</td>
                              </tr>
                            ` : ''}
                            <tr style="background-color: ${primaryColor};">
                              <td colspan="3" style="padding: 14px 8px; text-align: right; font-weight: 700; color: #ffffff; font-size: 15px;">Total ${isEstimate ? 'Estimate' : 'Due'}:</td>
                              <td style="padding: 14px 8px; text-align: right; font-weight: 700; color: #ffffff; font-size: 17px;">$${total_amount.toFixed(2)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      ` : `
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">${docLabel} Number:</td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: #333; font-size: 14px;">${invoice_number}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">${isEstimate ? 'Estimated Amount' : 'Amount Due'}:</td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: ${primaryColor}; font-size: 14px;">$${total_amount.toFixed(2)}</td>
                          </tr>
                          ${!isEstimate ? `<tr>
                            <td style="padding: 12px 0; color: #666; font-size: 14px;">Due Date:</td>
                            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #333; font-size: 14px;">${dueDateText}</td>
                          </tr>` : ''}
                        </table>
                      `}
                      
                      ${!isEstimate ? `
                        <!-- Pay Now CTA -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 28px 0;">
                          <tr>
                            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%); border-radius: 10px; padding: 24px; text-align: center;">
                              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 6px 0;">Amount Due: <strong style="font-size: 22px; color: #ffffff;">$${total_amount.toFixed(2)}</strong></p>
                              <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 0 0 18px 0;">Due: ${dueDateText}</p>
                              <a href="https://id-preview--8937857b-915b-4c67-bc3a-85a05fc54ad7.lovable.app/pay/${invoice_id}" style="display: inline-block; background-color: #ffffff; color: ${primaryColor}; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; letter-spacing: 0.3px;">💳 Pay Now</a>
                            </td>
                          </tr>
                        </table>
                      ` : ''}

                      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
                        Thank you for your business! If you have any questions, please don't hesitate to reach out.
                      </p>
                      
                      ${profile?.phone || profile?.email ? `
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 15px;">
                          <tr>
                            <td style="color: #666; font-size: 13px;">
                              ${profile?.phone ? `<span>📞 ${profile.phone}</span>` : ''}
                              ${profile?.phone && profile?.email ? ` &nbsp;|&nbsp; ` : ''}
                              ${profile?.email ? `<span>✉️ ${profile.email}</span>` : ''}
                            </td>
                          </tr>
                        </table>
                      ` : ''}
                    </td>
                  </tr>
                  
                  ${feedbackToken ? `
                    <!-- Feedback CTA -->
                    <tr>
                      <td class="mobile-padding" style="padding: 0 40px 30px 40px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center;">
                              <p style="color: #333; font-size: 14px; margin: 0 0 15px 0;">How was your experience?</p>
                              <a href="https://honestinvoice.com/feedback?invoice=${invoice_id}&token=${feedbackToken}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Leave Feedback</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  ` : ''}
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 30px; background-color: #f9f9f9; border-top: 1px solid #eee; text-align: center;">
                      <p style="color: #999; font-size: 12px; margin: 0 0 8px 0;">
                        Powered by <strong style="color: ${primaryColor};">HonestInvoice</strong> — Transparent invoicing made simple
                      </p>
                      <p style="color: #999; font-size: 11px; margin: 0;">
                        <a href="https://honestinvoice.com" style="color: ${primaryColor}; text-decoration: none;">Website</a>
                        &nbsp;•&nbsp;
                        <a href="mailto:support@honestinvoice.com" style="color: ${primaryColor}; text-decoration: none;">Support</a>
                        &nbsp;•&nbsp;
                        <a href="https://honestinvoice.com/privacy" style="color: ${primaryColor}; text-decoration: none;">Privacy</a>
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Send from HonestInvoice domain with user's business name for personalization
    const fromName = business_name ? `${business_name} via HonestInvoice` : 'HonestInvoice';
    const emailResponse = await resend.emails.send({
      from: `${fromName} <invoices@honestinvoice.com>`,
      to: [client_email],
      reply_to: profile?.email || undefined,
      subject: `${docLabel} ${invoice_number} from ${business_name || 'HonestInvoice'} - $${total_amount.toFixed(2)}`,
      html: emailHtml,
    });

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    // Update the sent count in the database
    const { error: updateError } = await supabaseClient
      .from("invoices")
      .update({ sent_count: sentCount + 1 })
      .eq("id", invoice_id);

    if (updateError) {
      logStep("Warning: Could not increment sent_count", { error: updateError.message });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Invoice email sent successfully",
      email_id: emailResponse.data?.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Helper function to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex color
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  r = Math.max(0, Math.min(255, r + (r * percent / 100)));
  g = Math.max(0, Math.min(255, g + (g * percent / 100)));
  b = Math.max(0, Math.min(255, b + (b * percent / 100)));
  
  // Convert back to hex
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}