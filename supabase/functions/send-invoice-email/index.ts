import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
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
  document_type?: "invoice" | "estimate";
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number | null;
}

function adjustColorBrightness(hex: string, percent: number): string {
  hex = hex.replace(/^#/, "");
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  r = Math.max(0, Math.min(255, r + (r * percent) / 100));
  g = Math.max(0, Math.min(255, g + (g * percent) / 100));
  b = Math.max(0, Math.min(255, b + (b * percent) / 100));
  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g).toString(16).padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
}

function hexToRgba(hex: string, alpha: number): string {
  hex = hex.replace(/^#/, "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Get business initials for monogram
function getInitials(name: string): string {
  if (!name) return "HI";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("subscription_status, subscription_end, email, brand_color, estimate_color, logo_url, phone, address")
      .eq("id", user.id)
      .single();

    if (profileError) throw new Error(`Profile fetch error: ${profileError.message}`);

    const OWNER_EMAIL = "murdochcpm_08@yahoo.com";
    const isOwner = user.email === OWNER_EMAIL;

    const isPro =
      isOwner ||
      (profile?.subscription_status === "pro" &&
        (!profile.subscription_end || new Date(profile.subscription_end) > new Date()));

    if (!isPro) {
      return new Response(
        JSON.stringify({
          error: "Email sending is a Pro feature. Please upgrade to send invoices via email.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    const {
      invoice_id,
      client_email,
      client_name,
      invoice_number,
      total_amount,
      due_date,
      business_name,
      job_description,
      document_type = "invoice",
    }: InvoiceEmailRequest = await req.json();

    if (!client_email || !invoice_number || !invoice_id) {
      throw new Error("Missing required fields: client_email, invoice_number, and invoice_id are required");
    }

    const isEstimate = document_type === "estimate";
    const docLabel = isEstimate ? "Estimate" : "Invoice";
    const docLabelLower = isEstimate ? "estimate" : "invoice";

    const invoiceColor = profile?.brand_color || "#228B22";
    const estimateColor = profile?.estimate_color || "#2563eb";
    const primaryColor = isEstimate ? estimateColor : invoiceColor;
    const lighterColor = adjustColorBrightness(primaryColor, 60);
    const darkerColor = adjustColorBrightness(primaryColor, -25);
    const bgTint = hexToRgba(primaryColor, 0.06);
    const initials = getInitials(business_name);

    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select("feedback_token, sent_count")
      .eq("id", invoice_id)
      .single();

    if (invoiceError) throw new Error(`Could not fetch invoice details: ${invoiceError.message}`);

    const sentCount = invoice?.sent_count || 0;
    if (sentCount >= 15) {
      return new Response(
        JSON.stringify({
          error: "This document has reached the maximum number of email sends.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        },
      );
    }

    const feedbackToken = invoice?.feedback_token;

    const { data: lineItems, error: itemsError } = await supabaseClient
      .from("invoice_items")
      .select("description, quantity, unit_price, total")
      .eq("invoice_id", invoice_id)
      .order("sort_order", { ascending: true });

    if (itemsError) logStep("Warning: Could not fetch line items", { error: itemsError.message });

    const resend = new Resend(resendKey);

    const dueDateText = due_date
      ? new Date(due_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "Upon Job Completion";

    const subtotal = lineItems?.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) || total_amount;
    const taxAmount = total_amount - subtotal;

    // Build line item rows
    const lineItemRows =
      lineItems && lineItems.length > 0
        ? lineItems
            .map(
              (item: InvoiceItem, i: number) => `
        <tr style="background-color: ${i % 2 === 0 ? "#ffffff" : "#fafafa"};">
          <td style="padding: 12px 16px; border-bottom: 1px solid #ececec; color: #2d2d2d; font-size: 14px; line-height: 1.5; word-break: break-word;">
            ${item.description}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ececec; text-align: center; color: #666; font-size: 14px; white-space: nowrap; width: 50px;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ececec; text-align: right; color: #666; font-size: 14px; white-space: nowrap; width: 80px;">
            $${item.unit_price.toFixed(2)}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ececec; text-align: right; font-weight: 600; color: #2d2d2d; font-size: 14px; white-space: nowrap; width: 80px;">
            $${(item.quantity * item.unit_price).toFixed(2)}
          </td>
        </tr>
      `,
            )
            .join("")
        : "";

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${docLabel} ${invoice_number}</title>
  <style>
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0; padding: 0; background-color: #ede8e0; font-family: Georgia, 'Times New Roman', serif; }
    @media only screen and (max-width: 600px) {
      .email-card { width: 100% !important; border-radius: 0 !important; }
      .content-pad { padding: 24px 20px !important; }
      .header-pad { padding: 20px !important; }
      .amount-text { font-size: 32px !important; }
      .hide-mobile { display: none !important; }
      .table-sm td { padding: 10px 10px !important; font-size: 13px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ede8e0;">
  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#ede8e0;">
    ${docLabel} ${invoice_number} · $${total_amount.toFixed(2)} from ${business_name || "HonestInvoice"}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#ede8e0;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Card -->
        <table role="presentation" class="email-card" cellspacing="0" cellpadding="0" border="0"
          style="max-width:580px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10),0 1px 4px rgba(0,0,0,0.06);">

          <!-- ===== HEADER ===== -->
          <tr>
            <td class="header-pad" style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #ececec;">
              ${
                profile?.logo_url
                  ? `<img src="${profile.logo_url}" alt="${business_name}" style="max-width:120px;max-height:56px;margin:0 auto 12px;display:block;">`
                  : `
                <!-- Monogram circle -->
                <div style="display:inline-block;width:60px;height:60px;border-radius:50%;border:2px solid ${primaryColor};background-color:#ffffff;text-align:center;line-height:56px;margin:0 auto 12px;">
                  <span style="color:${primaryColor};font-family:Georgia,serif;font-size:20px;font-weight:600;letter-spacing:1px;">${initials}</span>
                </div>
              `
              }
              <p style="color:#888;margin:0;font-size:13px;font-style:italic;letter-spacing:0.3px;">Fair Prices. Honest Work.</p>
            </td>
          </tr>

          <!-- ===== AMOUNT BANNER ===== -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background:linear-gradient(135deg,${primaryColor} 0%,${darkerColor} 100%);padding:24px 30px;text-align:center;position:relative;">
                    <p style="color:rgba(255,255,255,0.85);font-size:15px;font-weight:600;margin:0 0 6px 0;font-family:Georgia,serif;letter-spacing:0.5px;">
                      ${docLabel} ${invoice_number}
                    </p>
                    <p class="amount-text" style="color:#ffffff;font-size:40px;font-weight:700;margin:0 0 8px 0;font-family:Georgia,serif;letter-spacing:-1px;">
                      $${total_amount.toFixed(2)}
                    </p>
                    <p style="color:rgba(255,255,255,0.80);font-size:13px;margin:0;font-style:italic;">
                      ${isEstimate ? "Estimated Total" : `Due: ${dueDateText}`}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== BODY ===== -->
          <tr>
            <td class="content-pad" style="padding:30px 40px;">

              <p style="color:#2d2d2d;font-size:15px;line-height:1.6;margin:0 0 8px 0;font-family:Georgia,serif;">
                Hello ${client_name || "there"},
              </p>
              <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px 0;font-family:Arial,sans-serif;">
                Please find your itemized ${docLabelLower} from <strong style="color:#2d2d2d;">${business_name || "HonestInvoice"}</strong> below.
              </p>

              ${
                job_description
                  ? `
              <!-- Job summary -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#f8f6f2;border-left:3px solid ${primaryColor};padding:14px 16px;border-radius:0 4px 4px 0;">
                    <p style="color:#2d2d2d;font-size:13px;font-weight:600;margin:0 0 5px 0;font-family:Arial,sans-serif;letter-spacing:0.3px;">🔧 Job Summary:</p>
                    <p style="color:#555;font-size:13px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">${job_description}</p>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              ${
                lineItems && lineItems.length > 0
                  ? `
              <!-- Line items table -->
              <p style="color:#2d2d2d;font-size:14px;font-weight:700;margin:0 0 10px 0;font-family:Arial,sans-serif;letter-spacing:0.3px;text-transform:uppercase;">Itemized Breakdown</p>
              <table role="presentation" class="table-sm" cellspacing="0" cellpadding="0" border="0" width="100%"
                style="border:1px solid #e0ddd8;border-radius:4px;overflow:hidden;margin-bottom:0;">
                <thead>
                  <tr style="background-color:#f8f6f2;">
                    <th style="padding:10px 16px;text-align:left;font-size:12px;font-weight:600;color:#888;letter-spacing:0.5px;text-transform:uppercase;border-bottom:2px solid ${primaryColor};font-family:Arial,sans-serif;">Description</th>
                    <th style="padding:10px 16px;text-align:center;font-size:12px;font-weight:600;color:#888;letter-spacing:0.5px;text-transform:uppercase;border-bottom:2px solid ${primaryColor};font-family:Arial,sans-serif;width:50px;">Qty</th>
                    <th style="padding:10px 16px;text-align:right;font-size:12px;font-weight:600;color:#888;letter-spacing:0.5px;text-transform:uppercase;border-bottom:2px solid ${primaryColor};font-family:Arial,sans-serif;width:80px;">Price</th>
                    <th style="padding:10px 16px;text-align:right;font-size:12px;font-weight:600;color:#888;letter-spacing:0.5px;text-transform:uppercase;border-bottom:2px solid ${primaryColor};font-family:Arial,sans-serif;width:80px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemRows}
                </tbody>
                <tfoot>
                  <tr style="background-color:#f8f6f2;">
                    <td colspan="3" style="padding:11px 16px;text-align:right;color:#888;font-size:13px;font-family:Arial,sans-serif;">Subtotal:</td>
                    <td style="padding:11px 16px;text-align:right;color:#2d2d2d;font-weight:600;font-size:13px;font-family:Arial,sans-serif;">$${subtotal.toFixed(2)}</td>
                  </tr>
                  ${
                    taxAmount > 0.005
                      ? `
                  <tr style="background-color:#f8f6f2;">
                    <td colspan="3" style="padding:8px 16px;text-align:right;color:#888;font-size:13px;font-family:Arial,sans-serif;">Tax:</td>
                    <td style="padding:8px 16px;text-align:right;color:#2d2d2d;font-weight:500;font-size:13px;font-family:Arial,sans-serif;">$${taxAmount.toFixed(2)}</td>
                  </tr>
                  `
                      : ""
                  }
                  <tr style="background-color:${primaryColor};">
                    <td colspan="3" style="padding:14px 16px;text-align:right;color:#ffffff;font-size:15px;font-weight:700;font-family:Georgia,serif;">
                      Total ${isEstimate ? "Estimate" : "Due"}:
                    </td>
                    <td style="padding:14px 16px;text-align:right;color:#ffffff;font-size:17px;font-weight:700;font-family:Georgia,serif;white-space:nowrap;">
                      $${total_amount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              `
                  : `
              <!-- Simple total card when no line items -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #e0ddd8;border-radius:4px;overflow:hidden;margin-bottom:0;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #ececec;color:#888;font-size:14px;font-family:Arial,sans-serif;">${docLabel} Number</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #ececec;text-align:right;font-weight:600;color:#2d2d2d;font-size:14px;font-family:Arial,sans-serif;">${invoice_number}</td>
                </tr>
                <tr style="background-color:${primaryColor};">
                  <td style="padding:14px 16px;color:#fff;font-size:15px;font-weight:700;font-family:Georgia,serif;">${isEstimate ? "Estimated Amount" : "Amount Due"}</td>
                  <td style="padding:14px 16px;text-align:right;color:#fff;font-size:17px;font-weight:700;font-family:Georgia,serif;">$${total_amount.toFixed(2)}</td>
                </tr>
              </table>
              `
              }

              ${
                !isEstimate
                  ? `
              <!-- Pay Now CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:28px;">
                <tr>
                  <td style="text-align:center;padding:24px;background-color:#f8f6f2;border-radius:4px;border:1px solid #e0ddd8;">
                    <p style="color:#888;font-size:13px;margin:0 0 4px 0;font-family:Arial,sans-serif;">Ready to pay?</p>
                    <p style="color:#2d2d2d;font-size:22px;font-weight:700;margin:0 0 16px 0;font-family:Georgia,serif;">$${total_amount.toFixed(2)}</p>
                    <a href="https://honestinvoice.com/pay/${invoice_id}"
                      style="display:inline-block;background-color:${primaryColor};color:#ffffff;padding:14px 44px;border-radius:4px;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,sans-serif;letter-spacing:0.3px;">
                      Pay Now
                    </a>
                    <p style="color:#aaa;font-size:11px;margin:12px 0 0 0;font-family:Arial,sans-serif;">Secure payment via HonestInvoice</p>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <p style="color:#666;font-size:13px;line-height:1.7;margin:28px 0 0 0;font-family:Arial,sans-serif;">
                Thank you for your business! If you have any questions, please don't hesitate to reach out.
              </p>

              ${
                profile?.phone || profile?.email
                  ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:12px;">
                <tr>
                  <td style="color:#555;font-size:13px;font-family:Arial,sans-serif;padding-top:8px;border-top:1px solid #ececec;">
                    ${profile?.phone ? `<span>📞 <strong>${profile.phone}</strong></span>` : ""}
                    ${profile?.phone && profile?.email ? `&nbsp; &nbsp;|&nbsp; &nbsp;` : ""}
                    ${profile?.email ? `<a href="mailto:${profile.email}" style="color:${primaryColor};text-decoration:none;">✉️ ${profile.email}</a>` : ""}
                  </td>
                </tr>
              </table>
              `
                  : ""
              }
            </td>
          </tr>

          ${
            feedbackToken
              ? `
          <!-- ===== FEEDBACK ===== -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color:#f8f6f2;border:1px solid #e0ddd8;border-radius:4px;padding:24px;text-align:center;">
                    <p style="color:#2d2d2d;font-size:14px;font-weight:600;margin:0 0 8px 0;font-family:Arial,sans-serif;">How was your experience?</p>
                    <p style="color:#aaa;font-size:20px;margin:0 0 16px 0;letter-spacing:4px;">★ ★ ★ ★ ★</p>
                    <a href="https://honestinvoice.com/feedback?invoice=${invoice_id}&token=${feedbackToken}"
                      style="display:inline-block;background-color:${primaryColor};color:#ffffff;padding:11px 30px;border-radius:4px;text-decoration:none;font-weight:600;font-size:13px;font-family:Arial,sans-serif;">
                      Leave Feedback
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }

          <!-- ===== FOOTER ===== -->
          <tr>
            <td style="padding:16px 30px;background-color:#f8f6f2;border-top:1px solid #e0ddd8;text-align:center;">
              <p style="color:#aaa;font-size:11px;margin:0 0 6px 0;font-family:Arial,sans-serif;">
                Powered by <strong style="color:${primaryColor};">HonestInvoice</strong> — Transparent invoicing made simple
              </p>
              <p style="color:#bbb;font-size:11px;margin:0;font-family:Arial,sans-serif;">
                <a href="https://honestinvoice.com" style="color:#aaa;text-decoration:none;">Website</a>
                &nbsp;•&nbsp;
                <a href="mailto:support@honestinvoice.com" style="color:#aaa;text-decoration:none;">Support</a>
                &nbsp;•&nbsp;
                <a href="https://honestinvoice.com/privacy" style="color:#aaa;text-decoration:none;">Privacy</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- End card -->

      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const fromName = business_name ? `${business_name} via HonestInvoice` : "HonestInvoice";
    const emailResponse = await resend.emails.send({
      from: `${fromName} <invoices@honestinvoice.com>`,
      to: [client_email],
      reply_to: profile?.email || undefined,
      subject: `${docLabel} ${invoice_number} from ${business_name || "HonestInvoice"} — $${total_amount.toFixed(2)}`,
      html: emailHtml,
    });

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    const { error: updateError } = await supabaseClient
      .from("invoices")
      .update({ sent_count: sentCount + 1 })
      .eq("id", invoice_id);

    if (updateError) logStep("Warning: Could not increment sent_count", { error: updateError.message });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invoice email sent successfully",
        email_id: emailResponse.data?.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
