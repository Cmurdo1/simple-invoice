import { ReactNode } from 'react';
import { useTierFeatures } from '@/hooks/useTierFeatures';
import { TierFeature } from '@/lib/tierFeatures';

interface TierGateProps {
  feature: TierFeature;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Hide children entirely unless the current user's tier includes `feature`.
 * Only enforced when the tier itself unlocks role-aware UI (Business+),
 * so lower tiers see the same UI they've always seen.
 */
export function TierGate({ feature, children, fallback = null }: TierGateProps) {
  const { has, roleAwareUI } = useTierFeatures();
  if (roleAwareUI && !has(feature)) return <>{fallback}</>;
  return <>{children}</>;
}
