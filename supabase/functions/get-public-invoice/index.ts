import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
      .select(`
        id,
        invoice_number,
        status,
        total_amount,
        tax_amount,
        job_description,
        due_date,
        type,
        user_id,
        client:clients(name, email),
        invoice_items(id, description, quantity, unit_price, sort_order)
      `)
      .eq("id", invoice_id)
      .maybeSingle();

    if (error || !invoice) throw new Error("Invoice not found");

    // Fetch contractor profile (limited public fields)
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, email")
      .eq("id", invoice.user_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        invoice: {
          ...invoice,
          profiles: profile,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  }
});
