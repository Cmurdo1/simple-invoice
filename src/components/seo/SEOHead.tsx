import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  structuredData?: object;
}

const BASE_URL = 'https://honestinvoice.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/lovable-uploads/a10c7696-c395-4a0f-87cc-fde00d83b6c0.png`;

// Primary keyword clusters — weighted by trending keywords (↑ invoice template +7%, ↑ what is a invoice +10%, ↑ invoice free +7%, ↑ pay invoice +4%)
const DEFAULT_KEYWORDS = [
  // Trending ↑ high priority
  'invoice template', 'free invoice template', 'template invoice',
  'free invoice', 'invoice free', 'pay invoice', 'what is a invoice',
  'invoice number',
  // Core
  'free invoice generator', 'invoice generator', 'free invoicing software',
  'free billing software', 'free invoice maker', 'invoice maker',
  // Long-tail
  'free estimate generator', 'free estimate template', 'free online invoicing',
  'contractor invoice', 'freelancer invoice', 'small business invoice',
  // Feature-specific
  'invoice with payment link', 'invoice with stripe', 'send invoice by email',
  'PDF invoice generator', 'AI invoice generator', 'offline invoice app',
  // Trust signals
  'completely free invoicing', 'no credit card invoice',
  'free billing app', 'free contractor estimate', 'invoice payment tracking',
].join(', ');

export function SEOHead({
  title = 'Free Invoice Template — Create, Send & Pay Invoices | Honest Invoice',
  description = 'Honest Invoice is the #1 free invoice template & generator. Create professional invoice templates in seconds, send with a Pay Invoice button, and collect payments via Stripe. Free for freelancers & small businesses. No credit card needed.',
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
  structuredData,
}: SEOHeadProps) {
  const fullTitle = title.includes('Honest Invoice') ? title : `${title} | Honest Invoice`;
  const fullCanonicalUrl = canonicalUrl ? `${BASE_URL}${canonicalUrl}` : BASE_URL;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Honest Invoice" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@honestinvoice" />

      {/* Additional SEO */}
      <meta name="author" content="Honest Invoice" />
      <meta name="publisher" content="Honest Invoice" />
      <meta name="application-name" content="Honest Invoice" />
      <meta name="rating" content="general" />
      <meta name="revisit-after" content="7 days" />
      <meta name="language" content="English" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />

      {/* Mobile */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="apple-mobile-web-app-title" content="Honest Invoice" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.png" type="image/png" />
      <link rel="apple-touch-icon" href="/favicon.png" />

      {/* Preconnect for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://honestinvoice.com" />

      {/* Inline structured data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
