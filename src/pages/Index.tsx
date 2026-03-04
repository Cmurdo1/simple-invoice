import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FileText, Wand2, Smartphone, Camera, Eye, Zap } from 'lucide-react';
import logoLight from '@/assets/honest-invoice-logo.png';
import logoDark from '@/assets/honest-invoice-logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';
import { SEOHead } from '@/components/seo/SEOHead';

// Core product features
const features = [
  {
    icon: Camera,
    title: 'Live Proof-of-Work',
    description: 'Attach photo and video timestamps directly to line items. Every charge has visual evidence—disputes become impossible.',
    altText: 'Photo and video proof attached to invoice line items for transparent billing',
  },
  {
    icon: Eye,
    title: 'Real-Time Client View',
    description: 'A live dashboard your client can watch as you check off tasks. No more mystery charges—they see the work as it happens.',
    altText: 'Real-time client view showing live invoice progress for field service workers',
  },
  {
    icon: Zap,
    title: 'Frictionless Settlement',
    description: 'One-click payment triggered the moment the job is marked complete. No more "I\'ll pay you when I get home."',
    altText: 'One-click invoice payment on job completion for contractors and mechanics',
  },
  {
    icon: Wand2,
    title: 'AI-Powered Line Items',
    description: 'Describe your job in plain language and let our AI generate accurate, itemized line items—from labor to parts.',
    altText: 'AI invoice and estimate automation tool for field service professionals',
  },
  {
    icon: Smartphone,
    title: 'Works Offline',
    description: 'Create, edit, and save estimates and invoices without internet—built for remote job sites and dead zones.',
    altText: 'Offline invoicing app for contractors working in areas without internet',
  },
  {
    icon: FileText,
    title: 'Professional PDFs',
    description: 'Export polished, client-ready PDF invoices and estimates instantly. Built for the field, not the office.',
    altText: 'Professional PDF invoice generator for trades and field service workers',
  },
];

export default function Index() {
  const { user, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? logoDark : logoLight;

  // If user is logged in, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <SEOHead canonicalUrl="/" />
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
              Free Online{' '}
              <span className="text-primary">Invoices</span> &{' '}
              <span className="text-primary">Estimates</span>
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
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-20" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <h2 id="features-heading" className="mb-4 text-center text-3xl font-bold">
            Powerful Invoicing & Estimate Tools
          </h2>
          <p className="mb-12 text-center text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create professional invoices and estimates, track payments, and manage your business finances.
          </p>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-lg border bg-card p-6 text-center"
                  aria-label={feature.altText}
                >
                  <div 
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"
                    role="img"
                    aria-label={feature.altText}
                  >
                    <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              );
            })}
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
