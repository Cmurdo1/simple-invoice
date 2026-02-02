import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FileText, Wand2, Smartphone, CheckCircle2 } from 'lucide-react';
import logoLight from '@/assets/honest-invoice-logo.png';
import logoDark from '@/assets/honest-invoice-logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';

// Feature data with SEO-optimized descriptions and alt text
const features = [
  {
    icon: Wand2,
    title: 'AI-Powered Invoice Line Item Extraction',
    description: 'Describe your job in plain language and let our AI automatically generate accurate, itemized invoice line items for freelancers and contractors.',
    altText: 'AI invoice automation tool extracting line items from job description',
  },
  {
    icon: Smartphone,
    title: 'Offline Invoicing for Field Work',
    description: 'Create, edit, and save invoices without internet connection—perfect for contractors working on remote job sites.',
    altText: 'Mobile offline invoicing app for contractors and field workers',
  },
  {
    icon: FileText,
    title: 'Professional PDF Invoice Generator',
    description: 'Export polished, client-ready PDF invoices instantly. Customizable templates that help freelancers get paid faster.',
    altText: 'Professional PDF invoice template generator for small businesses',
  },
  {
    icon: CheckCircle2,
    title: 'Fast & Simple Billing Software',
    description: 'Streamlined invoicing workflow built for busy freelancers, designers, and small business owners who need to bill quickly.',
    altText: 'Simple billing software dashboard for freelancers and small businesses',
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
              <span className="text-primary">Invoicing</span> &{' '}
              <span className="text-primary">Billing</span> Software
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Stop chasing payments. Automate your billing, track expenses, and get paid 2x faster. 
              Trusted by 10,000+ freelancers and small businesses worldwide.
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
            Powerful Invoicing Tools for Freelancers & Small Businesses
          </h2>
          <p className="mb-12 text-center text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create professional invoices, track payments, and manage your business finances.
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
          <h2 id="cta-heading" className="mb-4 text-3xl font-bold">
            Ready to Streamline Your Invoicing?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Join 10,000+ freelancers, designers, and small business owners who save hours every week with Honest Invoice.
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">Create Your Free Account</Link>
          </Button>
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
  );
}
