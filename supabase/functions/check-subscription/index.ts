import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First check if user has a manually set subscription in the database
    const { data: existingProfile } = await supabaseClient
      .from("profiles")
      .select("subscription_status, subscription_end")
      .eq("id", user.id)
      .single();

    // If user has a valid manual subscription (e.g., admin-granted), respect it
    if (existingProfile?.subscription_status === "pro") {
      const subEnd = existingProfile.subscription_end ? new Date(existingProfile.subscription_end) : null;
      if (!subEnd || subEnd > new Date()) {
        logStep("Manual pro subscription found in database", { 
          status: existingProfile.subscription_status,
          end: existingProfile.subscription_end 
        });
        return new Response(JSON.stringify({ 
          subscribed: true,
          subscription_status: "pro",
          subscription_end: existingProfile.subscription_end
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      
      // Only update if not already manually set
      if (existingProfile?.subscription_status !== "pro") {
        await supabaseClient
          .from("profiles")
          .update({ 
            subscription_status: "free",
            subscription_end: null,
            stripe_customer_id: null
          })
          .eq("id", user.id);
      }
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_status: "free",
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd: string | null = null;
    let subscriptionStatus = "free";

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      subscriptionStatus = "pro";
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd 
      });
    } else {
      logStep("No active subscription found");
    }

    // Update profile with subscription info
    await supabaseClient
      .from("profiles")
      .update({ 
        subscription_status: subscriptionStatus,
        subscription_end: subscriptionEnd,
        stripe_customer_id: customerId
      })
      .eq("id", user.id);

    logStep("Profile updated with subscription status");

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_status: subscriptionStatus,
      subscription_end: subscriptionEnd
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
