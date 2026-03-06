import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_INVOICE_WEBHOOK");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      // Fallback for dev without webhook secret
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid" && session.metadata?.invoice_id) {
      const invoice_id = session.metadata.invoice_id;
      const contractor_user_id = session.metadata.contractor_user_id;

      console.log(`Payment completed for invoice ${invoice_id}`);

      // Mark invoice as paid
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", invoice_id);

      if (updateError) {
        console.error("Failed to mark invoice as paid:", updateError);
      } else {
        console.log(`Invoice ${invoice_id} marked as paid`);
      }

      // Fetch invoice + profile to send notification email
      try {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("*, client:clients(*)")
          .eq("id", invoice_id)
          .maybeSingle();

        const { data: profile } = await supabase
          .from("profiles")
          .select("email, business_name")
          .eq("id", contractor_user_id)
          .maybeSingle();

        const contractorEmail = profile?.email;
        const clientName = invoice?.client?.name || session.customer_details?.name || "Your client";
        const amount = ((session.amount_total || 0) / 100).toFixed(2);
        const invoiceNumber = invoice?.invoice_number || invoice_id.slice(0, 8).toUpperCase();

        if (contractorEmail) {
          // Send notification to contractor via Resend
          const resendKey = Deno.env.get("RESEND_API_KEY");
          if (resendKey) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "HonestInvoice <payments@honestinvoice.app>",
                to: [contractorEmail],
                subject: `💰 Payment received: ${invoiceNumber} — $${amount}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: #16a34a; margin-bottom: 8px;">Payment Received!</h2>
                    <p style="color: #374151; font-size: 16px;">
                      <strong>${clientName}</strong> just paid <strong>$${amount}</strong> for invoice <strong>${invoiceNumber}</strong>.
                    </p>
                    <p style="color: #6b7280; font-size: 14px;">The invoice has been automatically marked as paid.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p style="color: #9ca3af; font-size: 12px;">Powered by HonestInvoice</p>
                  </div>
                `,
              }),
            });
          }
        }

        // Send receipt to client if email is known
        const clientEmail = invoice?.client?.email || session.customer_details?.email;
        if (clientEmail) {
          const resendKey = Deno.env.get("RESEND_API_KEY");
          if (resendKey) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "HonestInvoice <payments@honestinvoice.app>",
                to: [clientEmail],
                subject: `Payment confirmed: ${invoiceNumber}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: #16a34a; margin-bottom: 8px;">Payment Confirmed ✓</h2>
                    <p style="color: #374151; font-size: 16px;">
                      Your payment of <strong>$${amount}</strong> for invoice <strong>${invoiceNumber}</strong> has been received.
                    </p>
                    <p style="color: #6b7280; font-size: 14px;">Thank you for your payment!</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p style="color: #9ca3af; font-size: 12px;">Powered by HonestInvoice</p>
                  </div>
                `,
              }),
            });
          }
        }
      } catch (notifyErr) {
        console.error("Error sending payment notifications:", notifyErr);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
