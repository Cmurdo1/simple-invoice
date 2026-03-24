import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAIL = "murdochcpm_08@yahoo.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Only allow the owner account
    if (user.email !== OWNER_EMAIL) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, subject, body, replyTo } = await req.json();

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendKey);

    const recipients = Array.isArray(to) ? to : [to];

    const { data, error } = await resend.emails.send({
      from: "Honest Invoice Support <support@honestinvoice.com>",
      to: recipients,
      subject,
      replyTo: replyTo || OWNER_EMAIL,
      html: body
        .split("\n")
        .map((line: string) => `<p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:15px;color:#333;line-height:1.6;">${line || "&nbsp;"}</p>`)
        .join(""),
      text: body,
    });

    if (error) throw new Error(`Resend error: ${error.message}`);

    console.log(`[SEND-SUPPORT-EMAIL] Sent to ${recipients.join(", ")} | id: ${data?.id}`);

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[SEND-SUPPORT-EMAIL] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
