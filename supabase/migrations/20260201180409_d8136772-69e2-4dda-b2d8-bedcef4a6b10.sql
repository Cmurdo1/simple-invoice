-- Create invoice feedback table for client ratings and comments
CREATE TABLE public.invoice_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  client_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique feedback token for each invoice
ALTER TABLE public.invoices ADD COLUMN feedback_token UUID DEFAULT gen_random_uuid();

-- Enable RLS
ALTER TABLE public.invoice_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (public feedback submission)
CREATE POLICY "Anyone can submit feedback with valid token"
ON public.invoice_feedback
FOR INSERT
WITH CHECK (true);

-- Allow invoice owners to view their feedback
CREATE POLICY "Users can view feedback on their invoices"
ON public.invoice_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_feedback.invoice_id
    AND invoices.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_invoice_feedback_invoice_id ON public.invoice_feedback(invoice_id);