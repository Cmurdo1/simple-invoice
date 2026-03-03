-- Create a table for storing leads
CREATE TABLE public.leads (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT now() NOT NULL,
    poster_name text,
    contact_info text,
    job_description text NOT NULL,
    location text,
    post_url text,
    date_posted timestamptz,
    status text DEFAULT 'new' NOT NULL,
    estimate_id uuid REFERENCES public.invoices(id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public leads are viewable by everyone." ON public.leads FOR SELECT USING (true);
CREATE POLICY "Users can insert their own leads." ON public.leads FOR INSERT WITH CHECK (auth.uid() = NULL); -- Leads are inserted by the system, not directly by users
CREATE POLICY "Users can update their own leads." ON public.leads FOR UPDATE USING (auth.uid() = NULL); -- Leads are updated by the system, not directly by users
CREATE POLICY "Users can delete their own leads." ON public.leads FOR DELETE USING (auth.uid() = NULL); -- Leads are deleted by the system, not directly by users
