import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { NerveCenterGate } from '@/components/auth/NerveCenterGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Zap, Radio, BrainCircuit, MapPin, Phone, Mail, ExternalLink, Clock, CheckCircle, AlertCircle, Send, Loader2, Cpu, Save } from 'lucide-react';
import { NerveChat } from '@/components/nerve-center/NerveChat';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// Available AI models — kept in sync with edge function MODEL_REGISTRY
const AI_MODELS = [
  { value: 'nvidia/llama-3.3-70b-instruct', label: 'Llama 3.3 70B Instruct', provider: 'NVIDIA', badge: 'Accurate' },
  { value: 'nvidia/llama-3.2-90b-vision',   label: 'Llama 3.2 90B Vision',   provider: 'NVIDIA', badge: 'Best Vision' },
  { value: 'nvidia/mistral-nemo',           label: 'Mistral Nemo 12B',        provider: 'NVIDIA', badge: 'Fast' },
  { value: 'nvidia/qwen2.5-72b',            label: 'Qwen 2.5 72B',            provider: 'NVIDIA', badge: 'Reasoning' },
  { value: 'google/gemini-2.5-flash',       label: 'Gemini 2.5 Flash',        provider: 'Google', badge: 'Default' },
  { value: 'google/gemini-2.5-pro',         label: 'Gemini 2.5 Pro',          provider: 'Google', badge: 'High Quality' },
] as const;

function AIModelController() {
  const [currentModel, setCurrentModel] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('site_settings' as any)
        .select('value')
        .eq('key', 'ai_model')
        .maybeSingle();
      if (data && (data as any).value) {
        setCurrentModel((data as any).value);
      } else {
        setCurrentModel('nvidia/llama-3.3-70b-instruct');
      }
      setLoaded(true);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!currentModel) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('site-settings', {
        body: { key: 'ai_model', value: currentModel },
      });
      if (error) throw new Error(error.message);
      toast.success(`Global AI model updated to: ${AI_MODELS.find(m => m.value === currentModel)?.label ?? currentModel}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save model setting.');
    } finally {
      setSaving(false);
    }
  };

  const activeModel = AI_MODELS.find(m => m.value === currentModel);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          Global AI Model
        </CardTitle>
        <CardDescription>
          Controls which AI model runs for <span className="text-foreground font-medium">all users</span> on Magic Create. Only you can change this.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!loaded ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading current model…
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Active Model</Label>
              <Select value={currentModel} onValueChange={setCurrentModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="flex items-center gap-2">
                        <span>{m.label}</span>
                        <span className="text-xs text-muted-foreground">— {m.provider}</span>
                        <Badge variant="secondary" className="text-xs ml-1">{m.badge}</Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeModel && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <p className="font-medium">{activeModel.label}</p>
                <p className="text-xs text-muted-foreground">
                  Provider: {activeModel.provider} · Badge: {activeModel.badge}
                </p>
                <p className="text-xs text-muted-foreground font-mono break-all">{activeModel.value}</p>
              </div>
            )}
            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
              ) : (
                <><Save className="h-4 w-4" />Save & Apply Globally</>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface Lead {
  id: string;
  poster_name: string | null;
  contact_info: string | null;
  job_description: string | null;
  location: string | null;
  post_url: string | null;
  date_posted: string | null;
  estimate_id: string | null;
  status: string;
  source: string;
  created_at: string;
}

function LeadCard({ lead }: { lead: Lead }) {
  const isEmail = lead.contact_info?.includes('@');

  const statusColor = {
    new: 'bg-primary/10 text-primary border-primary/20',
    estimated: 'bg-accent text-accent-foreground border-border',
    contacted: 'bg-secondary text-secondary-foreground border-border',
  }[lead.status] || 'bg-muted text-muted-foreground';

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
          <span className="font-medium text-sm truncate">{lead.poster_name || 'Anonymous'}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className={`text-xs ${statusColor}`}>
            {lead.status}
          </Badge>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2">{lead.job_description}</p>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {lead.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {lead.location}
          </span>
        )}
        {lead.contact_info && (
          <span className="flex items-center gap-1">
            {isEmail ? <Mail className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
            {lead.contact_info}
          </span>
        )}
        {lead.post_url && (
          <a
            href={lead.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View post
          </a>
        )}
      </div>

      {lead.estimate_id && (
        <div className="flex items-center gap-1.5 text-xs text-accent-foreground">
          <CheckCircle className="h-3.5 w-3.5 text-primary" />
          <span>Estimate auto-generated</span>
        </div>
      )}
    </div>
  );
}

function SupportEmailComposer() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-support-email', {
        body: { to: to.trim(), subject: subject.trim(), body: body.trim() },
      });
      if (error) throw new Error(error.message);
      toast.success(`Email sent to ${to.trim()} from support@honestinvoice.com`);
      setTo('');
      setSubject('');
      setBody('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Support Email Composer
        </CardTitle>
        <CardDescription>
          Send personalized emails as <span className="text-primary font-medium">support@honestinvoice.com</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-to">To</Label>
            <Input
              id="email-to"
              type="email"
              placeholder="user@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              type="text"
              placeholder="How can we help?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-body">Message</Label>
            <Textarea
              id="email-body"
              placeholder="Write your message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={7}
              className="resize-none"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Sent from <span className="font-medium">support@honestinvoice.com</span> · Reply-to: murdochcpm_08@yahoo.com
            </p>
            <Button type="submit" disabled={sending} size="sm">
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function NerveCenter() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setLeads(data as Lead[]);
      }
      setLoading(false);
    };

    fetchLeads();

    const channel = supabase
      .channel('nerve-center-leads')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          setLeads((prev) => [payload.new as Lead, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads' },
        (payload) => {
          setLeads((prev) =>
            prev.map((l) => (l.id === (payload.new as Lead).id ? (payload.new as Lead) : l))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const newLeads = leads.filter((l) => l.status === 'new');
  const estimatedLeads = leads.filter((l) => l.status === 'estimated');
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-lead`;

  return (
    <NerveCenterGate>
      <AppLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BrainCircuit className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">The Nerve Center</h1>
              <p className="text-muted-foreground">
                Central hub for automations, signals, and AI task orchestration
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{newLeads.length}</div>
              <div className="text-xs text-muted-foreground mt-1">New signals</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-foreground">{estimatedLeads.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Estimates generated</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{leads.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total leads</div>
            </Card>
          </div>

          {/* AI Command Center Chat */}
          <NerveChat />

          {/* Support Email Composer */}
          <SupportEmailComposer />

          {/* Global AI Model Control */}
          <AIModelController />


          {/* Incoming Signals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary" />
                Incoming Signals
                <Badge variant="outline" className="ml-auto">
                  {newLeads.length} new
                </Badge>
              </CardTitle>
              <CardDescription>
                Live leads from Craigslist Portland — dump runs, mobile mechanic, and more
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground">
                  Loading signals…
                </div>
              ) : leads.length === 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground">
                    No signals yet. Start the scraper to pull in leads.
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Scraper webhook endpoint:</p>
                    <code className="text-xs break-all text-primary">{webhookUrl}</code>
                  </div>
                </div>
              ) : (
                leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
              )}
            </CardContent>
          </Card>

          {/* Webhook config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Outgoing Pulses
                <Badge variant="outline" className="ml-auto">Webhook ready</Badge>
              </CardTitle>
              <CardDescription>
                Configure the scraper's WEBHOOK_URL to push leads here in real time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">POST endpoint</p>
                <code className="text-xs break-all text-primary block">{webhookUrl}</code>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expected payload</p>
                <pre className="text-xs text-muted-foreground overflow-x-auto">{`{
  "poster_name": "John D.",
  "contact_info": "john@example.com",
  "job_description": "Need dump run, 2 pickups worth",
  "location": "Beaverton, OR",
  "post_url": "https://portland.craigslist.org/...",
  "date_posted": "2026-03-03T10:00:00Z"
}`}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Activity Feed
              </CardTitle>
              <CardDescription>
                Live stream of all signals and estimate generation events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {leads.length === 0 ? (
                <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground">
                  No activity yet. The nerve center is quiet.
                </div>
              ) : (
                leads.slice(0, 10).map((lead) => (
                  <div key={lead.id} className="flex items-start gap-3 text-sm py-2 border-b last:border-0">
                    <div className="mt-0.5 flex-shrink-0">
                      {lead.estimate_id ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {lead.estimate_id ? 'Estimate generated for' : 'New lead received from'}{' '}
                        <span className="text-muted-foreground">{lead.poster_name || 'unknown'}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{lead.job_description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* AI Task Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                AI Task Queue
              </CardTitle>
              <CardDescription>
                Estimates queued for AI generation from incoming leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {estimatedLeads.length === 0 ? (
                <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground">
                  No tasks in queue. AI agents are standing by.
                </div>
              ) : (
                estimatedLeads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{lead.job_description?.slice(0, 60)}…</span>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      complete
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </NerveCenterGate>
  );
}
