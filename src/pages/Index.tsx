import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FileText, Wand2, Smartphone, CheckCircle2 } from 'lucide-react';
import logoLight from '@/assets/honest-invoice-logo.png';
import logoDark from '@/assets/honest-invoice-logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';
import { SEOHead } from '@/components/seo/SEOHead';

// Feature data with SEO-optimized descriptions and alt text
const features = [
  {
    icon: Wand2,
    title: 'Automated Invoice & Estimate Extraction',
    description: 'Describe your job in plain language and let our system automatically generate accurate, itemized line items for freelancers and contractors.',
    altText: 'Invoice and estimate automation tool extracting line items from job description',
  },
  {
    icon: Smartphone,
    title: 'Offline Estimates & Invoices',
    description: 'Create, edit, and save estimates and invoices without internet connection—perfect for contractors working on remote job sites.',
    altText: 'Mobile offline invoicing and estimate app for contractors and field workers',
  },
  {
    icon: FileText,
    title: 'Professional PDF Generator',
    description: 'Export polished, client-ready PDF invoices and estimates instantly. Customizable templates that help freelancers get paid faster.',
    altText: 'Professional PDF invoice and estimate template generator for small businesses',
  },
  {
    icon: CheckCircle2,
    title: 'Fast & Simple Billing Software',
    description: 'Streamlined workflow built for busy freelancers, designers, and small business owners who need to bill or estimate quickly.',
    altText: 'Simple billing and estimate software dashboard for freelancers and small businesses',
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

      {/* Honest SEO Ad Banner */}
      <section className="border-t py-10" style={{ background: 'linear-gradient(135deg, hsl(220 25% 10%) 0%, hsl(220 30% 14%) 100%)' }}>
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[hsl(220_25%_8%)] to-[hsl(220_30%_12%)] p-6 sm:p-8 shadow-2xl">
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" aria-hidden="true" />
            <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-4xl shadow-lg">
                🔍
              </div>
              <div className="flex-1">
                <div className="mb-1 inline-block rounded-full bg-primary/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-primary">
                  From the makers of Honest Invoice
                </div>
                <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                  Is Your Website Invisible to Google?
                </h3>
                <p className="mt-1 text-sm text-white/60 sm:text-base">
                  <span className="font-semibold text-primary">Honest SEO</span> — Free, no-BS SEO audit tool. Scan any URL, get a real report with actionable fixes. No upsells. No email required.
                </p>
              </div>
              <a
                href="https://honestinvoice.com/seo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-primary/30 hover:shadow-xl active:scale-95"
              >
                Scan My Site Free →
              </a>
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
