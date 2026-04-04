import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FileText, Wand2, Smartphone, CreditCard, Users, Mail, Bot, MonitorSmartphone, ChevronDown, Sparkles, ShieldCheck, Zap } from 'lucide-react';
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
    question: 'What is The Gold Card?',
    answer: 'The Gold Card is an elite, AI-powered invoicing and business management platform designed for high-performing professionals. It offers precision itemization, seamless Stripe payments, and a professional, high-fidelity brand image for your business.',
  },
  {
    question: 'How does the AI-powered precision work?',
    answer: 'Simply describe your job or project in plain language. Our advanced AI synthesizes the data to generate a fully itemized invoice, including labor, parts, and regional pricing standards, in a matter of seconds.',
  },
  {
    question: 'Is The Gold Card really free?',
    answer: 'Yes. We offer a robust free tier that allows for unlimited high-quality invoices and estimates. Our premium Pro tier offers additional features like advanced analytics and seamless Stripe payment settlement.',
  },
  {
    question: 'How do my clients settle payments?',
    answer: 'Every Gold Card invoice includes an integrated, secure payment portal. Your clients can settle their invoices instantly via card or bank transfer, with funds deposited directly into your linked accounts.',
  },
  {
    question: 'Does it work in remote locations?',
    answer: 'Absolutely. The Gold Card was engineered for elite performance on any site. You can create, edit, and manage your billing without an internet connection—your data syncs automatically as soon as you are back on the grid.',
  },
  {
    question: 'Can I customize my brand presence?',
    answer: 'Yes. The Gold Card allows you to maintain a professional brand presence. Your logo, corporate colors, and detailed breakdowns are rendered in high-fidelity PDF and web formats for your clients.',
  },
];

export default function Index() {
  const { user, loading } = useAuth();
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
        "name": "The Gold Card | Premium Invoicing for the Modern Elite",
        "description": "Elevate your business to the gold standard. AI-powered estimates, seamless payments, and professional branding for high-performing professionals.",
        "url": "https://goldcard.com",
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "The Gold Card", "item": "https://goldcard.com" }]
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
        title="The Gold Card | Premium Invoicing for the Modern Elite"
        description="Elevate your business to the gold standard. AI-powered estimates, seamless payments, and professional branding for high-performing professionals."
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/30 selection:text-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-black">
              <Zap className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight">GOLD CARD</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hidden text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors sm:block">
              Sign In
            </Link>
            <Button className="h-11 px-8 text-sm font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all hover:scale-105" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Inspired by design_0.png */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden py-24 sm:py-32">
        {/* Luxury Background Effects */}
        <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -top-24 right-0 -z-10 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3 w-3" />
              <span>Elevate Your Standard</span>
            </div>

            <h1 className="mb-8 text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl">
              THE <span className="text-primary italic">GOLD</span> CARD<br />
              <span className="text-muted-foreground">REDEFINING SUCCESS</span>
            </h1>

            <p className="mx-auto mb-12 max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground sm:text-xl">
              Stop chasing payments. Automate your billing with AI precision and get paid instantly.
              The ultimate power tool for high-performing professionals.
            </p>

            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Button size="lg" className="h-16 min-w-[240px] px-10 text-base font-black uppercase tracking-widest shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all hover:scale-105 active:scale-95" asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-16 min-w-[240px] border-primary/20 bg-white/5 px-10 text-base font-black uppercase tracking-widest backdrop-blur-lg transition-all hover:bg-primary/10 active:scale-95" asChild>
                <Link to="/login">Watch Demo</Link>
              </Button>
            </div>

            {/* Social Proof Strip */}
            <div className="mt-20 flex flex-wrap items-center justify-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Enterprise Grade</span>
              </div>
              <div className="h-1 w-1 rounded-full bg-primary/30" />
              <div>12,500+ Active Users</div>
              <div className="h-1 w-1 rounded-full bg-primary/30" />
              <div>Stripe Partner</div>
              <div className="h-1 w-1 rounded-full bg-primary/30" />
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>Instant Payouts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 -z-20 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]"
          style={{ backgroundImage: 'radial-gradient(hsl(var(--primary) / 0.15) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </section>

      {/* Features Bento Grid - Inspired by design_2.png */}
      <section className="relative bg-black/40 py-24 sm:py-32" aria-labelledby="features-heading">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-20 text-center">
            <h2 id="features-heading" className="mb-6 text-4xl font-black tracking-tighter sm:text-5xl">
              POWERFUL <span className="text-primary italic">FEATURES</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg font-medium text-muted-foreground">
              Every detail engineered for professional performance. Experience the gold standard in business automation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-6 lg:grid-rows-2">
            {/* Main Feature - AI Powered (Large Card) */}
            <article className="col-span-1 rounded-3xl border border-primary/20 bg-primary/5 p-8 backdrop-blur-sm md:col-span-4 lg:row-span-2">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-black">
                <Wand2 className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-3xl font-black tracking-tight">{features[0].title}</h3>
              <p className="mb-8 max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
                {features[0].description}
              </p>
              <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl border border-primary/10 bg-black/40">
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-primary/40">
                  <span className="text-xs font-bold uppercase tracking-[0.3em]">Advanced AI Dashboard Preview</span>
                </div>
                {/* Decorative gold lines */}
                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-[60px]" />
              </div>
            </article>

            {/* Feature 2 - Payments (Tall Card) */}
            <article className="col-span-1 flex flex-col justify-between rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-colors hover:border-primary/20 md:col-span-2">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-black tracking-tight">{features[1].title}</h3>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                  {features[1].description}
                </p>
              </div>
            </article>

            {/* Feature 3 - Email (Square Card) */}
            <article className="col-span-1 flex flex-col justify-between rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-colors hover:border-primary/20 md:col-span-2">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-black tracking-tight">{features[2].title}</h3>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                  {features[2].description}
                </p>
              </div>
            </article>

            {/* Small dynamic bento items */}
            <article className="col-span-1 flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-colors hover:border-primary/20 md:col-span-3 lg:col-span-2">
               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-black tracking-tight uppercase">{features[3].title}</h3>
            </article>

            <article className="col-span-1 flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-colors hover:border-primary/20 md:col-span-3 lg:col-span-2">
               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-black tracking-tight uppercase">{features[4].title}</h3>
            </article>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white/[0.01] py-24 sm:py-32" aria-labelledby="how-it-works-heading">
        <div className="container mx-auto px-4">
          <h2 id="how-it-works-heading" className="mb-4 text-center text-4xl font-black tracking-tighter">
            THE <span className="text-primary italic">PROCESS</span>
          </h2>
          <p className="mb-16 text-center text-lg font-medium text-muted-foreground max-w-xl mx-auto">
            Three steps to financial excellence. Engineered for speed and precision.
          </p>
          <div className="relative flex flex-col gap-0 md:flex-row md:items-start md:gap-0">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-[1px] bg-primary/20 z-0" aria-hidden="true" />

            {[
              {
                step: '01',
                icon: Bot,
                title: 'AI Synthesis',
                description: 'Describe the job in plain language. Our AI generates a precision itemized invoice in seconds.',
              },
              {
                step: '02',
                icon: MonitorSmartphone,
                title: 'Elite Delivery',
                description: 'Share a professional, branded link or export a high-fidelity PDF instantly.',
              },
              {
                step: '03',
                icon: CreditCard,
                title: 'Instant Settlement',
                description: 'Collect payments via secure Stripe integration. Funds settle directly to your accounts.',
              },
            ].map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="relative z-10 flex flex-col items-center text-center flex-1 px-6 pb-12 md:pb-0">
                {/* Step badge */}
                <div className="mb-6 flex h-24 w-24 flex-col items-center justify-center rounded-full border border-primary/20 bg-background shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">{step}</span>
                  <Icon className="mt-1 h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-3 text-xl font-black tracking-tight">{title}</h3>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground max-w-xs">{description}</p>
                {/* Mobile connector */}
                <div className="md:hidden mt-8 h-12 w-[1px] bg-primary/20 mx-auto last:hidden" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Program Section */}
      <section className="border-y border-white/5 py-24 sm:py-32" aria-labelledby="referral-heading">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              🎁 Elite Referral Program
            </div>
            <h2 id="referral-heading" className="text-4xl font-black tracking-tighter mb-6">
              EXPAND THE <span className="text-primary italic">NETWORK</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-medium">
              Share your unique access link. Every partner who joins earns you <strong className="text-primary">1 free month of Pro</strong> access.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: '01', emoji: '🔗', title: 'Secure Link', desc: 'Find your unique invitation link on your private dashboard.' },
              { step: '02', emoji: '📤', title: 'Share Access', desc: 'Invite high-performing peers to join the gold standard.' },
              { step: '03', emoji: '🏆', title: 'Earn Status', desc: 'When they activate, you both receive instant Pro status.' },
            ].map(({ step, emoji, title, desc }) => (
              <div key={step} className="relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 text-center transition-colors hover:border-primary/20">
                <div className="mb-6 mx-auto flex h-16 w-16 flex-col items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-2xl shadow-inner">
                  {emoji}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-2">Step {step}</div>
                <h3 className="font-black text-lg mb-3 tracking-tight">{title}</h3>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <Button size="lg" className="h-14 px-10 text-sm font-black uppercase tracking-widest" asChild>
              <Link to="/signup">Join & Invite Partners</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24 text-center sm:py-32" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-3xl">
          <p className="mb-8 text-2xl font-black tracking-tight text-primary italic leading-tight">
            "Redefining the standard for professional billing. Precision meets performance."
          </p>
          <h2 id="cta-heading" className="mb-6 text-4xl font-black tracking-tighter sm:text-5xl">
            READY TO JOIN THE <span className="text-primary">ELITE</span>?
          </h2>
          <p className="mb-12 text-lg font-medium text-muted-foreground">
            Join thousands of high-performing professionals who have elevated their business to the Gold Standard.
          </p>
          <Button size="lg" className="h-16 px-12 text-base font-black uppercase tracking-widest shadow-[0_0_30px_rgba(212,175,55,0.2)]" asChild>
            <Link to="/signup">Get Started Now</Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white/[0.01] py-24 sm:py-32" aria-labelledby="faq-heading">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 id="faq-heading" className="mb-4 text-center text-4xl font-black tracking-tighter">
            THE <span className="text-primary italic">INTEL</span>
          </h2>
          <p className="mb-16 text-center text-lg font-medium text-muted-foreground">
            Everything you need to know about the Gold Standard.
          </p>
          <dl className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.01] transition-colors hover:border-primary/10 overflow-hidden">
                <dt>
                  <button
                    className="flex w-full items-center justify-between px-8 py-6 text-left font-bold tracking-tight hover:text-primary transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    {faq.question}
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                </dt>
                {openFaq === i && (
                  <dd className="px-8 pb-6 text-base font-medium text-muted-foreground leading-relaxed animate-accordion-down">
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
      <footer className="border-t border-white/5 bg-black py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-black">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tighter">GOLD CARD</span>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60" aria-label="Footer navigation">
              <Link to="/invoice-templates" className="hover:text-primary transition-colors">Templates</Link>
              <Link to="/pay" className="hover:text-primary transition-colors">Payments</Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <a href="mailto:support@goldcard.com" className="hover:text-primary transition-colors">Support</a>
            </nav>

            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">
              © 2024 THE GOLD CARD. ALL RIGHTS RESERVED.
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
