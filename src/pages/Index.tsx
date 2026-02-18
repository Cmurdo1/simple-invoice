import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Search, FileText, Wand2, Smartphone, CheckCircle2, ArrowRight, Users, DollarSign } from 'lucide-react';
import logoLight from '@/assets/honest-invoice-logo.png';
import logoDark from '@/assets/honest-invoice-logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { TIERS } from '@/lib/subscriptionTiers';

// Customer-facing features
const customerFeatures = [
  {
    icon: ShieldCheck,
    title: 'Instant Estimate Checker',
    description: 'Paste any contractor estimate and get an AI-powered fairness analysis in seconds. Know exactly if you\'re being overcharged.',
  },
  {
    icon: Search,
    title: 'Line-by-Line Price Comparison',
    description: 'Every item on your estimate is compared against regional market rates so you can see exactly where costs are inflated.',
  },
  {
    icon: DollarSign,
    title: 'Savings Calculator',
    description: 'See your potential savings instantly. Use data-backed fair prices to negotiate with your contractor confidently.',
  },
  {
    icon: Users,
    title: 'Trusted by Thousands',
    description: 'Homeowners and customers use Honest Invoice to keep their contractors accountable and their budgets on track.',
  },
];

// Contractor-facing features
const contractorFeatures = [
  {
    icon: Wand2,
    title: 'AI Invoice & Estimate Builder',
    description: 'Describe the job in plain language and get itemized, professional estimates generated automatically.',
  },
  {
    icon: Smartphone,
    title: 'Works Offline',
    description: 'Create and edit invoices without internet — perfect for remote job sites. Syncs when you\'re back online.',
  },
  {
    icon: FileText,
    title: 'Professional PDF Export',
    description: 'Generate polished, client-ready PDF invoices and estimates instantly with your custom branding.',
  },
  {
    icon: CheckCircle2,
    title: 'Fast & Simple Billing',
    description: 'Streamlined workflow built for busy contractors who need to estimate and bill quickly.',
  },
];

export default function Index() {
  const { user, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? logoDark : logoLight;

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <SEOHead
        title="Honest Invoice | Check If Your Contractor's Estimate Is Fair"
        description="Free AI-powered estimate checker. Paste your contractor's quote and instantly see if you're being overcharged. Trusted by homeowners nationwide."
        canonicalUrl="/"
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Honest Invoice" className="h-10 w-10" />
              <span className="text-xl font-bold">Honest Invoice</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/compare">Check an Estimate</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero - Customer First */}
        <section
          className="relative overflow-hidden py-20 lg:py-28"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(220 25% 12%) 50%, hsl(142 72% 20% / 0.3) 100%)'
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(142_72%_42%_/_0.1),_transparent_50%)]" aria-hidden="true" />
          <div className="container relative mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl">
              <Badge variant="outline" className="mb-6 gap-2 px-4 py-1.5 text-sm border-primary/30">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Free Estimate Checker — No Account Required
              </Badge>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Is Your Contractor Being{' '}
                <span className="text-primary">Honest?</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                Don't overpay. Paste any contractor estimate and our AI instantly compares every line item
                against regional market rates — so you know exactly what's fair.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="min-w-[240px] gap-2" asChild>
                  <Link to="/compare">
                    <ShieldCheck className="h-5 w-5" />
                    Check an Estimate Free
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="min-w-[200px]" asChild>
                  <Link to="/signup">I'm a Contractor</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                10 free comparisons/month • No credit card required
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-4 text-center text-3xl font-bold">How It Works</h2>
            <p className="mb-12 text-center text-muted-foreground max-w-xl mx-auto">
              Three simple steps to know if your estimate is fair
            </p>
            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              {[
                { step: '1', title: 'Paste Your Estimate', desc: 'Copy the line items and prices from the estimate you received from your contractor.' },
                { step: '2', title: 'AI Analyzes It', desc: 'Our AI compares every item against regional pricing data and industry standards.' },
                { step: '3', title: 'Get Your Fairness Score', desc: 'See a clear score, line-by-line breakdown, and potential savings at a glance.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                    {item.step}
                  </div>
                  <h3 className="mb-2 font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link to="/compare">
                  Try It Now <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Customer Features */}
        <section className="py-20" aria-labelledby="customer-features-heading">
          <div className="container mx-auto px-4">
            <Badge variant="outline" className="mx-auto mb-4 flex w-fit gap-2 px-3 py-1">
              <ShieldCheck className="h-3 w-3" /> For Customers
            </Badge>
            <h2 id="customer-features-heading" className="mb-4 text-center text-3xl font-bold">
              Protect Yourself From Overcharging
            </h2>
            <p className="mb-12 text-center text-muted-foreground max-w-2xl mx-auto">
              Whether it's a roof repair, plumbing job, or full renovation — make sure you're paying a fair price.
            </p>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {customerFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded-lg border bg-card p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contractor Section */}
        <section className="border-t bg-muted/30 py-20" aria-labelledby="contractor-features-heading">
          <div className="container mx-auto px-4">
            <Badge variant="outline" className="mx-auto mb-4 flex w-fit gap-2 px-3 py-1">
              <FileText className="h-3 w-3" /> For Contractors
            </Badge>
            <h2 id="contractor-features-heading" className="mb-4 text-center text-3xl font-bold">
              Build Trust With Transparent Billing
            </h2>
            <p className="mb-12 text-center text-muted-foreground max-w-2xl mx-auto">
              Professional invoicing tools that help you win more jobs by proving your pricing is fair and competitive.
            </p>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {contractorFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded-lg border bg-card p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20" aria-labelledby="pricing-heading">
          <div className="container mx-auto px-4">
            <h2 id="pricing-heading" className="mb-4 text-center text-3xl font-bold">
              Simple, Honest Pricing
            </h2>
            <p className="mb-12 text-center text-muted-foreground max-w-xl mx-auto">
              Start free. Upgrade when you need more.
            </p>
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {(Object.entries(TIERS) as [string, typeof TIERS[keyof typeof TIERS]][]).map(([key, tier]) => (
                <div
                  key={key}
                  className={`rounded-xl border p-6 ${key === 'pro' ? 'border-primary ring-2 ring-primary/20 relative' : ''}`}
                >
                  {key === 'pro' && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                  )}
                  <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">
                      {tier.price === 0 ? 'Free' : `$${tier.price}`}
                    </span>
                    {tier.price > 0 && <span className="text-muted-foreground">/month</span>}
                  </div>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={key === 'pro' ? 'default' : 'outline'}
                    className="w-full"
                    asChild
                  >
                    <Link to={key === 'free' ? '/compare' : '/signup'}>
                      {key === 'free' ? 'Start Free' : `Get ${tier.name}`}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-muted/30 py-20 text-center" aria-labelledby="cta-heading">
          <div className="mx-auto max-w-2xl px-4">
            <p className="mb-6 text-xl font-medium text-primary italic">
              "Don't trust the estimate you received? Think you're being overcharged? Check it for free."
            </p>
            <h2 id="cta-heading" className="mb-4 text-3xl font-bold">
              Know What's Fair Before You Pay
            </h2>
            <p className="mb-8 text-muted-foreground">
              Join thousands of homeowners and contractors who trust Honest Invoice to keep pricing transparent.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/compare">
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  Check an Estimate
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/signup">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Honest Invoice" className="h-6 w-6" loading="lazy" />
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
