import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageInput {
  base64: string;
  mimeType: string;
}

const LOVABLE_BASE_URL = 'https://ai.gateway.lovable.dev/v1';
const DEFAULT_MODEL = 'google/gemini-2.5-flash';

// ─── Deterministic seed from input ──────────────────────────────────────────
function hashSeed(input: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

// ─── AI Call (temperature 0, seeded, Lovable AI only) ───────────────────────
async function callAI(
  messages: any[],
  lovableKey: string,
  seed: number,
  model: string = DEFAULT_MODEL,
): Promise<string> {
  const response = await fetch(`${LOVABLE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0,
      top_p: 0.1,
      seed,
      max_tokens: 3072,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Lovable AI ${response.status}: ${err.slice(0, 300)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Trade classifier (deterministic, keyword-based) ────────────────────────
const TRADE_KEYWORDS: Record<string, string[]> = {
  painting: ['paint', 'primer', 'wall color', 'repaint', 'stain'],
  plumbing: ['plumb', 'toilet', 'faucet', 'sink', 'drain', 'leak', 'pipe', 'water heater', 'garbage disposal', 'shower', 'tub'],
  electrical: ['electric', 'outlet', 'switch', 'wiring', 'breaker', 'panel', 'light fixture', 'ceiling fan', 'gfci', 'romex', 'recessed'],
  roofing: ['roof', 'shingle', 'gutter downspout', 'ridge', 'underlayment'],
  drywall: ['drywall', 'sheetrock', 'plaster', 'joint compound', 'texture'],
  flooring: ['floor', 'tile', 'carpet', 'laminate', 'vinyl plank', 'lvp', 'hardwood', 'grout'],
  hvac: ['hvac', 'furnace', 'ac unit', 'air condition', 'thermostat', 'duct', 'heating'],
  exterior: ['pressure wash', 'power wash', 'gutter clean', 'exterior clean', 'siding wash'],
};

function detectTrades(description: string): string[] {
  const d = description.toLowerCase();
  const trades = new Set<string>();
  for (const [trade, kws] of Object.entries(TRADE_KEYWORDS)) {
    if (kws.some(k => d.includes(k))) trades.add(trade);
  }
  if (trades.size === 0) trades.add('general');
  // Always include general for miscellaneous supplies
  trades.add('general');
  return Array.from(trades);
}

// ─── DB Pricing Lookup ──────────────────────────────────────────────────────
async function loadPriceSheet(
  supabase: any,
  trades: string[],
  colMultiplier: number,
): Promise<string> {
  const { data, error } = await supabase
    .from('pricing_benchmarks')
    .select('trade,item_type,item_key,description,base_price,unit')
    .in('trade', trades)
    .order('trade', { ascending: true })
    .order('item_type', { ascending: true });

  if (error || !data || data.length === 0) {
    console.warn('Price sheet lookup failed, using fallback:', error);
    return `NATIONAL AVERAGE FALLBACK (adjusted ${colMultiplier}x):
- General labor: $${Math.round(60 * colMultiplier)}/hr
- Skilled trade labor: $${Math.round(110 * colMultiplier)}/hr`;
  }

  // Group by trade
  const grouped: Record<string, any[]> = {};
  for (const row of data) {
    (grouped[row.trade] ||= []).push(row);
  }

  let sheet = `# VERIFIED REGIONAL PRICE SHEET (COL multiplier: ${colMultiplier}x)\n`;
  sheet += `USE THESE EXACT PRICES. Every unit_price MUST equal base_price × ${colMultiplier}, rounded.\n\n`;
  for (const [trade, items] of Object.entries(grouped)) {
    sheet += `## ${trade.toUpperCase()}\n`;
    for (const it of items) {
      const adjusted = Math.round(Number(it.base_price) * colMultiplier * 100) / 100;
      sheet += `- [${it.item_key}] ${it.description} — $${adjusted}/${it.unit} (${it.item_type})\n`;
    }
    sheet += '\n';
  }
  return sheet;
}

// ─── Prompt Builder ─────────────────────────────────────────────────────────
function buildPrompt(
  colMultiplier: number,
  location: string,
  hasImages: boolean,
  priceSheet: string,
): string {
  return `You are a professional contractor estimator generating a DETAILED, PRODUCTION-READY estimate.

${priceSheet}

## REGION
Location: ${location} | COL Multiplier: ${colMultiplier}x

## ABSOLUTE RULES
1. **USE THE PRICE SHEET ABOVE VERBATIM.** Every unit_price MUST come from the price sheet (already region-adjusted). Do NOT invent prices.
2. **COMPLETE LINE ITEMS.** Every job must include:
   - At least one LABOR line item (with realistic hours)
   - All MATERIAL line items needed for the scope
   - PREP items if surface prep is required (painting, flooring, etc.)
   - DISPOSAL items if old material is being removed
3. **FULL DESCRIPTIONS.** Every \`description\` field MUST be a complete sentence (minimum 20 characters) that specifies:
   - WHAT is being done or supplied
   - WHERE on the property (room, area, wall, etc.) when the job description mentions a location
   - Brand/grade/spec when relevant (e.g. "Grade 2 deadbolt", "Premium interior latex, satin finish")
4. **REALISTIC QUANTITIES.** Anchor to these benchmarks:
   - Paint one room (walls+ceiling, 2 coats): 4-6 labor hrs, 2-3 gallons paint, 1 gallon primer
   - Paint 1,200 sq ft house interior: 24-30 labor hrs total, 8-12 gallons paint
   - Hang/replace interior door: 2 hrs, 1 door slab or prehung unit
   - Replace toilet: 2 hrs, 1 toilet, 1 wax ring, 1 supply line
   - Replace faucet: 1.5 hrs, 1 faucet, 2 supply lines
   - Install ceiling fan: 2 hrs, 1 fan, wire nuts (junction box if new)
   - Patch drywall (per hole): 0.75 hrs per hole
   - Replace lockset: 1 hr per lockset
   - Pressure wash house exterior: 4-6 hrs, 1 gallon detergent
5. **NO SCOPE CREEP.** Only include items directly required by the job described.
${hasImages ? '6. **PHOTOS**: Analyze provided photos to size the job. Estimate ONLY the visible scope.\n' : ''}

## OUTPUT FORMAT
Return ONLY a valid JSON array. NO markdown, NO code fences, NO prose.
Each item has EXACTLY three fields:
- \`description\`: string, 20+ chars, full sentence
- \`quantity\`: number (hours, sheets, gallons, sq ft, each, etc.)
- \`unit_price\`: number in USD, matching the price sheet

Example:
[
  {"description":"Professional painter labor: prep, prime, and apply two coats of premium latex to master bedroom walls and ceiling","quantity":5,"unit_price":${Math.round(60 * colMultiplier)}},
  {"description":"Premium interior latex paint, satin finish, tinted to selected color for master bedroom walls","quantity":2,"unit_price":${Math.round(48 * colMultiplier)}},
  {"description":"Stain-blocking latex primer applied to patched drywall areas in master bedroom","quantity":1,"unit_price":${Math.round(32 * colMultiplier)}}
]

## FINAL SELF-CHECK (before outputting)
- Every description ≥ 20 chars? ✓
- At least one labor line? ✓
- All unit_prices match the price sheet × ${colMultiplier}? ✓
- No fenced code blocks in output? ✓`;
}

// ─── Main Handler ────────────────────────────────────────────────────────────
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
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const rawCol = typeof col_multiplier === 'number' && col_multiplier > 0 ? col_multiplier : 1.0;
    // Round COL multiplier so identical zip codes yield identical seeds/prices
    const colMultiplier = Math.round(rawCol * 100) / 100;
    const locationStr = location || 'United States (national average)';
    const hasImages = Array.isArray(images) && images.length > 0;

    const normalizedDesc = String(job_description || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const seed = hashSeed(`${normalizedDesc}|${colMultiplier}|${locationStr.toLowerCase()}|${hasImages ? images.length : 0}`);
    const trades = detectTrades(normalizedDesc);

    console.log(`Processing: seed=${seed}, COL=${colMultiplier}, trades=${trades.join(',')}, images=${hasImages ? images.length : 0}`);

    // ── Load deterministic price sheet from DB ──────────────────────────────
    const priceSheet = await loadPriceSheet(supabase, trades, colMultiplier);

    // ── Build prompt + user content ─────────────────────────────────────────
    const systemPrompt = buildPrompt(colMultiplier, locationStr, hasImages, priceSheet);

    const userContent: any[] = [];
    if (hasImages) {
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
        ? `Job description:\n${job_description}\n\nAnalyze the photos and generate the complete line item list per the rules and price sheet above.`
        : `Job description:\n${job_description}\n\nGenerate the complete line item list per the rules and price sheet above.`,
    });

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent.length === 1 ? userContent[0].text : userContent },
    ];

    // ── Generate estimate (single deterministic call) ───────────────────────
    let raw = await callAI(messages, LOVABLE_API_KEY, seed);
    let items: any[] = [];
    try {
      const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
      items = JSON.parse(clean);
    } catch {
      console.error('Failed to parse estimate, retrying once:', raw.slice(0, 300));
      raw = await callAI(messages, LOVABLE_API_KEY, seed + 1);
      try {
        const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
        items = JSON.parse(clean);
      } catch {
        items = [];
      }
    }

    // ── Strict validation ───────────────────────────────────────────────────
    const validated = (Array.isArray(items) ? items : [])
      .map((item: any) => {
        const description = String(item.description || '').trim();
        const quantity = Number(item.quantity);
        const unit_price = Number(item.unit_price);
        return { description, quantity, unit_price };
      })
      .filter(
        (item) =>
          item.description.length >= 15 &&
          Number.isFinite(item.quantity) &&
          item.quantity > 0 &&
          Number.isFinite(item.unit_price) &&
          item.unit_price > 0,
      );

    if (validated.length === 0) {
      return new Response(
        JSON.stringify({
          items: [],
          error: 'Could not generate valid line items — try adding more detail to the job description.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subtotal = validated.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    console.log(`Final: ${validated.length} items, $${subtotal.toFixed(2)}, seed=${seed}`);

    return new Response(
      JSON.stringify({
        items: validated,
        item_count: validated.length,
        subtotal,
        col_multiplier_applied: colMultiplier,
        location: locationStr,
        photos_analyzed: hasImages ? images.length : 0,
        trades_detected: trades,
        seed,
        price_source: 'pricing_benchmarks_db',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
