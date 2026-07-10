// Extract invoice line items from a PDF (e.g. supplier quote, prior invoice, receipt).
// Uses Lovable AI Gateway (Gemini) with a file content block.
import "https://deno.land/std@0.168.0/dotenv/load.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_BASE_URL = "https://ai.gateway.lovable.dev/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pdf_base64, filename, notes } = await req.json();
    if (!pdf_base64) {
      return new Response(JSON.stringify({ error: "pdf_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You extract billable line items from a PDF document (contractor quote, supplier receipt, prior invoice, or work order).
Return ONLY a JSON array. Each element:
  { "description": string, "quantity": number, "unit_price": number }
Rules:
- Use the item descriptions as printed. Combine adjacent labor/notes into the description if it clarifies scope.
- quantity is a number (default 1 if not shown). unit_price is USD numeric (no $ sign, no commas).
- Skip subtotals, taxes, discounts, totals, payment terms, and page footers.
- If a line only shows a total but no unit price, set quantity=1 and unit_price to the total.
- Never invent items not in the document.
- Output pure JSON only, no markdown fences, no prose.`;

    const userText = notes
      ? `Extract billable line items from the attached PDF (${filename || "document"}). Additional context: ${notes}`
      : `Extract billable line items from the attached PDF (${filename || "document"}).`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "file",
              file: {
                filename: filename || "document.pdf",
                file_data: `data:application/pdf;base64,${pdf_base64}`,
              },
            },
            { type: "text", text: userText },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    };

    const resp = await fetch(`${LOVABLE_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Gateway error:", resp.status, errText.slice(0, 500));
      return new Response(
        JSON.stringify({ error: `AI Gateway ${resp.status}`, details: errText.slice(0, 500) }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const cleaned = String(raw).replace(/```json\n?|\n?```/g, "").trim();

    let items: any[] = [];
    try {
      items = JSON.parse(cleaned);
    } catch (e) {
      console.error("Parse failed:", cleaned.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "Could not parse items from PDF", raw: cleaned.slice(0, 500) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Normalise
    const normalised = (Array.isArray(items) ? items : []).map((it: any) => ({
      description: String(it.description ?? "").slice(0, 300),
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unit_price) || 0,
    })).filter((it) => it.description);

    return new Response(
      JSON.stringify({ items: normalised, model_used: "google/gemini-2.5-flash" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err: any) {
    console.error("extract-line-items-from-pdf error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
