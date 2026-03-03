
-- Create leads table for the automated Craigslist scraper pipeline
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_name text,
  contact_info text,
  job_description text,
  location text,
  post_url text,
  date_posted timestamp with time zone,
  estimate_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'craigslist',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for the edge function)
CREATE POLICY "Service role full access to leads"
ON public.leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Enable realtime on leads table
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
