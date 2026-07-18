import * as React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTierFeatures } from '@/hooks/useTierFeatures';
import { requiredTier, TIER_LABEL, TierFeature } from '@/lib/tierFeatures';

interface ActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Stable name used for click tracking and error toasts. */
  action: string;
  /** Async or sync handler. Errors trigger a toast; button stays disabled while pending. */
  onAction?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  /** Optional feature gate — hides or disables the button if the user's tier lacks it. */
  requiresFeature?: TierFeature;
  /** When gated: 'hide' removes the button, 'disable' shows it with a lock. Default 'disable'. */
  gateMode?: 'hide' | 'disable';
  /** Custom label to render alongside/instead of children while loading. */
  loadingText?: string;
  /** Suppress the automatic error toast (still logs to console). */
  silent?: boolean;
}

/**
 * ActionButton — every critical button in the app should use this.
 *
 * Guarantees:
 *  - The button is disabled while the handler is pending (prevents duplicate saves/exports).
 *  - Errors surface as a user-friendly toast including the action name.
 *  - Every click is logged (feature-gated to Pro+); Business+ users get role-aware gating.
 */
export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      action,
      onAction,
      requiresFeature,
      gateMode = 'disable',
      loadingText,
      silent,
      disabled,
      children,
      className,
      ...rest
    },
    ref,
  ) => {
    const { has, roleAwareUI, clickTracking, userId, tier } = useTierFeatures();
    const [pending, setPending] = React.useState(false);

    const gated = requiresFeature ? !has(requiresFeature) : false;
    // Role-aware UI only actually hides/disables when the current tier unlocks it.
    // Below Business, gating is treated as a soft hint (button still works) so the
    // feature stays a Business-tier upgrade path rather than degrading UX for free users.
    const enforceGate = gated && roleAwareUI;

    if (enforceGate && gateMode === 'hide') return null;

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (pending) return;

      if (clickTracking) {
        // eslint-disable-next-line no-console
        console.info('[click]', {
          action,
          userId,
          tier,
          at: new Date().toISOString(),
        });
      }

      if (enforceGate) {
        toast.error(
          `${TIER_LABEL[requiredTier(requiresFeature!)]} plan required for "${action}"`,
        );
        return;
      }

      if (!onAction) return;

      try {
        setPending(true);
        await onAction(e);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[action-error]', { action, err });
        if (!silent) {
          const msg = err instanceof Error ? err.message : 'Something went wrong';
          toast.error(`${action} failed`, { description: msg });
        }
        throw err;
      } finally {
        setPending(false);
      }
    };

    return (
      <Button
        ref={ref}
        data-action={action}
        disabled={disabled || pending || (enforceGate && gateMode === 'disable')}
        onClick={handleClick}
        className={cn(className)}
        {...rest}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {loadingText ?? children}
          </>
        ) : enforceGate ? (
          <>
            <Lock className="h-4 w-4" aria-hidden />
            {children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  },
);

ActionButton.displayName = 'ActionButton';
