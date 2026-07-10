import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import {
  FileText, Wand2, CreditCard, Download, CheckCircle2, ChevronRight, Paintbrush, Smartphone,
} from 'lucide-react';
import { useState } from 'react';

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "name": "Free Invoice Template — Download or Use Online | Honest Invoice",
      "description": "Download free professional invoice templates or use our AI-powered online invoice template. Works for freelancers, contractors, and small businesses. 100% free.",
      "url": "https://honestinvoice.com/invoice-templates",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is a free invoice template?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A free invoice template is a pre-formatted document you fill in with your client's details, line items, and payment terms. Honest Invoice provides a free, professional invoice template with your logo and brand color — ready to send as a PDF or email in one click.",
          },
        },
        {
          "@type": "Question",
          "name": "What is an invoice?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "An invoice is a formal document sent from a seller to a buyer requesting payment for goods or services. It includes the seller's name and contact info, client details, a list of items or services with prices, the total amount due, and a due date.",
          },
        },
        {
          "@type": "Question",
          "name": "What should an invoice template include?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A professional invoice template should include: your business name and logo, client name and contact details, a unique invoice number, invoice date and due date, an itemized list of services or products, subtotal, tax, and total amount, and payment instructions or a Pay Now link.",
          },
        },
        {
          "@type": "Question",
          "name": "Is Honest Invoice's invoice template really free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. The invoice template is 100% free — no credit card, no trial expiry. Sign up and start creating professional invoices immediately.",
          },
        },
      ],
    },
  ],
};

const templateFeatures = [
  { icon: Wand2, title: 'AI Line-Item Fill', desc: 'Describe the job in plain English and our AI fills in every line item — labor, parts, and pricing — in seconds.' },
  { icon: Paintbrush, title: 'Your Logo & Brand Color', desc: 'Upload your logo and pick a brand color. Every invoice template is automatically styled to match.' },
  { icon: CreditCard, title: 'Built-in Pay Now Button', desc: 'Pro users get a Stripe payment link on every invoice — clients pay by card directly from the template.' },
  { icon: Download, title: 'One-Tap PDF Export', desc: 'Export a polished, client-ready PDF invoice from your template with a single tap — no design skills needed.' },
  { icon: Smartphone, title: 'Works Offline', desc: 'Create and fill invoice templates on any device, even without internet. Syncs when you reconnect.' },
  { icon: FileText, title: 'Estimates & Invoices', desc: 'Use the same template for estimates and invoices. Convert an estimate to an invoice with one click.' },
];

const faqs = [
  { q: 'What is an invoice?', a: 'An invoice is a formal request for payment from a seller to a buyer. It lists the goods or services provided, the quantity, price per item, and the total amount owed. Invoices serve as both a payment request and an accounting record for both parties.' },
  { q: 'What is a free invoice template?', a: 'A free invoice template is a ready-made document structure you can fill in with your job details, client info, and pricing — without building a layout from scratch. Honest Invoice provides a free online invoice template that auto-populates line items with AI and exports to PDF instantly.' },
  { q: 'What should an invoice template include?', a: 'A professional invoice template should include: your business name, logo, and contact info; the client\'s name and contact details; a unique invoice number; invoice date and payment due date; an itemized list of services or products with descriptions, quantities, and unit prices; subtotal, tax amount, and total due; payment instructions or a secure Pay Now link.' },
  { q: 'How is an invoice template different from an invoice?', a: 'An invoice template is the blank framework you reuse for every client. An invoice is a completed, filled-in template sent to a specific client for a specific job. Honest Invoice stores your template settings (logo, tax rate, brand color) so each invoice you create is already formatted.' },
  { q: 'Is Honest Invoice\'s template really free?', a: 'Yes — 100% free with no credit card and no trial. Unlimited invoices, unlimited clients, unlimited PDF exports. Pro features (Stripe payments, email delivery) are available on the paid plan.' },
];

export default function InvoiceTemplates() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SEOHead
        canonicalUrl="/invoice-templates"
        title="Free Invoice Template — Honest Invoice"
        description="Free professional invoice templates for freelancers, contractors, and small businesses. AI-powered, PDF export, Stripe payments."
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link to="/" className="text-xl font-bold">Honest Invoice</Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Get Free Template</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section
          className="py-20 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(220 45% 12%) 50%, hsl(214 60% 25% / 0.3) 100%)' }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(214_60%_45%_/_0.1),_transparent_50%)]" aria-hidden="true" />
          <div className="container relative mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" /> 100% Free Invoice Template
              </div>
              <h1 className="mb-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Free Invoice <span className="text-primary">Template</span> —<br className="hidden sm:block" /> Professional, Fast & Online
              </h1>
              <p className="mb-8 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                Stop formatting invoices in Word or Excel. Use our free invoice template online — AI fills in your line items, you export as PDF or email to your client in seconds.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="min-w-[220px]" asChild>
                  <Link to="/signup">Use Free Template Now</Link>
                </Button>
                <Button size="lg" variant="outline" className="min-w-[220px]" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                {['No credit card', 'Unlimited invoices', 'PDF export', 'AI-powered'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What is an invoice — SEO content block */}
        <section className="border-t py-16" aria-labelledby="what-is-invoice-heading">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 id="what-is-invoice-heading" className="mb-4 text-2xl font-bold">What Is an Invoice?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              An <strong className="text-foreground">invoice</strong> is a formal document sent from a business or freelancer to a client, requesting payment for goods or services delivered. It acts as both a payment request and an official accounting record for both parties.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              A professional invoice typically includes the seller's name and contact info, the client's details, a unique <strong className="text-foreground">invoice number</strong>, the date and due date, an itemized list of services or products with individual prices, and the total amount due including any tax.
            </p>
            <h3 className="mb-3 text-xl font-bold">What Is a Free Invoice Template?</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              A <strong className="text-foreground">free invoice template</strong> is a pre-designed layout that handles all the formatting for you. Instead of building an invoice from scratch in Word, Excel, or Google Docs, you fill in your job details and the template automatically calculates totals, applies your branding, and generates a client-ready PDF.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Honest Invoice takes this one step further — our <strong className="text-foreground">AI invoice template</strong> fills in your line items automatically when you describe the job in plain English. A plumber, designer, consultant, or auto mechanic can generate a complete, itemized invoice template in under 30 seconds.
            </p>
          </div>
        </section>

        {/* Template features */}
        <section className="border-t bg-muted/30 py-16" aria-labelledby="template-features-heading">
          <div className="container mx-auto px-4">
            <h2 id="template-features-heading" className="mb-4 text-center text-3xl font-bold">
              What's Included in Our Free Invoice Template
            </h2>
            <p className="mb-12 text-center text-muted-foreground max-w-2xl mx-auto">
              Everything a professional invoice template needs — and tools that Word and Excel will never have.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {templateFeatures.map(({ icon: Icon, title, desc }) => (
                <article key={title} className="rounded-xl border bg-card p-6 flex gap-4 items-start hover:border-primary/40 transition-colors">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Invoice template checklist */}
        <section className="py-16" aria-labelledby="checklist-heading">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 id="checklist-heading" className="mb-4 text-2xl font-bold">What Should an Invoice Template Include?</h2>
            <p className="mb-6 text-muted-foreground">A complete, professional invoice template should have every one of these elements:</p>
            <ul className="space-y-3" role="list">
              {[
                'Your business name, logo, and contact information',
                'Client name, company (if applicable), and contact details',
                'A unique invoice number for tracking and accounting',
                'Invoice issue date and payment due date',
                'An itemized list of services or products with descriptions, quantities, and unit prices',
                'Subtotal, applicable tax rate, and total amount due',
                'Payment terms (e.g., "Net 30", "Due on receipt")',
                'Payment instructions — bank transfer, card link, or payment portal URL',
                'Notes or special instructions (optional)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              Honest Invoice's free invoice template includes all of the above automatically — and lets you add a Stripe payment link so clients can pay by card right from the invoice.
            </p>
          </div>
        </section>

        {/* FAQ accordion */}
        <section className="border-t bg-muted/30 py-16" aria-labelledby="templates-faq-heading">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 id="templates-faq-heading" className="mb-3 text-center text-3xl font-bold">
              Frequently Asked Questions
            </h2>
            <p className="mb-10 text-center text-muted-foreground">
              Everything you need to know about free invoice templates.
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
                      {faq.q}
                      <ChevronRight
                        className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${openFaq === i ? 'rotate-90' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                  </dt>
                  {openFaq === i && (
                    <dd className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t py-16 text-center">
          <div className="container mx-auto px-4 max-w-xl">
            <h2 className="mb-3 text-3xl font-bold">Get Your Free Invoice Template</h2>
            <p className="mb-6 text-muted-foreground">
              Sign up free. No credit card. No trial. Create your first professional invoice in under 2 minutes.
            </p>
            <Button size="lg" asChild>
              <Link to="/signup" className="gap-1.5 inline-flex items-center">
                Start Free Today <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
              <Link to="/pay" className="hover:text-foreground transition-colors">Pay Invoice</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
