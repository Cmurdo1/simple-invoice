import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Minimal typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthNS = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauthApi = (): OAuthNS => (supabase.auth as any).oauth as OAuthNS;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message || "Could not load authorization request.");
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauthApi().approveAuthorization(authorizationId)
      : await oauthApi().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message || "Authorization failed.");
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authorization error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading authorization…
        </div>
      </main>
    );
  }

  const clientName = details.client?.name ?? "an app";
  const redirectUri: string | undefined = details.client?.redirect_uris?.[0] ?? details.redirect_uri;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect {clientName} to Honest Invoice</CardTitle>
          <CardDescription>
            {clientName} will be able to call this app's enabled tools while you are signed in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border p-3 text-sm">
            <div className="font-medium mb-1">This lets {clientName} use Honest Invoice as you.</div>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Read your invoices, estimates, clients, and leads</li>
              <li>Create clients on your behalf</li>
            </ul>
            {redirectUri && (
              <div className="mt-3 text-xs text-muted-foreground break-all">
                Redirect: {redirectUri}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            This does not bypass Honest Invoice permissions or backend policies. Row-level security
            keeps your data scoped to your account.
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={() => decide(false)}
            >
              Cancel connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
