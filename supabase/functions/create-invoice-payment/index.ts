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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id is required");

    // Fetch invoice with items and client
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select("*, client:clients(*), invoice_items(*)")
      .eq("id", invoice_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (invoiceError || !invoice) throw new Error("Invoice not found");
    if (Number(invoice.total_amount) <= 0) throw new Error("Invoice total must be greater than $0 to accept payment");

    // Fetch contractor's profile for business name
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("business_name, email")
      .eq("id", userData.user.id)
      .maybeSingle();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const businessName = profile?.business_name || "HonestInvoice";
    const invoiceNumber = invoice.invoice_number || invoice_id.slice(0, 8).toUpperCase();
    const totalCents = Math.round(Number(invoice.total_amount) * 100);
    const origin = req.headers.get("origin") || "https://honest.invoice";

    // Build line items for Stripe
    const lineItems = (invoice.invoice_items || []).length > 0
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
            unit_amount: totalCents,
          },
          quantity: 1,
        }];

    const session = await stripe.checkout.sessions.create({
      customer_email: invoice.client?.email || undefined,
      line_items: lineItems,
      mode: "payment",
      payment_intent_data: {
        metadata: {
          invoice_id,
          contractor_user_id: userData.user.id,
        },
      },
      metadata: {
        invoice_id,
        contractor_user_id: userData.user.id,
      },
      success_url: `${origin}/pay/${invoice_id}?payment=success`,
      cancel_url: `${origin}/pay/${invoice_id}?payment=cancelled`,
      payment_method_types: ["card"],
    });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("create-invoice-payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
