import "https://deno.land/std@0.168.0/dotenv/load.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageInput {
  base64: string;
  mimeType: string;
}

function buildDecompositionPrompt(colMultiplier: number, location: string, hasImages: boolean): string {
  const colAdjustment = colMultiplier !== 1.0 
    ? `\n\n## REGIONAL PRICING ADJUSTMENT:\nThe customer is located in ${location} with a Cost of Living multiplier of ${colMultiplier}x.\n**IMPORTANT**: Multiply ALL prices (labor and materials) by ${colMultiplier} to reflect regional costs.\nFor example: If national average labor is $65/hr, use $${Math.round(65 * colMultiplier)}/hr for this region.`
    : '';

  const imageInstruction = hasImages
    ? `\n\n## PHOTO ANALYSIS INSTRUCTIONS:\nYou have been provided job-site photos. Carefully analyze them to:\n1. Identify the EXACT scope of work visible — measure only what's shown\n2. Estimate surface area or quantities from visual cues — be conservative\n3. Note complications only if clearly visible (damage, difficult access, hazmat)\n4. Identify materials already on site vs. what needs to be sourced\n5. Calibrate labor hours to match the visible scope — don't over-inflate\nUse the photos as primary evidence. Do NOT assume work beyond what is visible.`
    : '';

  return `You are an expert contractor estimator. Your job is to produce ACCURATE, REALISTIC line item breakdowns that match real-world job costs.${imageInstruction}

## #1 RULE — STAY IN SCOPE:
Read the description carefully. Estimate ONLY what is described. Do NOT add scope that was not mentioned. A small repair job should produce a small estimate. A $500 job should not come back as $5,000.

## SCOPE CALIBRATION — USE THIS TO SIZE YOUR ESTIMATE:
- Small jobs (patch, fix, clean, minor repair, simple install): $75–$800 total
- Medium jobs (room repaint, fixture swap, small deck repair, appliance install): $500–$3,000 total
- Large jobs (full room remodel, roof section, HVAC install, whole-house paint): $3,000–$15,000 total
- Major projects (full bathroom gut, large addition, full HVAC system): $10,000–$50,000 total

Read the description, decide which tier it belongs to, then generate ONLY items that fit that tier's total.

## CRITICAL RULES:
1. **MATCH THE DESCRIBED SCOPE** — If a small area is mentioned, price for that area only
2. **REALISTIC QUANTITIES** — Don't inflate hours or materials. A 2-hour job is 2 hours.
3. **SEPARATE LABOR FROM MATERIALS** — Distinct line items for each
4. **INCLUDE HIDDEN COSTS** — Only add disposal, permits, or mobilization if the job clearly requires them
5. **NO SCOPE CREEP** — Do not add items for work not mentioned or implied by the description
${colAdjustment}

## BASE PRICING GUIDELINES (2024 national averages):

**Labor Rates (per hour):**
- General labor/helper: $45–65/hr
- Skilled trades (plumbing, electrical, HVAC): $85–125/hr
- Roofing labor: $65–95/hr
- Painting labor: $55–75/hr
- Specialized/licensed work: $100–150/hr

**Common Materials:**
- Paint (quality): $35–55/gallon (covers ~350 sq ft)
- Roofing shingles: $30–45/bundle (covers ~33 sq ft)
- Drywall sheet (4x8): $12–18
- Wire (12/2 Romex): $0.80–1.20/ft
- Caulk/sealant: $5–12/tube
- GFCI outlet: $15–25 each
- Standard outlet/switch: $3–10 each

## OUTPUT FORMAT:
Return ONLY a valid JSON array. Each item must have:
- description: Clear description with WHAT + WHERE
- quantity: Realistic number (hours, units, sq ft, etc.)
- unit_price: Price per unit in USD (adjusted for regional pricing if applicable)

## MANDATORY SELF-CHECK BEFORE RESPONDING:
1. What is the realistic real-world cost for this job? Does my TOTAL match that?
2. Are my labor hours proportional to the scope (not padded)?
3. Are quantities tied to actual measurements or reasonable estimates — not inflated?
4. Did I add items only for what was explicitly described?
5. Did I apply the regional pricing multiplier (${colMultiplier}x) to all prices?
6. ${hasImages ? 'Did I use the photos to calibrate scope — not over-estimating beyond what is visible?' : 'Is my total within a sane range for what was described?'}`;
}

function buildAuditPrompt(colMultiplier: number, location: string): string {
  const regionalNote = colMultiplier !== 1.0 
    ? `\n6. **Regional Pricing** — Are prices correctly adjusted for the ${location} region (${colMultiplier}x multiplier)?`
    : '';

  return `You are a senior estimator reviewing a junior estimator's bid for ACCURACY and REALISM.

## YOUR JOB:
- Verify the total makes sense for the described scope
- Catch inflated quantities or labor hours
- Catch missing items (disposal, prep) only if the job clearly requires them
- Catch scope creep — items added that were NOT in the original description

## AUDIT CHECKLIST:
1. **Scope match** — Does the total reflect the size of job described? A small job should have a small total.
2. **Labor hours** — Are they realistic, not padded?
3. **Quantities** — Are they tied to real measurements, not inflated?
4. **Price accuracy** — Are unit prices within 2024 market range?
5. **No scope creep** — Are all items traceable back to the description?${regionalNote}

## COMMON MISTAKES TO CATCH:
- Inflating a 3-hour job to 20+ hours
- Adding mobilization, permits, or disposal when not needed for the described job
- Multiplying quantities without justification
- Generating 15+ line items for a simple 2-item job
${colMultiplier !== 1.0 ? `- Not applying the ${colMultiplier}x regional pricing multiplier` : ''}

If the estimate total is disproportionate to the described scope, REDUCE it to match reality.
If the estimate is accurate, return it unchanged.

Return ONLY the corrected JSON array.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { job_description, col_multiplier, location, images } = await req.json();

    if (!job_description && (!images || images.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Job description or images are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const colMultiplier = typeof col_multiplier === 'number' && col_multiplier > 0 ? col_multiplier : 1.0;
    const locationStr = location || 'United States (national average)';
    const hasImages = Array.isArray(images) && images.length > 0;
    
    console.log(`Processing with COL multiplier: ${colMultiplier} for location: ${locationStr}, images: ${hasImages ? images.length : 0}`);

    const model = 'google/gemini-2.5-flash';

    const decompositionPrompt = buildDecompositionPrompt(colMultiplier, locationStr, hasImages);
    const auditPrompt = buildAuditPrompt(colMultiplier, locationStr);

    // Build user message — text + optional images
    const userContent: any[] = [];

    if (hasImages) {
      for (const img of images as ImageInput[]) {
        userContent.push({
          type: 'image_url',
          image_url: {
            url: `data:${img.mimeType};base64,${img.base64}`,
          },
        });
      }
    }

    userContent.push({
      type: 'text',
      text: hasImages
        ? `Analyze the job site photos above and this description, then decompose into line items:\n\n${job_description}`
        : `Decompose this job into line items:\n\n${job_description}`,
    });

    // Step 1: Initial decomposition
    console.log('Step 1: Decomposing job description...');
    const decompositionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: decompositionPrompt },
          { role: 'user', content: hasImages ? userContent : userContent[0].text },
        ],
        temperature: 0.1,
      }),
    });

    if (!decompositionResponse.ok) {
      const errorText = await decompositionResponse.text();
      console.error('Decomposition error:', errorText);
      throw new Error(`AI decomposition failed: ${decompositionResponse.status}`);
    }

    const decompositionData = await decompositionResponse.json();
    const initialEstimate = decompositionData.choices?.[0]?.message?.content || '[]';
    
    let items;
    try {
      const cleanContent = initialEstimate.replace(/```json\n?|\n?```/g, '').trim();
      items = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse initial estimate:', initialEstimate);
      items = [];
    }

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ items: [], audit_notes: 'Could not parse job description' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const initialTotal = items.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    console.log(`Initial estimate total: $${initialTotal.toFixed(2)}, items: ${items.length}`);

    // Step 2: Self-audit pass
    console.log('Step 2: Auditing estimate...');
    const auditResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: auditPrompt },
          { 
            role: 'user', 
            content: `Original job description:\n${job_description}\n\nLocation: ${locationStr} (COL: ${colMultiplier}x)\n${hasImages ? `Photos analyzed: ${images.length} image(s)\n` : ''}\nInitial estimate to audit (total: $${initialTotal.toFixed(2)}):\n${JSON.stringify(items, null, 2)}` 
          }
        ],
        temperature: 0.1,
      }),
    });

    if (auditResponse.ok) {
      const auditData = await auditResponse.json();
      const auditedEstimate = auditData.choices?.[0]?.message?.content || '';
      
      try {
        const cleanAudit = auditedEstimate.replace(/```json\n?|\n?```/g, '').trim();
        const auditedItems = JSON.parse(cleanAudit);
        if (Array.isArray(auditedItems) && auditedItems.length > 0) {
          const auditedTotal = auditedItems.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
          console.log(`Audited estimate total: $${auditedTotal.toFixed(2)}, items: ${auditedItems.length}`);
          items = auditedItems;
        }
      } catch {
        console.log('Audit parse failed, using initial estimate');
      }
    }

    const validatedItems = items
      .filter((item: any) => item.description && typeof item.quantity === 'number' && typeof item.unit_price === 'number')
      .map((item: any) => ({
        description: String(item.description).trim(),
        quantity: Math.max(0, Number(item.quantity)),
        unit_price: Math.max(0, Number(item.unit_price)),
      }));

    const finalTotal = validatedItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    console.log(`Returning ${validatedItems.length} validated items, total: $${finalTotal.toFixed(2)}`);

    return new Response(
      JSON.stringify({ 
        items: validatedItems,
        item_count: validatedItems.length,
        subtotal: finalTotal,
        col_multiplier_applied: colMultiplier,
        location: locationStr,
        photos_analyzed: hasImages ? images.length : 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
