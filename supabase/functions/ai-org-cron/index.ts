// AI Org autonomous heartbeat. pg_cron calls this every N minutes.
// It checks settings, opens a run, asks the CEO to do its rounds, then closes the run.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Check if autonomous mode is enabled
    const { data: settings } = await supabase.from('ai_org_settings').select('*').eq('id', 1).maybeSingle();
    if (!settings?.autonomous_enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: 'autonomous_enabled is false' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Open a run record
    const { data: runRow, error: runErr } = await supabase
      .from('ai_org_runs')
      .insert({ triggered_by: 'cron', status: 'running' })
      .select()
      .single();
    if (runErr) throw runErr;
    const run_id = runRow.id;

    // 3. Decide whether this should be a daily-brief run
    const now = new Date();
    const utcHour = now.getUTCHours();
    const today = now.toISOString().split('T')[0];
    const briefDue = settings.daily_brief_hour != null
      && utcHour === settings.daily_brief_hour
      && settings.last_brief_date !== today;

    // 4. Build the CEO prompt
    let userPrompt: string;
    if (briefDue) {
      userPrompt = `Time for the daily brief. Delegate to the Custodian to compile a report covering:
- New leads in the last 24h and what was done with them
- Invoices sent / paid / outstanding
- Stripe activity
- Any failed actions from the audit log
Then have the Custodian email the report to ${'murdochcpm_08@yahoo.com'}.

After that, do a quick rounds-check: any new leads still untouched? Send Sales to handle them.`;
    } else {
      userPrompt = `Autonomous rounds check. Delegate as needed:
- Sales: process any leads with status='new' that have email contacts, send_estimate=true. For phone-only leads, generate the estimate but don't send.
- Custodian: check the last hour's actions for failures.
Be efficient. If there's nothing to do, just report "all clear".`;
    }

    // 5. Call the nerve-agent (CEO) with the internal secret
    const agentRes = await fetch(`${SUPABASE_URL}/functions/v1/nerve-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({
        internal_secret: SUPABASE_SERVICE_ROLE_KEY,
        triggered_by: 'cron',
        run_id,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const agentData = await agentRes.json();
    const summary = agentData.content || agentData.error || 'No summary';

    // 6. Count actions for this run
    const { count } = await supabase
      .from('ai_actions')
      .select('id', { count: 'exact', head: true })
      .eq('run_id', run_id);

    // 7. Close the run
    await supabase
      .from('ai_org_runs')
      .update({
        status: agentRes.ok ? 'completed' : 'failed',
        summary: summary.slice(0, 2000),
        actions_count: count || 0,
        completed_at: new Date().toISOString(),
        error: agentRes.ok ? null : summary,
      })
      .eq('id', run_id);

    if (briefDue) {
      await supabase.from('ai_org_settings').update({ last_brief_date: today }).eq('id', 1);
    }

    return new Response(JSON.stringify({ success: true, run_id, actions: count, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('ai-org-cron error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
