import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id is required");

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, client:clients(*), invoice_items(*)")
      .eq("id", invoice_id)
      .maybeSingle();

    if (error || !invoice) throw new Error("Invoice not found");
    if (invoice.status === "paid") throw new Error("This invoice has already been paid");
    if (Number(invoice.total_amount) <= 0) throw new Error("Invoice total must be greater than $0");

    const stripe = new Stripe(Deno.env.get("STRIPE_TRUE_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const invoiceNumber = invoice.invoice_number || invoice_id.slice(0, 8).toUpperCase();
    const origin = req.headers.get("origin") || "https://honest.invoice";

    // Compute late fee (percent per month, prorated by 30-day months overdue)
    const principal = Number(invoice.total_amount) || 0;
    const pct = Number(invoice.late_fee_percent) || 0;
    let lateFee = 0;
    if (pct > 0 && invoice.due_date) {
      const due = new Date(invoice.due_date + "T23:59:59");
      const msOver = Date.now() - due.getTime();
      if (msOver > 0) {
        const months = msOver / (1000 * 60 * 60 * 24 * 30);
        lateFee = +(principal * (pct / 100) * months).toFixed(2);
      }
    }

    const lineItems: any[] = (invoice.invoice_items || []).length > 0
      ? (invoice.invoice_items as any[]).map((item: any) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.description || "Service",
            },
            unit_amount: Math.round(Number(item.unit_price) * 100),
          },
          quantity: Math.max(1, Math.round(Number(item.quantity))),
        }))
      : [{
          price_data: {
            currency: "usd",
            product_data: {
              name: invoice.job_description || `Invoice ${invoiceNumber}`,
            },
            unit_amount: Math.round(Number(invoice.total_amount) * 100),
          },
          quantity: 1,
        }];

    if (lateFee > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: `Late fee (${pct}% per month past due)` },
          unit_amount: Math.round(lateFee * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: invoice.client?.email || undefined,
      line_items: lineItems,
      mode: "payment",
      payment_intent_data: {
        metadata: {
          invoice_id,
          contractor_user_id: invoice.user_id,
        },
      },
      metadata: {
        invoice_id,
        contractor_user_id: invoice.user_id,
      },
      success_url: `${origin}/pay/${invoice_id}?payment=success`,
      cancel_url: `${origin}/pay/${invoice_id}?payment=cancelled`,
      payment_method_types: ["card"],
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("create-public-invoice-payment error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
