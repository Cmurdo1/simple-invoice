
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site settings"
  ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Service role can manage site settings"
  ON public.site_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.site_settings (key, value)
VALUES ('ai_model', 'nvidia/llama-3.3-70b-instruct')
ON CONFLICT (key) DO NOTHING;
