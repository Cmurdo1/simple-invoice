-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can submit feedback with valid token" ON public.invoice_feedback;

-- Create a function to validate feedback token
CREATE OR REPLACE FUNCTION public.validate_feedback_token(p_invoice_id UUID, p_token UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invoices
    WHERE id = p_invoice_id
    AND feedback_token = p_token
  )
$$;

-- Create policy that validates feedback token using RPC (will be checked via edge function)
-- For now, we'll handle validation in the edge function and use service role