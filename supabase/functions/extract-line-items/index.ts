import "https://deno.land/std@0.168.0/dotenv/load.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { job_description } = await req.json();

    if (!job_description) {
      return new Response(
        JSON.stringify({ error: 'Job description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a detailed bid/invoice extractor for field contractors (roofers, plumbers, electricians, HVAC, landscapers, etc.).

Extract comprehensive line items from job descriptions for professional bids and invoices.

For each line item, provide:
- description: Detailed description including WHAT is being done, WHERE (location/area), and any specifics
- quantity: Number of units, hours, or square footage (be specific about the unit in the description)
- unit_price: Estimated price in USD (use industry-standard rates)

EXTRACTION RULES:
1. ALWAYS separate labor from materials as distinct line items
2. Include location details in descriptions (e.g., "Front roof section", "Kitchen sink area")
3. For time-based work, specify estimated hours clearly
4. For area-based work (roofing, painting), use square footage when possible
5. Include equipment rental or specialized tools if mentioned
6. Add disposal/cleanup fees for removal jobs

Common contractor rates:
- General labor: $65-85/hour
- Skilled trades (plumbing, electrical): $85-125/hour
- Roofing labor: $75-100/hour
- Moss removal: $0.50-1.50/sq ft or $75-100/hour
- Roof cleaning: $0.20-0.50/sq ft
- Materials: Use current market prices
- Disposal/hauling: $50-150 per load
- Equipment rental: Varies by type

Return ONLY valid JSON array, no markdown or explanation.
Example output for moss removal job:
[
  {"description": "Moss removal - Main roof section (approx 1500 sq ft)", "quantity": 1500, "unit_price": 0.75},
  {"description": "Moss removal - Garage roof section (approx 400 sq ft)", "quantity": 400, "unit_price": 0.75},
  {"description": "Zinc strip installation - Ridge line (prevents regrowth)", "quantity": 60, "unit_price": 3.50},
  {"description": "Roof debris cleanup and disposal", "quantity": 1, "unit_price": 125},
  {"description": "Labor - Roof access setup and safety equipment", "quantity": 2, "unit_price": 85}
]`
          },
          {
            role: 'user',
            content: `Extract line items from this job description:\n\n${job_description}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Parse the JSON response
    let items;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      items = JSON.parse(cleanContent);
    } catch {
      items = [];
    }

    return new Response(
      JSON.stringify({ items }),
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
