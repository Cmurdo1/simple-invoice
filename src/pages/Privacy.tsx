import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import logoLight from '@/assets/honest-invoice-logo.png';
import logoDark from '@/assets/honest-invoice-logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';

export default function Privacy() {
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
          <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: {lastUpdated}</p>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to HonestInvoice ("we," "our," or "us"). This Privacy Policy explains how HonestInvoice, 
              operated by HonestInvoice ("Developer"), collects, uses, discloses, and safeguards your information 
              when you use our mobile application and web application (collectively, the "App").
            </p>
            <p className="text-muted-foreground mb-4">
              We are committed to protecting your privacy and ensuring transparency about our data practices. 
              Please read this Privacy Policy carefully. By using HonestInvoice, you agree to the collection 
              and use of information in accordance with this policy.
            </p>
            <p className="text-muted-foreground">
              <strong>Contact Information:</strong> For any privacy-related questions or concerns, please contact us at:{' '}
              <a href="mailto:support@honestinvoice.com" className="text-primary hover:underline">
                support@honestinvoice.com
              </a>
            </p>
          </section>

          {/* Data We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3">2.1 Personal Information You Provide</h3>
            <p className="text-muted-foreground mb-3">
              When you use HonestInvoice, we collect information you directly provide to us, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li><strong>Account Information:</strong> Your name, email address, and password when you create an account.</li>
              <li><strong>Business Profile:</strong> Business name, phone number, mailing address, and logo that you add to your profile for inclusion on invoices.</li>
              <li><strong>Client Information:</strong> Names, email addresses, phone numbers, and mailing addresses of your clients that you enter to create invoices.</li>
              <li><strong>Invoice Data:</strong> Invoice details including line item descriptions, quantities, unit prices, totals, tax amounts, due dates, notes, and job descriptions.</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.2 Financial Information</h3>
            <p className="text-muted-foreground mb-4">
              We collect and process the following financial-related data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li><strong>Invoice Amounts:</strong> Total amounts, tax rates, and payment status of invoices you create.</li>
              <li><strong>Subscription Information:</strong> Your subscription status and billing history. Note: Payment card details are processed directly by our payment processor (Stripe) and are never stored on our servers.</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.3 Automatically Collected Information</h3>
            <p className="text-muted-foreground mb-3">
              When you use our App, we automatically collect certain information, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers, and mobile network information.</li>
              <li><strong>Usage Data:</strong> Features you use, actions you take, time and duration of your activities.</li>
              <li><strong>Log Data:</strong> IP address, browser type, pages visited, and crash reports.</li>
              <li><strong>Local Storage:</strong> We use local storage technologies to enable offline functionality, storing invoice data locally on your device until it can be synced with our servers.</li>
            </ul>
          </section>

          {/* How We Use Data */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-3">
              We use the information we collect for specific, legitimate purposes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Core App Functionality:</strong> To enable you to create, manage, send, and track invoices; to generate PDF exports; and to manage your client database.</li>
              <li><strong>Account Management:</strong> To create and manage your account, authenticate your identity, and provide customer support.</li>
              <li><strong>AI-Powered Features:</strong> To process job descriptions and automatically extract line items using artificial intelligence, improving your invoicing efficiency.</li>
              <li><strong>Offline Functionality:</strong> To store data locally on your device so you can use the App without an internet connection.</li>
              <li><strong>Subscription Management:</strong> To process subscription payments, manage your billing, and provide access to premium features.</li>
              <li><strong>Communications:</strong> To send you invoice notifications, account updates, and important service announcements.</li>
              <li><strong>Analytics & Improvement:</strong> To understand how users interact with our App, identify issues, and improve our services.</li>
              <li><strong>Security:</strong> To detect, prevent, and respond to fraud, abuse, security risks, and technical issues.</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We share your information only in the following circumstances and with the following third-party service providers:
            </p>

            <h3 className="text-xl font-medium mb-3">4.1 Service Providers</h3>
            <div className="space-y-4 mb-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Supabase (Cloud Infrastructure)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Data Shared:</strong> All user data, including account information, business profiles, client data, and invoices.
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Purpose:</strong> Database hosting, user authentication, file storage, and backend infrastructure.
                </p>
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  Supabase Privacy Policy →
                </a>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Stripe (Payment Processing)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Data Shared:</strong> Email address, subscription status, and payment information.
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Purpose:</strong> To process subscription payments and manage billing. Your payment card details are handled directly by Stripe and never touch our servers.
                </p>
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  Stripe Privacy Policy →
                </a>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">AI Service Providers (Line Item Extraction)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Data Shared:</strong> Job descriptions you enter for AI-powered line item extraction.
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Purpose:</strong> To automatically extract invoice line items from your job descriptions using artificial intelligence.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-medium mb-3">4.2 Other Disclosures</h3>
            <p className="text-muted-foreground mb-2">We may also share your information:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>With Your Consent:</strong> When you direct us to share your data (e.g., sending an invoice to a client via email).</li>
              <li><strong>Legal Compliance:</strong> When required by law, legal process, or government request.</li>
              <li><strong>Protection of Rights:</strong> To protect the rights, property, or safety of HonestInvoice, our users, or others.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with notice to affected users.</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground mb-3">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using SSL/TLS protocols.</li>
              <li><strong>Encryption at Rest:</strong> Data stored in our database is encrypted at rest.</li>
              <li><strong>Row-Level Security:</strong> Our database implements row-level security policies ensuring users can only access their own data.</li>
              <li><strong>Secure Authentication:</strong> We use secure authentication mechanisms to protect your account.</li>
              <li><strong>Regular Security Audits:</strong> We regularly review and update our security practices.</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              While we strive to protect your information, no method of transmission over the internet or electronic 
              storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground mb-3">
              We retain your personal information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Provide our services and maintain your account</li>
              <li>Comply with legal obligations (e.g., tax and accounting requirements may require us to retain invoice data for up to 7 years)</li>
              <li>Resolve disputes and enforce our agreements</li>
            </ul>
            <p className="text-muted-foreground">
              When you delete your account, we will delete or anonymize your personal information within 30 days, 
              except where we are required to retain it for legal purposes.
            </p>
          </section>

          {/* User Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            <p className="text-muted-foreground mb-3">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> You can access your personal information at any time through the Settings page in the App.</li>
              <li><strong>Correction:</strong> You can update or correct your account information, business profile, and client data directly within the App.</li>
              <li><strong>Deletion:</strong> You can request deletion of your account and associated data by contacting us at{' '}
                <a href="mailto:support@honestinvoice.com" className="text-primary hover:underline">support@honestinvoice.com</a>. 
                We will process your request within 30 days.</li>
              <li><strong>Data Export:</strong> You can export your invoices as PDF files at any time through the App.</li>
              <li><strong>Opt-Out:</strong> You can opt out of non-essential communications by adjusting your notification preferences.</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="text-muted-foreground">
              HonestInvoice is designed for business professionals and is not directed at children under the age of 13. 
              We do not knowingly collect personal information from children under 13. If we become aware that we have 
              inadvertently collected personal information from a child under 13, we will take steps to delete such 
              information promptly. If you believe we have collected information from a child under 13, please contact 
              us immediately at{' '}
              <a href="mailto:support@honestinvoice.com" className="text-primary hover:underline">support@honestinvoice.com</a>.
            </p>
          </section>

          {/* International Users */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other than your own. Our servers and 
              service providers may be located in the United States or other jurisdictions. By using HonestInvoice, 
              you consent to the transfer of your information to these locations. We ensure that any international 
              transfers comply with applicable data protection laws and that appropriate safeguards are in place.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by 
              posting the new Privacy Policy on this page and updating the "Last Updated" date. For significant 
              changes, we will provide additional notice (such as an in-app notification or email). Your continued 
              use of HonestInvoice after such modifications constitutes your acknowledgment and acceptance of the 
              updated Privacy Policy.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="font-medium mb-2">HonestInvoice</p>
              <p className="text-sm text-muted-foreground">Email:{' '}
                <a href="mailto:support@honestinvoice.com" className="text-primary hover:underline">support@honestinvoice.com</a>
              </p>
              <p className="text-sm text-muted-foreground">Website:{' '}
                <a href="https://honestinvoice.com" className="text-primary hover:underline">honestinvoice.com</a>
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
