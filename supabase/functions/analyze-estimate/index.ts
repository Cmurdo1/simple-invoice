import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANALYSIS_PROMPT = `You are an expert cost analyst across all industries and service types. Your job is to analyze estimates, quotes, and proposals to determine if the pricing is fair.

Given an estimate (text with line items and prices), you must:

1. Identify each line item and its quoted price
2. Determine the industry/service type from context
3. Compare each item against current market rates for that industry
4. Assign a fairness score (0-100) for the overall estimate
5. Flag items that are significantly above or below market rate

You have broad knowledge of pricing across all sectors including but not limited to:
- Construction & home services (roofing, plumbing, electrical, painting, HVAC)
- Technology & software (web development, IT consulting, SaaS implementation)
- Professional services (legal, accounting, marketing, design)
- Auto & mechanical (repairs, maintenance, bodywork)
- Healthcare & wellness (dental, veterinary, personal training)
- Events & creative (photography, catering, event planning)
- Landscaping, cleaning, moving, and other trade services

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
