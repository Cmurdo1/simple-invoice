import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FileText, Wand2, Smartphone, CheckCircle2 } from 'lucide-react';
import logo from '@/assets/honest-invoice-logo.png';

const features = [
  {
    icon: Wand2,
    title: 'AI-Powered Extraction',
    description: 'Describe your job and let AI create line items automatically',
  },
  {
    icon: Smartphone,
    title: 'Works Offline',
    description: 'Create and edit invoices even without internet connection',
  },
  {
    icon: FileText,
    title: 'Professional PDFs',
    description: 'Export beautiful invoices that make you look professional',
  },
  {
    icon: CheckCircle2,
    title: 'Simple & Fast',
    description: 'Built for contractors who need to invoice quickly in the field',
  },
];

export default function Index() {
  const { user, loading } = useAuth();

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
            <img src={logo} alt="HonestInvoice" className="h-10 w-10" />
            <span className="text-xl font-bold">HonestInvoice</span>
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

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Invoicing Made{' '}
            <span className="text-primary">Honest</span> &{' '}
            <span className="text-primary">Simple</span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            The invoicing app built for field contractors. Describe your job, 
            let AI extract the details, and send professional invoices in seconds.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="min-w-[200px]" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="min-w-[200px]" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Built for Contractors
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-lg border bg-card p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold">
            Ready to get paid faster?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Join thousands of contractors who trust HonestInvoice for their billing.
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
            <img src={logo} alt="HonestInvoice" className="h-6 w-6" />
            <span className="text-sm text-muted-foreground">
              © 2024 HonestInvoice. All rights reserved.
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Terms</Link>
            <a href="mailto:support@honestinvoice.app" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
