import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import logoLight from '@/assets/honest-invoice-logo.png';
import logoDark from '@/assets/honest-invoice-logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';

export default function Terms() {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? logoDark : logoLight;
  const lastUpdated = 'February 1, 2026';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="HonestInvoice" className="h-10 w-10" />
            <span className="text-xl font-bold">HonestInvoice</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last Updated: {lastUpdated}</p>

          {/* Agreement */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using HonestInvoice ("App"), you agree to be bound by these Terms of Service ("Terms"). 
              If you disagree with any part of these terms, you do not have permission to access the App. 
              These Terms apply to all visitors, users, and others who access or use the App.
            </p>
          </section>

          {/* Description */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              HonestInvoice is an invoicing application designed for contractors and small business owners. 
              The App allows users to create, manage, and send professional invoices. Features include 
              AI-powered line item extraction, offline functionality, PDF export, and client management.
            </p>
          </section>

          {/* Accounts */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-3">
              When you create an account with us, you must provide accurate, complete, and current information. 
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Safeguarding the password that you use to access the App</li>
              <li>Any activities or actions under your account</li>
              <li>Notifying us immediately of any unauthorized access or use of your account</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              You may not use as a username the name of another person or entity or that is not lawfully available 
              for use, or a name or trademark that is subject to any rights of another person or entity without 
              appropriate authorization.
            </p>
          </section>

          {/* Subscriptions */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscriptions and Payments</h2>
            <p className="text-muted-foreground mb-3">
              Some features of HonestInvoice require a paid subscription ("Pro Plan"). By subscribing:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You authorize us to charge your payment method on a recurring basis</li>
              <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
              <li>Refunds are provided at our discretion and in accordance with applicable law</li>
              <li>Price changes will be communicated in advance</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="text-muted-foreground mb-3">
              You agree not to use HonestInvoice to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Create fraudulent invoices or engage in deceptive billing practices</li>
              <li>Transmit viruses, malware, or other malicious code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the integrity or performance of the App</li>
              <li>Collect or harvest any information from other users</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="text-muted-foreground mb-3">
              The App and its original content, features, and functionality are owned by HonestInvoice and are 
              protected by international copyright, trademark, patent, trade secret, and other intellectual 
              property laws.
            </p>
            <p className="text-muted-foreground">
              You retain ownership of any content you create using the App (such as invoices and client data). 
              By using the App, you grant us a limited license to store, process, and display your content 
              solely for the purpose of providing the service.
            </p>
          </section>

          {/* Your Data */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Data</h2>
            <p className="text-muted-foreground">
              You are solely responsible for the accuracy and legality of the data you enter into HonestInvoice, 
              including invoice details, client information, and business data. You represent that you have the 
              right to enter and use any personal information of third parties (such as client email addresses) 
              that you provide to the App.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              THE APP IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, 
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, 
              FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE APP WILL 
              BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE. WE DO NOT PROVIDE TAX, LEGAL, OR ACCOUNTING 
              ADVICE. YOU SHOULD CONSULT YOUR OWN PROFESSIONAL ADVISORS.
            </p>
          </section>

          {/* Limitation */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, HONESTINVOICE SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF 
              PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE 
              OF OR INABILITY TO ACCESS OR USE THE APP.
            </p>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account and access to the App immediately, without prior notice 
              or liability, for any reason, including if you breach these Terms. Upon termination, your right 
              to use the App will immediately cease. You may also terminate your account at any time by 
              contacting us.
            </p>
          </section>

          {/* Changes */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify or replace these Terms at any time. We will provide notice of any 
              material changes by posting the new Terms on this page and updating the "Last Updated" date. 
              Your continued use of the App after any such changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
              in which HonestInvoice operates, without regard to its conflict of law provisions.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="font-medium mb-2">HonestInvoice</p>
              <p className="text-sm text-muted-foreground">Email:{' '}
                <a href="mailto:support@honestinvoice.com" className="text-primary hover:underline">support@honestinvoice.com</a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src={logo} alt="HonestInvoice" className="h-6 w-6" />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} HonestInvoice. All rights reserved.
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <a href="mailto:support@honestinvoice.com" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
