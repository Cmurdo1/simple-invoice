import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { NerveCenterGate } from '@/components/auth/NerveCenterGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FROM_OPTIONS = [
  'Honest Invoice <noreply@honestinvoice.com>',
  'Honest Invoice Support <support@honestinvoice.com>',
  'Honest Invoice Billing <billing@honestinvoice.com>',
  'Honest Invoice Hello <hello@honestinvoice.com>',
];

export default function SendEmail() {
  const [from, setFrom] = useState(FROM_OPTIONS[0]);
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) {
      toast.error('Please fill in To, Subject, and Message.');
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-custom-email', {
        body: {
          from,
          to,
          cc: cc || undefined,
          bcc: bcc || undefined,
          replyTo: replyTo || undefined,
          subject,
          body,
        },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Email sent to ${to}`);
      setSubject('');
      setBody('');
      setTo('');
      setCc('');
      setBcc('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <NerveCenterGate>
      <AppLayout>
        <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center gap-3">
            <Mail className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Send Email</h1>
              <p className="text-sm text-muted-foreground">
                Send a custom email from your <span className="text-foreground font-medium">honestinvoice.com</span> domain.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compose</CardTitle>
              <CardDescription>Goes out instantly via Resend. Owner-only.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="from">From</Label>
                  <select
                    id="from"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {FROM_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to">To <span className="text-muted-foreground text-xs">(comma-separated for multiple)</span></Label>
                  <Input
                    id="to"
                    type="text"
                    placeholder="customer@example.com"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cc">CC <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input id="cc" type="text" value={cc} onChange={(e) => setCc(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bcc">BCC <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input id="bcc" type="text" value={bcc} onChange={(e) => setBcc(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="replyTo">Reply-To <span className="text-muted-foreground text-xs">(optional — defaults to your email)</span></Label>
                  <Input id="replyTo" type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Message <span className="text-muted-foreground text-xs">(plain text or HTML)</span></Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    placeholder="Write your message here..."
                    required
                  />
                </div>

                <Button type="submit" disabled={sending} className="w-full">
                  {sending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" /> Send Email</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </NerveCenterGate>
  );
}
