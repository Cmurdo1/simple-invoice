// Tier-scoped feature flags. Keep this file the single source of truth so
// UI, hooks, and analytics all read from the same map.

export type Tier = 'free' | 'pro' | 'business';

export type TierFeature =
  | 'safeButtons'        // global loading/disabled + friendly error toasts
  | 'clickTracking'      // log every critical action click (console + errors)
  | 'roleAwareUI'        // hide/disable buttons the user can't use
  | 'guidedOnboarding';  // driver.js walkthrough

const TIER_RANK: Record<Tier, number> = { free: 0, pro: 1, business: 2 };

// Minimum tier that unlocks each feature.
const REQUIRED_TIER: Record<TierFeature, Tier> = {
  safeButtons: 'free',       // everyone
  clickTracking: 'pro',
  roleAwareUI: 'business',
  guidedOnboarding: 'business',
};

export function normalizeTier(status?: string | null): Tier {
  if (status === 'business') return 'business';
  if (status === 'pro') return 'pro';
  return 'free';
}

export function tierHas(current: Tier, feature: TierFeature): boolean {
  return TIER_RANK[current] >= TIER_RANK[REQUIRED_TIER[feature]];
}

export function requiredTier(feature: TierFeature): Tier {
  return REQUIRED_TIER[feature];
}

export const TIER_LABEL: Record<Tier, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
};
