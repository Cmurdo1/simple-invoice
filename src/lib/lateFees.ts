// Shared late-fee calculation.
// Percentage per month, prorated by days overdue (30-day month).
export interface LateFeeResult {
  isOverdue: boolean;
  monthsOverdue: number; // fractional
  lateFeeAmount: number;
  principal: number;
  totalDue: number;
}

export function calculateLateFee(
  principal: number,
  dueDate: string | null | undefined,
  lateFeePercentPerMonth: number | null | undefined,
  now: Date = new Date()
): LateFeeResult {
  const pct = Number(lateFeePercentPerMonth ?? 0);
  const base = Number(principal) || 0;

  if (!dueDate || pct <= 0 || base <= 0) {
    return { isOverdue: false, monthsOverdue: 0, lateFeeAmount: 0, principal: base, totalDue: base };
  }

  const due = new Date(dueDate + 'T23:59:59');
  const msOver = now.getTime() - due.getTime();
  if (msOver <= 0) {
    return { isOverdue: false, monthsOverdue: 0, lateFeeAmount: 0, principal: base, totalDue: base };
  }

  const monthsOverdue = msOver / (1000 * 60 * 60 * 24 * 30);
  const lateFeeAmount = +(base * (pct / 100) * monthsOverdue).toFixed(2);
  return {
    isOverdue: true,
    monthsOverdue,
    lateFeeAmount,
    principal: base,
    totalDue: +(base + lateFeeAmount).toFixed(2),
  };
}
