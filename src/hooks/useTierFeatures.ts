import { useAuth } from '@/contexts/AuthContext';
import { normalizeTier, tierHas, TierFeature, Tier } from '@/lib/tierFeatures';

export function useTierFeatures() {
  const { subscription, user } = useAuth();
  const tier: Tier = normalizeTier(subscription.subscriptionStatus);

  const has = (feature: TierFeature) => tierHas(tier, feature);

  return {
    tier,
    userId: user?.id ?? null,
    has,
    safeButtons: has('safeButtons'),
    clickTracking: has('clickTracking'),
    roleAwareUI: has('roleAwareUI'),
    guidedOnboarding: has('guidedOnboarding'),
  };
}
