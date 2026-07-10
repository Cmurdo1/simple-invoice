
-- Late fee default on profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_late_fee_percent NUMERIC(6,3) NOT NULL DEFAULT 1.5;

-- Per-invoice late fee, deposit split, and reminder tracking
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS late_fee_percent NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS parent_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_deposit BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_percent NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS marked_overdue_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_invoices_parent ON public.invoices(parent_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_overdue ON public.invoices(status, due_date)
  WHERE status IN ('sent','overdue');

-- Function to auto-flip sent invoices to overdue when past due
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.invoices
  SET status = 'overdue',
      marked_overdue_at = COALESCE(marked_overdue_at, now()),
      updated_at = now()
  WHERE status = 'sent'
    AND due_date IS NOT NULL
    AND due_date < CURRENT_DATE;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
