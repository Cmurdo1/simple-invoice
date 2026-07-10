import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_supabase";

export default defineTool({
  name: "list_invoices",
  title: "List invoices",
  description:
    "List invoices and estimates for the signed-in user. Optionally filter by type (invoice/estimate) or status.",
  inputSchema: {
    type: z.enum(["invoice", "estimate"]).optional().describe("Filter by document type"),
    status: z.string().optional().describe("Filter by status (draft, sent, paid, etc.)"),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ type, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("invoices")
      .select("id, invoice_number, type, status, total_amount, job_description, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { invoices: data ?? [] },
    };
  },
});
