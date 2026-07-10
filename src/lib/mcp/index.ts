import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listInvoices from "./tools/list-invoices";
import getInvoice from "./tools/get-invoice";
import listClients from "./tools/list-clients";
import createClientTool from "./tools/create-client";
import listLeads from "./tools/list-leads";

// Direct Supabase issuer (never the .lovable.cloud proxy). Fallback keeps the
// module import-safe during manifest extraction where no request env exists.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "honest-invoice-mcp",
  title: "Honest Invoice",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in Honest Invoice user: list and read invoices/estimates, list and create clients, and view captured leads. All tools act as the authenticated user; row-level security scopes results to that user's data.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listInvoices, getInvoice, listClients, createClientTool, listLeads],
});
