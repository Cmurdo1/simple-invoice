// Subscription tier configuration
export const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    productId: null,
    limits: {
      invoices: 5,
      estimates: 5,
      comparisons: 10,
    },
    features: [
      'Up to 5 invoices/month',
      'Up to 5 estimates/month',
      '10 estimate comparisons/month',
      'Basic invoice creation',
      'Client management',
    ],
  },
  pro: {
    name: 'Pro',
    price: 19.99,
    priceId: 'price_1SPg7rAtFazn277otlRY0Yau',
    productId: 'prod_TMOvlarGM4i4yz',
    limits: {
      invoices: 50,
      estimates: 50,
      comparisons: 50,
    },
    features: [
      'Up to 50 invoices/month',
      'Up to 50 estimates/month',
      '50 estimate comparisons/month',
      'AI line item extraction',
      'PDF export & download',
      'Offline mode with sync',
      'Priority support',
    ],
  },
  business: {
    name: 'Business',
    price: 49,
    priceId: 'price_1T2HRCAtFazn277owIyfTLmL',
    productId: 'prod_U0I1nhBRS2qjHY',
    limits: {
      invoices: Infinity,
      estimates: Infinity,
      comparisons: Infinity,
    },
    features: [
      'Unlimited invoices & estimates',
      'Unlimited estimate comparisons',
      'AI line item extraction',
      'PDF export & download',
      'Offline mode with sync',
      'Team/multi-user support',
      'Priority support',
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof TIERS;
