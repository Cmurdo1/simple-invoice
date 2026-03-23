import "https://deno.land/std@0.168.0/dotenv/load.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageInput {
  base64: string;
  mimeType: string;
}

// ─── Model Registry ───────────────────────────────────────────────────────────

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const LOVABLE_BASE_URL = 'https://ai.gateway.lovable.dev/v1';

interface ModelConfig {
  provider: 'nvidia' | 'lovable';
  modelId: string;
  supportsVision: boolean;
  label: string;
}

const MODEL_REGISTRY: Record<string, ModelConfig> = {
  // NVIDIA NIM models
  'nvidia/llama-3.3-70b-instruct': {
    provider: 'nvidia', modelId: 'meta/llama-3.3-70b-instruct',
    supportsVision: false, label: 'Llama 3.3 70B (NVIDIA)',
  },
  'nvidia/llama-3.2-90b-vision': {
    provider: 'nvidia', modelId: 'meta/llama-3.2-90b-vision-instruct',
    supportsVision: true, label: 'Llama 3.2 90B Vision (NVIDIA)',
  },
  'nvidia/mistral-nemo': {
    provider: 'nvidia', modelId: 'mistralai/mistral-nemo-12b-instruct',
    supportsVision: false, label: 'Mistral Nemo 12B (NVIDIA)',
  },
  'nvidia/qwen2.5-72b': {
    provider: 'nvidia', modelId: 'qwen/qwen2.5-72b-instruct',
    supportsVision: false, label: 'Qwen 2.5 72B (NVIDIA)',
  },
  // Lovable AI models (fallback / default)
  'google/gemini-2.5-flash': {
    provider: 'lovable', modelId: 'google/gemini-2.5-flash',
    supportsVision: true, label: 'Gemini 2.5 Flash',
  },
  'google/gemini-2.5-pro': {
    provider: 'lovable', modelId: 'google/gemini-2.5-pro',
    supportsVision: true, label: 'Gemini 2.5 Pro',
  },
};

const DEFAULT_MODEL = 'google/gemini-2.5-flash';

// ─── AI Call Helper ───────────────────────────────────────────────────────────

async function callAI(
  modelKey: string,
  messages: any[],
  lovableKey: string,
  nvidiaKey: string | null,
  temperature = 0.1
): Promise<string> {
  const config = MODEL_REGISTRY[modelKey] ?? MODEL_REGISTRY[DEFAULT_MODEL];
  const isNvidia = config.provider === 'nvidia' && nvidiaKey;

  const baseUrl = isNvidia ? NVIDIA_BASE_URL : LOVABLE_BASE_URL;
  const authKey = isNvidia ? nvidiaKey! : lovableKey;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.modelId,
      messages,
      temperature,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`[${config.label}] ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Price Research ──────────────────────────────────────────────────────────

async function fetchPricesWithPerplexity(
  jobDescription: string,
  location: string,
  apiKey: string
): Promise<string> {
  console.log('Using Perplexity for real-time price research...');

  const query = `What are current 2025 market rates for labor and materials for this type of contractor work in ${location}? Provide specific price ranges per hour for labor and per unit for materials.\n\nJob: ${jobDescription.slice(0, 500)}`;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a construction cost analyst. Return ONLY a concise bullet-point list of current market rates for labor (per hour) and key materials (per unit) relevant to the described job in the specified region. Be specific with dollar amounts. No prose.',
        },
        { role: 'user', content: query },
      ],
      max_tokens: 600,
      temperature: 0.1,
      search_recency_filter: 'month',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Perplexity error:', response.status, err);
    throw new Error(`Perplexity failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  console.log('Perplexity price data retrieved:', content.slice(0, 200));
  return content;
}

async function fetchPricesWithModel(
  jobDescription: string,
  location: string,
  colMultiplier: number,
  modelKey: string,
  lovableKey: string,
  nvidiaKey: string | null
): Promise<string> {
  const providerName = (MODEL_REGISTRY[modelKey]?.provider === 'nvidia' && nvidiaKey) ? 'NVIDIA' : 'Lovable AI';
  console.log(`Using ${providerName} for knowledge-based price research...`);

  const prompt = `You are a construction cost analyst with deep knowledge of regional pricing across the United States.

Job type: ${jobDescription.slice(0, 600)}
Region: ${location} (Cost of Living multiplier: ${colMultiplier}x vs national average)

Provide a concise, specific pricing reference for this job type in this region. Include:
1. Labor rates per hour for each trade type involved (adjusted for the ${colMultiplier}x COL multiplier)
2. Key material costs per unit (adjusted for regional pricing)
3. Typical total job cost range for this scope in this region
4. Any regional factors that affect pricing (weather, permitting, union rules, etc.)

Be specific with dollar amounts. Base your answer on current 2024-2025 market conditions.
Format as a clear bullet-point reference list. No prose introductions.`;

  const content = await callAI(
    modelKey,
    [{ role: 'user', content: prompt }],
    lovableKey,
    nvidiaKey,
    0.1
  );

  console.log('Price research retrieved:', content.slice(0, 200));
  return content;
}

// ─── Prompt Builders ─────────────────────────────────────────────────────────

function buildDecompositionPrompt(
  colMultiplier: number,
  location: string,
  hasImages: boolean,
  priceResearch: string
): string {
  const colNote = colMultiplier !== 1.0
    ? `\n\n## REGIONAL PRICING (MANDATORY):\nLocation: ${location} | COL Multiplier: ${colMultiplier}x\nYou MUST multiply ALL labor and material prices by ${colMultiplier}. Example: $65/hr labor → $${Math.round(65 * colMultiplier)}/hr`
    : '';

  const imageNote = hasImages
    ? `\n\n## PHOTO ANALYSIS:\nAnalyze the job-site photos. Estimate ONLY the visible scope — do not add work beyond what is shown. Use photos to calibrate quantities and identify materials on-site vs. needed.`
    : '';

  return `You are an expert contractor estimator. Generate ACCURATE, REALISTIC line item breakdowns.

## VERIFIED MARKET PRICES FOR THIS JOB/REGION:
${priceResearch}
${colNote}
${imageNote}

## LABOR HOUR BENCHMARKS — READ BEFORE ESTIMATING:
These are TOTAL hours for a standard 1-2 person crew. Do NOT double hours by listing separate workers.
List labor as ONE line item per task phase with the total hours for the crew.
- Paint one room (walls + ceiling, 2 coats): 4–6 hrs total
- Paint whole 1,200 sq ft house interior (walls + ceilings): 20–30 hrs total for entire job
- Hang a door: 1–2 hrs
- Replace 1 lockset: 0.5–1 hr
- Install a light fixture: 1–2 hrs
- Patch drywall (per hole): 0.5–1 hr
- Install a faucet: 1–2 hrs
- Unclog a drain: 0.5–1 hr
- Replace a toilet: 1.5–2.5 hrs
- Pressure wash a house exterior: 3–6 hrs

## ABSOLUTE RULES:
1. **USE THE RESEARCHED PRICES ABOVE** — they are verified for this job and region
2. **MATCH THE SCOPE EXACTLY** — if a small area is mentioned, price only that area
3. **HOURS MUST MATCH THE BENCHMARKS ABOVE** — don't exceed them without clear justification
4. **SEPARATE LABOR FROM MATERIALS** — distinct line items for each
5. **NO SCOPE CREEP** — only add items explicitly described or clearly implied

## SCOPE CALIBRATION:
- Small (patch, fix, minor repair, simple install): $75–$800 total
- Medium (room repaint, fixture swap, appliance install, small repair): $500–$3,000 total
- Large (full room remodel, roof section, whole-house paint): $3,000–$8,000 total
- Major (bathroom gut, large addition, full HVAC system): $8,000–$50,000 total

Pick the tier that matches, then generate ONLY items that fit.

## OUTPUT FORMAT:
Return ONLY a valid JSON array. Each item:
- description: What + where (be specific)
- quantity: Realistic number (hours, sq ft, units, etc.)
- unit_price: Price in USD from the researched data above

## MANDATORY SELF-CHECK BEFORE OUTPUTTING:
1. Add up total labor hours — do they match the labor benchmarks above?
2. Does total match the realistic range for this scope?
3. Are prices anchored to the researched data (not inflated generics)?
4. Did I apply the ${colMultiplier}x regional multiplier to all unit prices?`;
}

function buildAuditPrompt(colMultiplier: number, location: string, priceResearch: string): string {
  return `You are a senior estimator reviewing a bid for ACCURACY. You have access to verified market prices and labor benchmarks.

## VERIFIED MARKET PRICES (use to validate unit prices):
${priceResearch}

## LABOR HOUR BENCHMARKS (use to validate quantities):
- Paint one room (walls + ceiling, 2 coats): 4–6 hrs total
- Paint whole 1,200 sq ft house interior: 20–30 hrs total for the entire job
- Hang/replace a door: 1–2 hrs
- Replace 1 lockset/deadbolt: 0.5–1 hr
- Install a light fixture: 1–2 hrs  
- Patch drywall per hole: 0.5–1 hr
- Install a faucet: 1–2 hrs
- Replace a toilet: 1.5–2.5 hrs
- Pressure wash house exterior: 3–6 hrs

## AUDIT CHECKLIST:
1. **Total labor hours** — add them up. Do they match the benchmarks above? If a whole-house paint job shows 60+ total hours, CUT IT DOWN.
2. **Unit prices** — do they match the researched prices above? Fix any that are too high or too low.
3. **Scope match** — does the total reflect the actual job size described?
4. **Regional multiplier** — are prices adjusted ${colMultiplier}x for ${location}?
5. **Scope creep** — remove any items not described or clearly required.

## CORRECTION RULES:
- If total labor hours exceed benchmarks by more than 30%, REDUCE hours to match
- If total is more than 40% above a realistic market rate for the scope, REDUCE it
- If individual prices deviate >25% from researched data, CORRECT them
- If the estimate is reasonable, return it unchanged

Return ONLY the corrected JSON array. No explanations.`;
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { job_description, col_multiplier, location, images, model } = await req.json();

    if (!job_description && (!images || images.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Job description or images are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY') || null;
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY') || null;

    const colMultiplier = typeof col_multiplier === 'number' && col_multiplier > 0 ? col_multiplier : 1.0;
    const locationStr = location || 'United States (national average)';
    const hasImages = Array.isArray(images) && images.length > 0;

    // Resolve the model — honour request but fall back if vision required and model lacks it
    let selectedModel = (model && MODEL_REGISTRY[model]) ? model : DEFAULT_MODEL;
    const modelConfig = MODEL_REGISTRY[selectedModel];
    if (hasImages && !modelConfig.supportsVision) {
      // Downgrade to a vision-capable model
      selectedModel = NVIDIA_API_KEY ? 'nvidia/llama-3.2-90b-vision' : DEFAULT_MODEL;
      console.log(`Model swapped to ${selectedModel} for vision support`);
    }
    // If NVIDIA model selected but no key available, fall back to Lovable AI
    if (MODEL_REGISTRY[selectedModel].provider === 'nvidia' && !NVIDIA_API_KEY) {
      selectedModel = DEFAULT_MODEL;
      console.log('NVIDIA key not available, falling back to Lovable AI');
    }

    const priceSource = PERPLEXITY_API_KEY ? 'perplexity' : MODEL_REGISTRY[selectedModel].provider;
    console.log(`Processing: model=${selectedModel}, COL=${colMultiplier}, location=${locationStr}, images=${hasImages ? images.length : 0}, priceSource=${priceSource}`);

    // ── Step 1: Price Research ──────────────────────────────────────────────
    console.log('Step 1: Researching market prices...');
    let priceResearch = '';
    try {
      if (PERPLEXITY_API_KEY) {
        priceResearch = await fetchPricesWithPerplexity(job_description, locationStr, PERPLEXITY_API_KEY);
      } else {
        priceResearch = await fetchPricesWithModel(
          job_description, locationStr, colMultiplier,
          selectedModel, LOVABLE_API_KEY, NVIDIA_API_KEY
        );
      }
    } catch (priceErr) {
      console.error('Price research failed, using built-in guidelines:', priceErr);
      priceResearch = `2025 National Average Guidelines (adjusted ${colMultiplier}x for ${locationStr}):
- General labor: $${Math.round(50 * colMultiplier)}–$${Math.round(65 * colMultiplier)}/hr
- Skilled trades (plumbing, electrical, HVAC): $${Math.round(90 * colMultiplier)}–$${Math.round(130 * colMultiplier)}/hr
- Roofing labor: $${Math.round(70 * colMultiplier)}–$${Math.round(95 * colMultiplier)}/hr  
- Painting labor: $${Math.round(55 * colMultiplier)}–$${Math.round(75 * colMultiplier)}/hr
- Drywall labor: $${Math.round(55 * colMultiplier)}–$${Math.round(75 * colMultiplier)}/hr
- Paint (quality): $${Math.round(40 * colMultiplier)}–$${Math.round(60 * colMultiplier)}/gallon
- Roofing shingles: $${Math.round(35 * colMultiplier)}–$${Math.round(50 * colMultiplier)}/bundle
- Drywall sheet 4x8: $${Math.round(14 * colMultiplier)}–$${Math.round(20 * colMultiplier)}
- GFCI outlet: $${Math.round(18 * colMultiplier)}–$${Math.round(28 * colMultiplier)} each`;
    }

    // ── Step 2: Decomposition ───────────────────────────────────────────────
    console.log('Step 2: Decomposing job description...');
    const decompositionPrompt = buildDecompositionPrompt(colMultiplier, locationStr, hasImages, priceResearch);

    // Build user content (text + optional images)
    const userContent: any[] = [];
    if (hasImages && MODEL_REGISTRY[selectedModel].supportsVision) {
      for (const img of images as ImageInput[]) {
        userContent.push({
          type: 'image_url',
          image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
        });
      }
    }
    userContent.push({
      type: 'text',
      text: hasImages
        ? `Analyze the photos and this description, then generate line items using the researched prices:\n\n${job_description}`
        : `Generate line items using the researched prices above:\n\n${job_description}`,
    });

    const decompositionMessages = [
      { role: 'system', content: decompositionPrompt },
      { role: 'user', content: userContent.length === 1 ? userContent[0].text : userContent },
    ];

    const initialEstimate = await callAI(selectedModel, decompositionMessages, LOVABLE_API_KEY, NVIDIA_API_KEY, 0.1);

    let items: any[] = [];
    try {
      const cleanContent = initialEstimate.replace(/```json\n?|\n?```/g, '').trim();
      items = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse initial estimate:', initialEstimate.slice(0, 300));
      items = [];
    }

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ items: [], audit_notes: 'Could not parse job description' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const initialTotal = items.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    console.log(`Initial estimate: $${initialTotal.toFixed(2)}, ${items.length} items`);

    // ── Step 3: Audit with Price Validation ─────────────────────────────────
    console.log('Step 3: Auditing estimate...');
    const auditPrompt = buildAuditPrompt(colMultiplier, locationStr, priceResearch);

    try {
      const auditMessages = [
        { role: 'system', content: auditPrompt },
        {
          role: 'user',
          content: `Original job:\n${job_description}\n\nLocation: ${locationStr} (COL: ${colMultiplier}x)\n${hasImages ? `Photos analyzed: ${images.length}\n` : ''}\nEstimate to audit (total: $${initialTotal.toFixed(2)}):\n${JSON.stringify(items, null, 2)}`,
        },
      ];

      const auditedEstimate = await callAI(selectedModel, auditMessages, LOVABLE_API_KEY, NVIDIA_API_KEY, 0.1);

      const cleanAudit = auditedEstimate.replace(/```json\n?|\n?```/g, '').trim();
      const auditedItems = JSON.parse(cleanAudit);
      if (Array.isArray(auditedItems) && auditedItems.length > 0) {
        const auditedTotal = auditedItems.reduce((sum: number, i: any) => sum + ((i.quantity || 0) * (i.unit_price || 0)), 0);
        console.log(`Audited estimate: $${auditedTotal.toFixed(2)}, ${auditedItems.length} items`);
        items = auditedItems;
      }
    } catch (auditErr) {
      console.log('Audit failed, using decomposition result:', auditErr);
    }

    // ── Validate & Return ───────────────────────────────────────────────────
    const validatedItems = items
      .filter((item: any) => item.description && typeof item.quantity === 'number' && typeof item.unit_price === 'number')
      .map((item: any) => ({
        description: String(item.description).trim(),
        quantity: Math.max(0, Number(item.quantity)),
        unit_price: Math.max(0, Number(item.unit_price)),
      }));

    const finalTotal = validatedItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const modelLabel = MODEL_REGISTRY[selectedModel]?.label ?? selectedModel;
    console.log(`Final: ${validatedItems.length} items, $${finalTotal.toFixed(2)}, model=${modelLabel}`);

    return new Response(
      JSON.stringify({
        items: validatedItems,
        item_count: validatedItems.length,
        subtotal: finalTotal,
        col_multiplier_applied: colMultiplier,
        location: locationStr,
        photos_analyzed: hasImages ? images.length : 0,
        price_source: priceSource,
        model_used: modelLabel,
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
