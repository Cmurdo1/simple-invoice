-- Add type column to invoices table to distinguish between invoices and estimates
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS type text DEFAULT 'invoice' CHECK (type IN ('invoice', 'estimate'));
