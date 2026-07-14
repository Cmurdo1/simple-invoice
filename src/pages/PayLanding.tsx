import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { CreditCard, Search, Shield, Clock, ChevronRight, Mail, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "name": "Pay Invoice Online — Honest Invoice",
      "description": "Received an invoice from a contractor or freelancer? Pay your invoice securely online with a credit or debit card. Fast, safe, and instant.",
      "url": "https://honestinvoice.com/pay",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I pay an invoice online?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "To pay an invoice, enter the invoice ID or click the payment link your contractor sent you. You'll be taken to a secure Stripe checkout page where you can pay by credit or debit card in seconds.",
          },
        },
        {
          "@type": "Question",
          "name": "Is it safe to pay an invoice through Honest Invoice?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. All payments are processed by Stripe, the same payment infrastructure used by Amazon, Shopify, and millions of other businesses. Your card details are never stored on Honest Invoice's servers.",
          },
        },
        {
          "@type": "Question",
          "name": "What if I think I'm being overcharged?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Honest Invoice lets you view a fully itemized breakdown of every charge before you pay. If something looks wrong, you can dispute a line item or contact the contractor directly. You can also use Honest Estimate to check fair market pricing for any job.",
          },
        },
      ],
    },
  ],
};

export default function PayLanding() {
  const [invoiceId, setInvoiceId] = useState('');
  const navigate = useNavigate();

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = invoiceId.trim();
    if (trimmed) navigate(`/pay/${trimmed}`);
  };

  return (
    <>
      <SEOHead
        canonicalUrl="/pay"
        title="Pay Invoice Online — Secure Card Payments | Honest Invoice"
        description="Received an invoice? Pay it online in seconds. Enter your invoice ID or click the payment link your contractor sent. Powered by Stripe — safe, fast, instant."
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">Honest Invoice</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Contractor Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Free Sign Up</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section
          className="py-20 relative overflow-hidden"
          style={{ background: 'var(--gradient-app)' }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(214_60%_45%_/_0.1),_transparent_50%)]" aria-hidden="true" />
          <div className="container relative mx-auto px-4 text-center">
            <div className="mx-auto max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                <Shield className="h-3.5 w-3.5" aria-hidden="true" /> Secure · Powered by Stripe
              </div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Pay Your Invoice <span className="text-primary">Online</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground">
                Enter the invoice ID from your email or receipt below. Pay securely by credit or debit card — takes less than 60 seconds.
              </p>

              {/* Invoice ID lookup */}
              <form onSubmit={handleLookup} className="mx-auto flex max-w-md gap-2">
                <input
                  type="text"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  placeholder="Paste invoice ID or payment link..."
                  className="flex-1 rounded-lg border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  aria-label="Invoice ID"
                />
                <Button type="submit" size="lg" className="shrink-0 gap-1.5">
                  <Search className="h-4 w-4" aria-hidden="true" /> Pay Now
                </Button>
              </form>
              <p className="mt-3 text-xs text-muted-foreground">
                Your contractor should have sent you a link like <code className="rounded bg-muted px-1 py-0.5 text-xs">honestinvoice.com/pay/INV-XXXX</code>
              </p>
            </div>
          </div>
        </section>

        {/* How to pay */}
        <section className="border-t bg-muted/30 py-16" aria-labelledby="how-to-pay-heading">
          <div className="container mx-auto px-4">
            <h2 id="how-to-pay-heading" className="mb-3 text-center text-3xl font-bold">How to Pay an Invoice</h2>
            <p className="mb-12 text-center text-muted-foreground max-w-xl mx-auto">
              Three ways to pay — whatever's easiest for you.
            </p>
            <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
              {[
                {
                  icon: Mail,
                  title: 'Click the Email Link',
                  desc: 'Open the invoice email from your contractor and click the "Pay Now" button. It goes straight to a secure checkout page.',
                },
                {
                  icon: Smartphone,
                  title: 'Use the Payment URL',
                  desc: 'Your contractor may have texted or shared a link like honestinvoice.com/pay/INV-1234. Tap it on any device to pay.',
                },
                {
                  icon: Search,
                  title: 'Enter Invoice ID Above',
                  desc: 'Find the invoice number on your receipt or paperwork, paste it in the field above, and hit Pay Now.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border bg-card p-6 text-center">
                  <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / Safety */}
        <section className="py-16" aria-labelledby="trust-heading">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 id="trust-heading" className="mb-3 text-center text-3xl font-bold">Is It Safe to Pay an Invoice Online?</h2>
            <p className="mb-10 text-center text-muted-foreground">
              Yes — here's exactly how your money and data are protected.
            </p>
            <div className="space-y-4">
              {[
                {
                  icon: Shield,
                  title: 'Stripe-powered payments',
                  body: "All card processing is handled by Stripe — the same infrastructure used by Amazon, Shopify, and Uber. Your card number never touches Honest Invoice's servers.",
                },
                {
                  icon: CreditCard,
                  title: 'Itemized breakdown before you pay',
                  body: "Every invoice shows a full line-item breakdown — labor, parts, and fees — so you know exactly what you're paying for before you enter a card number.",
                },
                {
                  icon: Clock,
                  title: 'Instant receipt',
                  body: 'As soon as payment goes through, you and your contractor both receive an email confirmation. Your receipt is timestamped and permanently stored.',
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4 rounded-xl border bg-card p-5">
                  <div className="mt-0.5 shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t bg-muted/30 py-16" aria-labelledby="pay-faq-heading">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 id="pay-faq-heading" className="mb-10 text-center text-2xl font-bold">Frequently Asked Questions</h2>
            <dl className="space-y-4">
              {[
                { q: 'How do I pay an invoice online?', a: "Click the payment link your contractor sent, or paste the invoice ID into the field at the top of this page. You'll be taken to a secure Stripe checkout where you can pay by card." },
                { q: 'What payment methods are accepted?', a: 'Visa, Mastercard, American Express, Discover, and most major debit cards are accepted. Apple Pay and Google Pay are supported on compatible devices.' },
                { q: "What if I think I'm being overcharged?", a: 'Review the itemized line items on the invoice before paying. If something looks wrong, contact your contractor directly. You can also use Honest Estimate (free) to check fair market pricing for any job.' },
                { q: 'Will I get a receipt?', a: "Yes — immediately after payment you'll receive an email receipt with a full breakdown of charges and a payment confirmation number." },
              ].map(({ q, a }) => (
                <div key={q} className="rounded-xl border bg-card px-6 py-5">
                  <dt className="font-semibold mb-1">{q}</dt>
                  <dd className="text-sm text-muted-foreground leading-relaxed">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Contractor CTA */}
        <section className="border-t py-14 text-center">
          <div className="container mx-auto px-4 max-w-xl">
            <h2 className="mb-3 text-2xl font-bold">Are you a contractor or freelancer?</h2>
            <p className="mb-6 text-muted-foreground">
              Send professional invoices with a built-in Pay Now button — free forever. Your clients pay by card, funds go straight to your Stripe account.
            </p>
            <Button size="lg" asChild>
              <Link to="/signup" className="gap-1.5 inline-flex items-center">
                Create Free Account <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
            <span className="text-sm text-muted-foreground">© 2026 Honest Invoice. All rights reserved.</span>
            <nav className="flex gap-6 text-sm text-muted-foreground" aria-label="Footer navigation">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
