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
            content: `You are an invoice line item extractor for field contractors (plumbers, electricians, HVAC, etc.). 
Extract line items from job descriptions and return them as JSON.

For each item, provide:
- description: Clear description of the work or material
- quantity: Number of units (default to 1 if not specified)
- unit_price: Estimated price in USD (use industry-standard rates if not specified)

Common contractor rates:
- Labor: $75-150/hour depending on trade
- Basic materials: Use reasonable market prices
- Service calls: $75-150 flat rate

Return ONLY valid JSON array, no markdown or explanation.
Example output: [{"description": "Toilet replacement", "quantity": 2, "unit_price": 150}, {"description": "Labor (hours)", "quantity": 3, "unit_price": 85}]`
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
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
