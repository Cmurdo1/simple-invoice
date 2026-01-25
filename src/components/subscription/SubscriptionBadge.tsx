import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export function SubscriptionBadge() {
  const { subscription } = useAuth();

  if (!subscription.subscribed) {
    return null;
  }

  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <Crown className="h-3 w-3" />
      Pro
    </Badge>
  );
}
