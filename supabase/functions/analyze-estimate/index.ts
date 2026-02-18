import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANALYSIS_PROMPT = `You are an expert construction and home services cost analyst. Your job is to analyze contractor estimates and determine if the pricing is fair.

Given a contractor's estimate (text with line items and prices), you must:

1. Identify each line item and its quoted price
2. Compare each against 2024 national average pricing (adjusted for reasonable regional variance)
3. Assign a fairness score (0-100) for the overall estimate
4. Flag items that are significantly above or below market rate

## PRICING KNOWLEDGE (2024 national averages):

**Roofing:**
- Moss removal: $0.20-0.50/sq ft or $200-600 per roof section
- Zinc strip installation: $5-10/linear foot
- Shingle replacement: $3.50-5.50/sq ft installed
- Gutter cleaning: $0.75-1.50/linear foot ($150-250 typical home)

**Plumbing:**
- Faucet replacement: $150-350 installed
- Water heater: $800-2,500 installed
- Drain cleaning: $100-300
- Pipe repair: $150-500

**Electrical:**
- Outlet replacement: $100-200 each
- Panel upgrade: $1,500-3,000
- Light fixture install: $150-400

**Painting:**
- Interior: $2-4/sq ft
- Exterior: $3-6/sq ft

**General:**
- Disposal fees: $50-150/load
- Permit fees: $50-300
- Minimum service call: $75-150

## SCORING:
- 90-100: Excellent value, below market
- 75-89: Fair pricing, within normal range
- 60-74: Somewhat high but not unreasonable
- 40-59: Significantly overpriced on multiple items
- 0-39: Extreme overcharging

## RESPONSE FORMAT:
You MUST use the analyze_estimate tool to return structured results.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { estimate_text } = await req.json();

    if (!estimate_text) {
      return new Response(
        JSON.stringify({ error: 'Estimate text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing estimate...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: ANALYSIS_PROMPT },
          { role: 'user', content: `Analyze this contractor estimate for fairness:\n\n${estimate_text}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_estimate",
              description: "Return the structured analysis of the contractor estimate",
              parameters: {
                type: "object",
                properties: {
                  fairness_score: { type: "number", description: "Overall fairness score 0-100" },
                  verdict: { type: "string", enum: ["fair", "high", "very_high"], description: "Overall verdict" },
                  summary: { type: "string", description: "2-3 sentence summary of the analysis" },
                  line_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        quoted_price: { type: "number" },
                        fair_price: { type: "number" },
                        status: { type: "string", enum: ["fair", "high", "low"] },
                        note: { type: "string", description: "Brief explanation of the assessment" }
                      },
                      required: ["description", "quoted_price", "fair_price", "status", "note"]
                    }
                  },
                  total_quoted: { type: "number" },
                  total_fair: { type: "number" },
                  savings_potential: { type: "number", description: "How much customer could potentially save" }
                },
                required: ["fairness_score", "verdict", "summary", "line_items", "total_quoted", "total_fair", "savings_potential"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_estimate" } },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`Analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error('No analysis result returned');
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);
    console.log(`Analysis complete. Score: ${analysisResult.fairness_score}`);

    return new Response(
      JSON.stringify(analysisResult),
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
