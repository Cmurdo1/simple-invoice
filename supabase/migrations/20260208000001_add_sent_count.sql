-- Add sent_count column to invoices table to track number of times a document has been emailed
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS sent_count integer DEFAULT 0;
