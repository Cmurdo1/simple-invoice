import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Power, PlayCircle, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrgSettings {
  autonomous_enabled: boolean;
  run_interval_minutes: number;
  ceo_model: string;
  worker_model: string;
  daily_brief_hour: number;
}

export function AIOrgControl() {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('ai_org_settings' as any)
        .select('autonomous_enabled, run_interval_minutes, ceo_model, worker_model, daily_brief_hour')
        .eq('id', 1)
        .maybeSingle();
      if (!error && data) setSettings(data as unknown as OrgSettings);
      setLoading(false);
    };
    load();
  }, []);

  const update = (patch: Partial<OrgSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...patch });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ai_org_settings' as any)
        .update(settings)
        .eq('id', 1);
      if (error) throw error;
      toast.success('Org settings saved.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('nerve-agent', {
        body: { messages: [{ role: 'user', content: 'Do an immediate rounds check. Process new leads, flag anomalies, and report what you did.' }] },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      toast.success('CEO completed rounds.', { description: (data?.content || '').slice(0, 140) });
    } catch (e: any) {
      toast.error(e.message || 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading org settings…
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Power className="h-5 w-5 text-primary" />
          AI Org Control
        </CardTitle>
        <CardDescription>
          The CEO orchestrates Sales, Ops, Finance, Marketing, and Custodian agents. Toggle autonomy and they run on a schedule.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Autonomous mode</Label>
            <p className="text-xs text-muted-foreground">
              When ON, the CEO does rounds every {settings.run_interval_minutes} minutes — processes leads, sends estimates, monitors ops.
            </p>
          </div>
          <Switch
            checked={settings.autonomous_enabled}
            onCheckedChange={(v) => update({ autonomous_enabled: v })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Run interval (min)</Label>
            <Input
              type="number"
              min={5}
              max={1440}
              value={settings.run_interval_minutes}
              onChange={(e) => update({ run_interval_minutes: Number(e.target.value) })}
            />
            <p className="text-[10px] text-muted-foreground">Cron is fixed at 15min — this is informational. To change it, ask me.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Daily brief hour (UTC)</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={settings.daily_brief_hour}
              onChange={(e) => update({ daily_brief_hour: Number(e.target.value) })}
            />
            <p className="text-[10px] text-muted-foreground">Custodian emails KPI report at this UTC hour.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">CEO model</Label>
            <Input value={settings.ceo_model} onChange={(e) => update({ ceo_model: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Worker model</Label>
            <Input value={settings.worker_model} onChange={(e) => update({ worker_model: e.target.value })} />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </Button>
          <Button onClick={handleRunNow} disabled={running} size="sm" variant="outline" className="gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Run rounds now
          </Button>
          {settings.autonomous_enabled && (
            <Badge className="ml-auto bg-primary/10 text-primary border-primary/20">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
              LIVE
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
