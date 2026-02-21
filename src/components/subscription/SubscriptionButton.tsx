import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles, ExternalLink } from 'lucide-react';

interface SubscriptionButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const SubscriptionButton = React.forwardRef<HTMLButtonElement, SubscriptionButtonProps>(
  ({ variant = 'default', size = 'default', className }, ref) => {
    const { session, subscription } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
      if (!session?.access_token) {
        toast.error('Please sign in to upgrade');
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          throw error;
        }

        if (data?.url) {
          window.open(data.url, '_blank');
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (error) {
        console.error('Error creating checkout:', error);
        toast.error('Failed to start checkout. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    const handleManageSubscription = async () => {
      if (!session?.access_token) {
        toast.error('Please sign in to manage subscription');
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke('customer-portal', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          throw error;
        }

        if (data?.url) {
          window.open(data.url, '_blank');
        } else {
          throw new Error('No portal URL received');
        }
      } catch (error) {
        console.error('Error opening customer portal:', error);
        toast.error('Failed to open subscription management. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (subscription.subscribed) {
      return (
        <Button
          ref={ref}
          variant={variant}
          size={size}
          onClick={handleManageSubscription}
          disabled={isLoading}
          className={className}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2" />
          )}
          Manage Subscription
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        onClick={handleUpgrade}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        Upgrade to Pro
      </Button>
    );
  }
);

SubscriptionButton.displayName = 'SubscriptionButton';
