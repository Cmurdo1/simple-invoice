// Scheduled reminder sender.
// 1) Flips sent invoices to overdue when past due_date.
// 2) Sends reminder emails at 7/14/30 days past due (once per threshold).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REMINDER_DAYS = [7, 14, 30];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // 1. Flip past-due sent invoices to overdue
    const { data: markedData } = await supabase.rpc("mark_overdue_invoices");
    const marked = Number(markedData) || 0;

    // 2. Find overdue invoices with an email address that qualify for a reminder
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(`
        id, invoice_number, total_amount, due_date, user_id, reminder_count,
        last_reminder_sent_at, job_description, type,
        client:clients(name, email),
        profiles:profiles!invoices_user_id_fkey(business_name, subscription_status, subscription_end)
      `)
      .eq("status", "overdue")
      .eq("type", "invoice")
      .not("due_date", "is", null);

    if (error) throw error;

    let sent = 0;
    const today = new Date();
    const results: any[] = [];

    for (const inv of invoices || []) {
      const client = (inv as any).client;
      const profile = (inv as any).profiles;
      if (!client?.email) continue;

      // Only Pro users send auto-reminders
      const isPro =
        profile?.subscription_status === "pro" &&
        (!profile?.subscription_end || new Date(profile.subscription_end) > today);
      if (!isPro) continue;

      const due = new Date(inv.due_date + "T23:59:59");
      const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      if (daysOverdue <= 0) continue;

      const nextThresholdIdx = inv.reminder_count ?? 0;
      if (nextThresholdIdx >= REMINDER_DAYS.length) continue;
      const nextThreshold = REMINDER_DAYS[nextThresholdIdx];
      if (daysOverdue < nextThreshold) continue;

      try {
        const { error: sendErr } = await supabase.functions.invoke("send-invoice-email", {
          body: {
            invoice_id: inv.id,
            client_email: client.email,
            client_name: client.name || "",
            invoice_number: inv.invoice_number || inv.id.slice(0, 8),
            total_amount: Number(inv.total_amount),
            due_date: inv.due_date,
            business_name: profile?.business_name || "HonestInvoice",
            job_description: inv.job_description,
            document_type: "invoice",
            reminder: true,
            days_overdue: daysOverdue,
          },
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
        });
        if (sendErr) {
          results.push({ id: inv.id, error: sendErr.message });
          continue;
        }
        await supabase
          .from("invoices")
          .update({
            reminder_count: nextThresholdIdx + 1,
            last_reminder_sent_at: new Date().toISOString(),
          })
          .eq("id", inv.id);
        sent++;
        results.push({ id: inv.id, days_overdue: daysOverdue, threshold: nextThreshold });
      } catch (e: any) {
        results.push({ id: inv.id, error: String(e?.message || e) });
      }
    }

    return new Response(
      JSON.stringify({ marked_overdue: marked, reminders_sent: sent, details: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("send-overdue-reminders error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
