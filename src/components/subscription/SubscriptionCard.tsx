import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionButton } from './SubscriptionButton';
import { Check, Crown, Loader2, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { TIERS } from '@/lib/subscriptionTiers';

export const SubscriptionCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { subscription } = useAuth();

    if (subscription.isLoading) {
      return (
        <Card ref={ref} {...props}>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      );
    }

    const currentTier = subscription.subscriptionStatus;
    const isPaid = subscription.subscribed;
    const tierConfig = TIERS[currentTier] || TIERS.free;

    return (
      <Card ref={ref} className={isPaid ? 'border-primary' : ''} {...props}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>
                HonestInvoice {tierConfig.name}
              </CardTitle>
              {isPaid && (
                <Badge variant="default" className="gap-1">
                  {currentTier === 'business' ? <Building2 className="h-3 w-3" /> : <Crown className="h-3 w-3" />}
                  Active
                </Badge>
              )}
            </div>
            {isPaid && (
              <Badge variant="outline">
                ${tierConfig.price}/month
              </Badge>
            )}
          </div>
          <CardDescription>
            {isPaid 
              ? `You have access to all ${tierConfig.name} features` 
              : 'Upgrade to unlock more features'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPaid && subscription.subscriptionEnd && (
            <p className="text-sm text-muted-foreground">
              Renews on {format(new Date(subscription.subscriptionEnd), 'MMMM d, yyyy')}
            </p>
          )}
          
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Your features:
            </p>
            <ul className="space-y-1">
              {tierConfig.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {currentTier === 'free' && (
            <div className="space-y-3 pt-2">
              <SubscriptionButton targetTier="pro" variant="default" className="w-full" />
              <SubscriptionButton targetTier="business" variant="outline" className="w-full" />
            </div>
          )}

          {currentTier === 'pro' && (
            <div className="space-y-3 pt-2">
              <SubscriptionButton variant="outline" className="w-full" />
              <SubscriptionButton targetTier="business" variant="default" className="w-full" />
            </div>
          )}

          {currentTier === 'business' && (
            <SubscriptionButton variant="outline" className="w-full" />
          )}
        </CardContent>
      </Card>
    );
  }
);

SubscriptionCard.displayName = 'SubscriptionCard';
