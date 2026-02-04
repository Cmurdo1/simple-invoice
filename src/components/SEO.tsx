import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
  name?: string;
}

export const SEO = ({ 
  title = "Honest Invoice: Free Online Invoicing & Billing Software for Freelancers", 
  description = "Stop chasing payments. Use Honest Invoice to automate billing, track expenses, and get paid 2x faster. 100% secure.",
  canonical = "https://honestinvoice.com",
  type = "website",
  name = "Honest Invoice"
}: SEOProps) => {
  const fullTitle = title.includes("Honest Invoice") ? title : `${title} | Honest Invoice`;
  
  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      
      {/* Facebook tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={name} />
      
      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      
      {/* End standard metadata tags */}
    </Helmet>
  );
};
