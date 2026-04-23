import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface AIAction {
  id: string;
  agent_role: string;
  action_type: string;
  target: string | null;
  status: string;
  triggered_by: string;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  ceo: 'bg-primary/15 text-primary border-primary/30',
  sales: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  ops: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  finance: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  marketing: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  custodian: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export function AIActivityFeed() {
  const [actions, setActions] = useState<AIAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('ai_actions' as any)
        .select('id, agent_role, action_type, target, status, triggered_by, created_at')
        .order('created_at', { ascending: false })
        .limit(60);
      if (!error && data) setActions(data as unknown as AIAction[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel('ai-actions-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_actions' }, (payload) => {
        setActions((prev) => [payload.new as AIAction, ...prev].slice(0, 60));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          AI Activity Feed
          <Badge variant="outline" className="ml-auto text-xs">live</Badge>
        </CardTitle>
        <CardDescription>
          Every action your AI org takes — in real time. Audit trail.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Loading activity…</div>
        ) : actions.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">
            No AI activity yet. Tell the CEO to do something or enable autonomous mode.
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-2">
              {actions.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-md border bg-card/50 p-2.5 text-sm hover:border-primary/30 transition-colors">
                  <div className="mt-0.5 flex-shrink-0">
                    {a.status === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-primary/70" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${ROLE_COLORS[a.agent_role] || 'bg-muted text-muted-foreground'}`}>
                        {a.agent_role}
                      </Badge>
                      <span className="font-medium text-xs">{a.action_type}</span>
                      {a.target && (
                        <span className="text-xs text-muted-foreground truncate">→ {a.target}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      <span>·</span>
                      <span>{a.triggered_by}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
