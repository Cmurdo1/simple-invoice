import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FileText, Wand2, Smartphone, CreditCard, Users, Mail, Bot, MonitorSmartphone, ChevronDown } from 'lucide-react';
import logoLight from '@/assets/honest-invoice-logo.png';
import logoDark from '@/assets/honest-invoice-logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { useState } from 'react';

// Core product features — all are real, working features in the app
const features = [
  {
    icon: Wand2,
    title: 'AI-Powered Line Items',
    description: 'Describe your job in plain language and our AI generates a fully itemized invoice—labor, parts, and regional pricing—in seconds.',
    altText: 'AI invoice and estimate automation tool for field service professionals',
  },
  {
    icon: CreditCard,
    title: 'Stripe Payment Collection',
    description: 'Pro users get a unique payment link on every invoice. Clients pay by card directly—funds go straight to your Stripe account.',
    altText: 'Stripe payment link on invoice for contractors to collect payments online',
  },
  {
    icon: Mail,
    title: 'Send Invoices by Email',
    description: 'Email professional, branded invoices directly to clients with a Pay Now button included. No manual copy-pasting.',
    altText: 'Email invoice with pay now button for small business owners',
  },
  {
    icon: FileText,
    title: 'Professional PDF Export',
    description: 'Export polished, client-ready PDF invoices and estimates in one tap—your logo, brand color, and itemized breakdown included.',
    altText: 'Professional PDF invoice generator for trades and field service workers',
  },
  {
    icon: Smartphone,
    title: 'Works Offline',
    description: 'Create, edit, and save invoices without internet. Built for remote job sites and dead zones—syncs automatically when you reconnect.',
    altText: 'Offline invoicing app for contractors working in areas without internet',
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Store client names, emails, phone numbers, and addresses. Reuse them on any invoice with a single tap—no re-typing.',
    altText: 'Client management CRM for freelancers and contractors',
  },
];

const faqs = [
  {
    question: 'What is an invoice?',
    answer: 'An invoice is a formal document sent by a seller to a buyer that requests payment for goods or services provided. It typically includes the seller\'s details, client information, a list of line items with descriptions and prices, the total amount due, due date, and a unique invoice number. Invoices serve as both a payment request and an official record for accounting purposes.',
  },
  {
    question: 'What is an invoice template?',
    answer: 'An invoice template is a pre-formatted document that lets you quickly fill in job details—client name, line items, prices, and payment terms—without building an invoice from scratch each time. Honest Invoice provides a free, professional invoice template with your logo, brand color, and itemized breakdown. Our AI auto-fills line items from a plain-language job description, so your template is ready in seconds.',
  },
  {
    question: 'How do clients pay an invoice?',
    answer: 'With Honest Invoice, clients can pay an invoice online via a secure Stripe payment link embedded directly in the invoice. Pro users get a "Pay Now" button on every emailed invoice and a unique payment URL clients can open on any device. Funds go straight to your Stripe account—no middleman, no delays.',
  },
  {
    question: 'Is Honest Invoice really free?',
    answer: 'Yes. Honest Invoice is a completely free invoice generator. Create unlimited invoices and estimates with no hidden fees, no credit card required, and no expiring trial.',
  },
  {
    question: 'How do I create a free invoice online?',
    answer: 'Sign up for free at honestinvoice.com, describe your job in plain English, and our AI instantly generates a fully itemized invoice. Export as PDF or send by email in one click.',
  },
  {
    question: 'Can I collect payments with Honest Invoice?',
    answer: 'Yes. Pro users get a Stripe payment link embedded in every invoice. Clients can pay by card directly — funds go straight to your Stripe account.',
  },
  {
    question: 'Can I make free estimates?',
    answer: 'Yes. Generate free professional estimates with our AI tool and convert them to invoices with a single tap.',
  },
  {
    question: 'Does Honest Invoice work offline?',
    answer: 'Yes. Create and edit free invoices and estimates without internet. Data syncs automatically when you reconnect — perfect for job sites with no signal.',
  },
  {
    question: 'What makes Honest Invoice better than other free invoice generators?',
    answer: 'Honest Invoice combines AI-powered line item extraction, built-in Stripe payments, email delivery with a Pay Now button, offline support, and professional PDF exports — all in one completely free tool.',
  },
];

export default function Index() {
  const { user, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? logoDark : logoLight;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // If user is logged in, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "name": "Free Invoice Template & Generator — Honest Invoice",
        "description": "Create free professional invoices and estimates online. AI-powered, Stripe payments, email delivery, PDF export, offline support. 100% free.",
        "url": "https://honestinvoice.com",
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Free Invoice Template", "item": "https://honestinvoice.com" }]
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer,
          },
        })),
      }
    ]
  };

  return (
    <>
      <SEOHead
        canonicalUrl="/"
        title="Free Invoice Generator — Create & Send Invoices Online | Honest Invoice"
        description="Honest Invoice is the #1 free invoice generator. Create professional invoices & estimates in seconds, send by email with a Pay Now button, and collect payments via Stripe. 100% free. No credit card needed."
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Honest Invoice - Free online invoicing and billing software for freelancers" 
              className="h-10 w-10" 
            />
            <span className="text-xl font-bold">Honest Invoice</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero with optimized gradient background */}
      <section 
        className="relative overflow-hidden py-20"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(220 25% 12%) 50%, hsl(142 72% 20% / 0.3) 100%)'
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(142_72%_42%_/_0.1),_transparent_50%)]" aria-hidden="true" />
        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Free Invoice{' '}
              <span className="text-primary">Generator</span> &{' '}
              <span className="text-primary">Estimator</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Stop chasing payments. Automate your billing, track expenses, and get paid 2x faster. 
              Trusted by freelancers and small businesses worldwide.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="min-w-[200px]" asChild>
                <Link to="/signup">Start Free Today</Link>
              </Button>
              <Button size="lg" variant="outline" className="min-w-[200px]" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
            {/* Internal SEO links — improve crawlability for key landing pages */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm">
              <Link to="/invoice-templates" className="text-primary hover:underline underline-offset-4">
                Free Invoice Templates →
              </Link>
              <Link to="/pay" className="text-muted-foreground hover:text-foreground transition-colors">
                Pay an Invoice
              </Link>
            </div>
            {/* Social proof strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="text-primary font-bold">★★★★★</span> 4.9 / 5</span>
              <span className="h-4 w-px bg-border" aria-hidden="true" />
              <span><strong className="text-foreground">12,500+</strong> invoices created</span>
              <span className="h-4 w-px bg-border" aria-hidden="true" />
              <span><strong className="text-foreground">100% free</strong> — no credit card</span>
              <span className="h-4 w-px bg-border" aria-hidden="true" />
              <span>Works <strong className="text-foreground">offline</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-20" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <h2 id="features-heading" className="mb-4 text-center text-3xl font-bold">
            Built for the Field. Trusted in the Trades.
          </h2>
          <p className="mb-12 text-center text-muted-foreground max-w-2xl mx-auto">
            Every feature exists because a mechanic needed it on a real job site. Proof, transparency, and instant payment—baked into every invoice.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-xl border bg-card p-6 flex gap-4 items-start hover:border-primary/40 transition-colors"
                  aria-label={feature.altText}
                >
                  <div 
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                    role="img"
                    aria-label={feature.altText}
                  >
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20" aria-labelledby="how-it-works-heading">
        <div className="container mx-auto px-4">
          <h2 id="how-it-works-heading" className="mb-4 text-center text-3xl font-bold">
            How It Works
          </h2>
          <p className="mb-14 text-center text-muted-foreground max-w-xl mx-auto">
            Three steps. From first wrench turn to cash in hand.
          </p>
          <div className="relative flex flex-col gap-0 md:flex-row md:items-start md:gap-0">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-0.5 bg-border z-0" aria-hidden="true" />

            {[
              {
                step: '01',
                icon: Bot,
                title: 'Create Invoice with AI',
                description: 'Describe the job in plain English. AI generates a fully itemized invoice with accurate line items, labor, and parts in seconds.',
              },
              {
                step: '02',
                icon: MonitorSmartphone,
                title: 'Send & Share',
                description: 'Email the invoice to your client with a branded Pay Now button, or export as PDF to share on the spot.',
              },
              {
                step: '03',
                icon: CreditCard,
                title: 'Get Paid via Stripe',
                description: 'Clients pay by card through your unique payment link. Funds go directly to your Stripe account—instant, secure, zero friction.',
              },
            ].map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="relative z-10 flex flex-col items-center text-center flex-1 px-6 pb-12 md:pb-0">
                {/* Step badge */}
                <div className="mb-4 flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-primary bg-background shadow-md">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">{step}</span>
                  <Icon className="mt-0.5 h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-lg font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{description}</p>
                {/* Mobile connector */}
                <div className="md:hidden mt-6 h-10 w-0.5 bg-border mx-auto last:hidden" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Program Section */}
      <section className="border-t py-20" aria-labelledby="referral-heading">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              🎁 Referral Program
            </div>
            <h2 id="referral-heading" className="text-3xl font-bold mb-4">
              Give a Month, Get a Month
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Share your unique link. Every friend who signs up earns you <strong className="text-foreground">1 free month of Pro</strong>. No limits — refer 10 people, get 10 free months.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: '01', emoji: '🔗', title: 'Get Your Link', desc: 'Sign up for free and find your unique referral link right on your dashboard.' },
              { step: '02', emoji: '📤', title: 'Share It', desc: 'Text it, post it, email it — every contractor, freelancer, or tradesperson is a potential referral.' },
              { step: '03', emoji: '🏆', title: 'Earn Free Pro', desc: 'When they sign up, you both get 1 free month of Pro — instantly credited, no strings attached.' },
            ].map(({ step, emoji, title, desc }) => (
              <div key={step} className="relative rounded-xl border bg-card p-6 text-center">
                <div className="mb-4 mx-auto flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-primary bg-primary/5 text-2xl">
                  {emoji}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Step {step}</div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button size="lg" asChild>
              <Link to="/signup">Sign Up & Get Your Link</Link>
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">Already have an account? Your referral link is on your dashboard.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-2xl">
          <p className="mb-6 text-xl font-medium text-primary italic">
            "Don't trust the estimate you received? Think you're being overcharged? Use Honest Estimate and find out, free of charge."
          </p>
          <h2 id="cta-heading" className="mb-4 text-3xl font-bold">
            Ready to Streamline Your Business?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Join freelancers, designers, and small business owners who save hours every week with Honest Invoice.
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">Create Your Free Account</Link>
          </Button>
        </div>
      </section>

      {/* FAQ — matches FAQPage JSON-LD for Google rich snippets */}
      <section className="border-t py-20" aria-labelledby="faq-heading">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 id="faq-heading" className="mb-3 text-center text-3xl font-bold">
            Frequently Asked Questions
          </h2>
          <p className="mb-10 text-center text-muted-foreground">
            Everything you need to know about the free invoice generator.
          </p>
          <dl className="divide-y divide-border rounded-xl border bg-card overflow-hidden">
            {faqs.map((faq, i) => (
              <div key={i}>
                <dt>
                  <button
                    className="flex w-full items-center justify-between px-6 py-5 text-left font-semibold hover:bg-muted/40 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    {faq.question}
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                </dt>
                {openFaq === i && (
                  <dd className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Honest SEO Ad Banner — bold, high-contrast interrupt */}
      <section className="py-12 overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(43 96% 52%) 0%, hsl(32 95% 50%) 40%, hsl(14 90% 52%) 100%)' }}>
        <div className="container mx-auto px-4">
          <div className="relative">
            {/* Loud background text watermark */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden"
              aria-hidden="true"
            >
              <span className="text-[10rem] font-black uppercase tracking-tighter text-black/10 leading-none whitespace-nowrap">
                FREE SEO AUDIT
              </span>
            </div>

            <div className="relative flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left lg:gap-10">
              {/* Icon block */}
              <div className="flex-shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-black/20 text-5xl shadow-2xl border-2 border-black/10">
                🔍
              </div>

              {/* Copy */}
              <div className="flex-1">
                <div className="mb-2 inline-block rounded-full bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black/70">
                  ⚡ Also free — from the same team
                </div>
                <h3 className="text-3xl font-black text-black leading-tight sm:text-4xl">
                  Is Google ignoring<br className="hidden sm:block" /> your website?
                </h3>
                <p className="mt-2 text-sm font-semibold text-black/70 sm:text-base max-w-lg">
                  <span className="text-black font-black">Honest SEO</span> — Paste a URL. Get a brutal, honest audit in seconds. No account. No upsells. No fluff.
                </p>
              </div>

              {/* CTA */}
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <a
                  href="https://honest-seo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-block rounded-2xl bg-black px-8 py-4 text-base font-black text-yellow-400 shadow-2xl transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 hover:shadow-black/40 active:scale-95"
                >
                  <span className="relative z-10">Scan My Site Free →</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <span className="text-[11px] font-bold text-black/50 uppercase tracking-wider">No signup needed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="Honest Invoice - Free online invoicing software logo" 
              className="h-6 w-6" 
              loading="lazy"
            />
            <span className="text-sm text-muted-foreground">
              © 2026 Honest Invoice. All rights reserved.
            </span>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground" aria-label="Footer navigation">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <a href="mailto:support@honestinvoice.com" className="hover:text-foreground transition-colors">Contact Support</a>
          </nav>
        </div>
      </footer>
    </div>
    </>
  );
}
