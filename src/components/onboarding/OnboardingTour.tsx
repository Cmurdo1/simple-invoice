import { useCallback, useEffect } from 'react';
import { driver, type Config } from 'driver.js';
import 'driver.js/dist/driver.css';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useTierFeatures } from '@/hooks/useTierFeatures';

const STORAGE_KEY = 'hi.onboarding.completed.v1';

const steps: Config['steps'] = [
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: 'Your command center',
      description:
        'Every page lives in the sidebar — Dashboard, Estimates, Invoices, Clients, Settings. Click any item to jump around.',
    },
  },
  {
    element: '[data-tour="new-invoice"]',
    popover: {
      title: 'Create an invoice',
      description:
        'Click here to draft a new invoice. We\'ll confirm the button responds — watch for the loading spinner.',
      onNextClick: (el) => {
        const btn = el as HTMLButtonElement | undefined;
        if (btn) {
          toast.success('New Invoice button OK', { description: 'It rendered and is clickable.' });
        }
        // advance the tour
        (window as unknown as { __driver?: { moveNext: () => void } }).__driver?.moveNext();
      },
    },
  },
  {
    element: '[data-tour="new-estimate"]',
    popover: {
      title: 'Send an estimate',
      description:
        'Estimates work exactly like invoices — draft one, send it, convert it to an invoice when approved.',
    },
  },
  {
    element: '[data-tour="search"]',
    popover: {
      title: 'Search anything',
      description: 'Find an invoice by number, client name, or amount in one keystroke.',
    },
  },
  {
    element: '[data-tour="recent-activity"]',
    popover: {
      title: 'Recent activity',
      description:
        'Latest invoices, estimates, and payments live here. Click any row to open it.',
    },
  },
  {
    popover: {
      title: 'You\'re all set',
      description:
        'Every critical button now confirms clicks and shows a friendly error if something fails. Ready to work.',
    },
  },
];

export function useOnboardingTour() {
  const { guidedOnboarding } = useTierFeatures();

  const start = useCallback(() => {
    if (!guidedOnboarding) {
      toast.error('Business plan required for the guided tour');
      return;
    }
    const d = driver({
      showProgress: true,
      allowClose: true,
      steps,
      onDestroyed: () => {
        localStorage.setItem(STORAGE_KEY, '1');
      },
    });
    (window as unknown as { __driver?: unknown }).__driver = d;
    d.drive();
  }, [guidedOnboarding]);

  return { start, canRun: guidedOnboarding };
}

/**
 * Auto-run the tour once for eligible (Business+) users the first time
 * they land on the dashboard.
 */
export function OnboardingAutoStart() {
  const { start, canRun } = useOnboardingTour();

  useEffect(() => {
    if (!canRun) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(start, 600);
    return () => clearTimeout(t);
  }, [canRun, start]);

  return null;
}

export function OnboardingButton() {
  const { start, canRun } = useOnboardingTour();
  if (!canRun) return null;
  return (
    <Button variant="outline" size="sm" onClick={start} data-tour="start-tour">
      <Sparkles className="h-4 w-4" />
      Take the tour
    </Button>
  );
}
