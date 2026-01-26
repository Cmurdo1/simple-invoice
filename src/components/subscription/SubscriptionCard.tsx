import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionButton } from './SubscriptionButton';
import { Check, Crown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const proFeatures = [
  'AI-powered line item extraction',
  'Unlimited invoices',
  'PDF export & download',
  'Offline mode with sync',
  'Priority support',
];

const freeFeatures = [
  'Up to 5 invoices/month',
  'Basic invoice creation',
  'Client management',
];

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

    const isPro = subscription.subscribed;

    return (
      <Card ref={ref} className={isPro ? 'border-primary' : ''} {...props}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>
                {isPro ? 'HonestInvoice Pro' : 'Free Plan'}
              </CardTitle>
              {isPro && (
                <Badge variant="default" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Active
                </Badge>
              )}
            </div>
            {isPro && (
              <Badge variant="outline">
                $19/month
              </Badge>
            )}
          </div>
          <CardDescription>
            {isPro 
              ? 'You have access to all premium features' 
              : 'Upgrade to unlock all features'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPro && subscription.subscriptionEnd && (
            <p className="text-sm text-muted-foreground">
              Renews on {format(new Date(subscription.subscriptionEnd), 'MMMM d, yyyy')}
            </p>
          )}
          
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isPro ? 'Your features:' : 'Free plan includes:'}
            </p>
            <ul className="space-y-1">
              {(isPro ? proFeatures : freeFeatures).map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {!isPro && (
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Pro includes:</p>
              <ul className="space-y-1 mb-4">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-muted-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <SubscriptionButton 
            variant={isPro ? 'outline' : 'default'} 
            className="w-full" 
          />
        </CardContent>
      </Card>
    );
  }
);

SubscriptionCard.displayName = 'SubscriptionCard';
