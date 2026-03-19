import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Copy, Check, Users, Star, Twitter, MessageCircle, Smartphone, Share2 } from 'lucide-react';
import { useReferral } from '@/hooks/useReferral';
import { toast } from 'sonner';

const SHARE_TEXT = "I've been using Honest Invoice to manage my freelance invoices — it's really good. Sign up with my link and we both get a free month of Pro 🎁";

export function ReferEarnCard() {
  const { data, isLoading } = useReferral();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!data?.referralLink) return;
    await navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitterShare = () => {
    if (!data?.referralLink) return;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${SHARE_TEXT}\n\n${data.referralLink}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppShare = () => {
    if (!data?.referralLink) return;
    const url = `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT}\n\n${data.referralLink}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSMSShare = () => {
    if (!data?.referralLink) return;
    const body = encodeURIComponent(`${SHARE_TEXT}\n\n${data.referralLink}`);
    window.location.href = `sms:?body=${body}`;
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
            <Gift className="h-4 w-4 text-primary" />
          </div>
          Refer & Earn 1 Free Month
          <Badge variant="secondary" className="ml-auto text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
            Pro Reward
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Share your link. When a friend signs up, you <strong className="text-foreground">both get 1 free month of Pro</strong> — unlimited invoices, AI magic, and Stripe payments.
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-card/60 px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
              <Users className="h-3 w-3" />
              <span className="text-[11px] uppercase tracking-wider">Referred</span>
            </div>
            <p className="text-xl font-bold">{isLoading ? '—' : data?.total ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-card/60 px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
              <Star className="h-3 w-3" />
              <span className="text-[11px] uppercase tracking-wider">Rewarded</span>
            </div>
            <p className="text-xl font-bold">{isLoading ? '—' : data?.rewarded ?? 0}</p>
          </div>
        </div>

        {/* Referral link */}
        <div className="flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2">
          <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
            {isLoading ? 'Loading...' : data?.referralLink ?? '—'}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 shrink-0 gap-1.5 px-2.5"
            onClick={handleCopy}
            disabled={isLoading || !data?.referralLink}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleTwitterShare}
            disabled={isLoading || !data?.referralLink}
          >
            <Twitter className="h-3.5 w-3.5" />
            X / Twitter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleWhatsAppShare}
            disabled={isLoading || !data?.referralLink}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleSMSShare}
            disabled={isLoading || !data?.referralLink}
          >
            <Smartphone className="h-3.5 w-3.5" />
            SMS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
