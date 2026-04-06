import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Accept raw email body text (forwarded from Nextdoor notification)
    const body = await req.json();
    const emailBody = body.email_body || body.text || body.html || body.content || '';

    if (!emailBody || emailBody.trim().length < 20) {
      return new Response(JSON.stringify({ error: 'Email body is required (min 20 chars)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Received Nextdoor email notification, length:', emailBody.length);

    // Step 1: Use AI to extract lead details from the email
    const extractionPrompt = `You are parsing a forwarded email notification from the Nextdoor app about a local service request (likely a dump run, junk removal, or similar job).

Extract the following fields from the email content. If a field is not found, use null.

Return ONLY valid JSON with these fields:
{
  "poster_name": "name of the person who posted (or null)",
  "job_description": "what they need done — be specific and include all details mentioned",
  "location": "neighborhood, city, or area mentioned (or null)",
  "contact_info": "any phone number or email found (or null)",
  "post_url": "any Nextdoor URL found (or null)",
  "is_relevant": true/false — is this actually a service request for dump runs, junk removal, hauling, or similar contractor work?
}

If the email is NOT a relevant service request (e.g. it's a general neighborhood post, news, etc.), set is_relevant to false.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: extractionPrompt },
          { role: 'user', content: `Here is the forwarded Nextdoor email:\n\n${emailBody}` },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI extraction failed:', aiResponse.status, errText);
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';
    const cleanJson = rawContent.replace(/```json\n?|\n?```/g, '').trim();

    let extracted: any;
    try {
      extracted = JSON.parse(cleanJson);
    } catch {
      console.error('Failed to parse AI extraction:', rawContent.slice(0, 300));
      return new Response(JSON.stringify({ error: 'Could not parse email content', raw: rawContent.slice(0, 200) }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Skip irrelevant posts
    if (!extracted.is_relevant) {
      console.log('Post deemed not relevant, skipping');
      return new Response(JSON.stringify({ message: 'Not a relevant service request, skipped', extracted }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log('Extracted lead:', JSON.stringify(extracted).slice(0, 300));

    // Step 2: Forward to process-lead (reuse the existing pipeline)
    const processResponse = await fetch(`${SUPABASE_URL}/functions/v1/process-lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        poster_name: extracted.poster_name || 'Nextdoor User',
        contact_info: extracted.contact_info || null,
        job_description: extracted.job_description || emailBody.slice(0, 500),
        location: extracted.location || null,
        post_url: extracted.post_url || null,
        date_posted: new Date().toISOString(),
        source: 'nextdoor',
      }),
    });

    const processResult = await processResponse.json();
    console.log('Lead processed:', JSON.stringify(processResult));

    // Step 3: Send notification email to owner
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      const notifBody = {
        from: 'HonestInvoice <payments@honestinvoice.app>',
        to: ['murdochcpm_08@yahoo.com'],
        subject: `🔔 New Nextdoor Lead: ${(extracted.job_description || 'Service Request').slice(0, 50)}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #228B22; margin-bottom: 8px;">New Lead from Nextdoor</h2>
            <p><strong>Job:</strong> ${extracted.job_description || 'N/A'}</p>
            <p><strong>Posted by:</strong> ${extracted.poster_name || 'Unknown'}</p>
            <p><strong>Location:</strong> ${extracted.location || 'Not specified'}</p>
            <p><strong>Contact:</strong> ${extracted.contact_info || 'Not found'}</p>
            ${extracted.post_url ? `<p><a href="${extracted.post_url}">View on Nextdoor</a></p>` : ''}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 14px;">
              ${processResult.estimate_id ? `✅ Estimate auto-generated (${processResult.line_items_count || 0} line items)` : '⚠️ Estimate could not be auto-generated'}
            </p>
            <p style="color: #9ca3af; font-size: 12px;">Powered by HonestInvoice Nerve Center</p>
          </div>
        `,
      };

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notifBody),
        });
        console.log('Notification email sent to owner');
      } catch (emailErr) {
        console.error('Failed to send notification email:', emailErr);
      }
    }

    return new Response(JSON.stringify({
      message: 'Nextdoor lead processed successfully',
      lead_id: processResult.lead_id,
      estimate_id: processResult.estimate_id,
      extracted,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('process-nextdoor-email error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
