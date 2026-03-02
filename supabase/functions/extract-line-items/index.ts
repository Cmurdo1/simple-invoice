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
    ? `\n\n## REGIONAL PRICING ADJUSTMENT:\nThe customer is located in ${location} with a Cost of Living multiplier of ${colMultiplier}x.\n**IMPORTANT**: Multiply ALL prices (labor and materials) by ${colMultiplier} to reflect regional costs.\nFor example: If national average labor is $85/hr, use $${Math.round(85 * colMultiplier)}/hr for this region.`
    : '';

  const imageInstruction = hasImages
    ? `\n\n## PHOTO ANALYSIS INSTRUCTIONS:\nYou have been provided job-site photos. Carefully analyze them to:\n1. Identify the exact scope of work visible (size, condition, materials present)\n2. Estimate surface area, linear footage, or quantities from visual cues\n3. Note any complications (damage, difficult access, hazardous materials, specialty equipment needed)\n4. Identify materials already on site vs. what needs to be sourced\n5. Assess job complexity to calibrate labor hours accurately\nUse the photos as primary evidence. They override vague descriptions.`
    : '';

  return `You are an expert contractor estimator specializing in work breakdown structures (WBS).

Your task is to DECOMPOSE job descriptions into granular, auditable line items following industry best practices.${imageInstruction}

## CRITICAL RULES:

1. **SEPARATE LABOR FROM MATERIALS** - Always create distinct line items
2. **INCLUDE HIDDEN COSTS** - Don't forget: disposal, prep work, cleanup, permits, travel
3. **BE SPECIFIC WITH QUANTITIES** - Use actual measurements when given, estimate conservatively when not
4. **LOCATION MATTERS** - Include WHERE the work is being done (roof section, room, etc.)

## DECOMPOSITION CHECKLIST (apply to every job):
□ Materials (itemize each material separately)
□ Labor (break down by task type)
□ Equipment/Tool rental if needed
□ Preparation work (protection, moving items, access setup)
□ Disposal/Cleanup fees
□ Travel/Mobilization if applicable

## BASE PRICING GUIDELINES (2024 national average rates):

**Labor Rates (per hour):**
- General labor/helper: $45-65
- Skilled trades (plumbing, electrical, HVAC): $85-125
- Roofing labor: $65-95
- Painting labor: $55-75
- Specialized/licensed work: $100-150

**Common Material Estimates:**
- Standard receptacle/outlet: $3-8 each
- GFCI outlet: $15-25 each
- Light switch: $3-10 each
- Wire (12/2 Romex): $0.80-1.20/ft
- Paint (quality): $35-55/gallon (covers ~350 sq ft)
- Roofing shingles: $30-45/bundle (covers ~33 sq ft)
- Drywall sheet (4x8): $12-18
- Caulk/sealant: $5-12/tube

**Service Minimums:**
- Minimum service call: $75-150
- Disposal fee: $50-150 per load
- Permit fees: varies by jurisdiction
${colAdjustment}

## OUTPUT FORMAT:
Return ONLY a valid JSON array. Each item must have:
- description: Detailed description with WHAT + WHERE + specifications
- quantity: Number (hours, units, sq ft, etc.)
- unit_price: Price per unit in USD (already adjusted for regional pricing)

## SELF-AUDIT BEFORE RESPONDING:
1. Did I separate ALL materials from labor?
2. Did I include disposal/cleanup if there's removal?
3. Did I account for prep work and protection?
4. Are my quantities realistic (not underestimated)?
5. Did I include minimum service charges if job is small?
6. Did I apply the regional pricing multiplier (${colMultiplier}x) to all prices?
7. ${hasImages ? 'Did I use the photos to calibrate quantities and scope accurately?' : 'Did I use all details from the description?'}`;
}

function buildAuditPrompt(colMultiplier: number, location: string): string {
  const regionalNote = colMultiplier !== 1.0 
    ? `\n6. **Regional Pricing** - Are prices adjusted for the ${location} region (${colMultiplier}x multiplier)?`
    : '';

  return `You are a senior estimator auditing a junior estimator's work breakdown.

Review this estimate for COMPLETENESS and ACCURACY:

## AUDIT CHECKLIST:
1. **Missing Items** - Are there obvious items the junior missed?
2. **Underestimated Quantities** - Are quantities realistic?
3. **Price Accuracy** - Are prices within market range for the region?
4. **Labor Time** - Is labor time sufficient for the scope?
5. **Hidden Costs** - Disposal, prep, cleanup, permits included?${regionalNote}

## COMMON MISTAKES TO CATCH:
- Forgetting disposal fees for removal jobs
- Underestimating labor hours
- Missing materials (fasteners, connectors, tape, etc.)
- No minimum service charge for small jobs
- Forgetting prep/protection time
${colMultiplier !== 1.0 ? `- Not applying the ${colMultiplier}x regional pricing multiplier` : ''}

If the estimate is good, return it unchanged.
If there are issues, add the missing items or adjust quantities/prices.

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

    // Use vision-capable model when images are present
    const model = hasImages ? 'google/gemini-2.5-flash' : 'google/gemini-2.5-flash';

    const decompositionPrompt = buildDecompositionPrompt(colMultiplier, locationStr, hasImages);
    const auditPrompt = buildAuditPrompt(colMultiplier, locationStr);

    // Build user message — text + optional images
    const userContent: any[] = [];

    if (hasImages) {
      // Add all images first so the model sees them in context
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
        temperature: 0.2,
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

    // Step 2: Self-audit pass (text only, no need to re-send images)
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
            content: `Original job description:\n${job_description}\n\nLocation: ${locationStr} (COL: ${colMultiplier}x)\n${hasImages ? `Photos analyzed: ${images.length} image(s)\n` : ''}\nInitial estimate to audit:\n${JSON.stringify(items, null, 2)}` 
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
          items = auditedItems;
          console.log('Audit complete, items updated');
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

    console.log(`Returning ${validatedItems.length} validated items`);

    return new Response(
      JSON.stringify({ 
        items: validatedItems,
        item_count: validatedItems.length,
        subtotal: validatedItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0),
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
