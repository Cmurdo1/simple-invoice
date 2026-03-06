
-- ============================================================
-- FIX CRITICAL RLS SECURITY GAPS
-- ============================================================

-- 1. CLIENTS TABLE
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- 2. PROFILES TABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. INVOICES TABLE
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- 4. INVOICE_ITEMS TABLE
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can insert their own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update their own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete their own invoice items" ON public.invoice_items;
CREATE POLICY "Users can view their own invoice items" ON public.invoice_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can insert their own invoice items" ON public.invoice_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can update their own invoice items" ON public.invoice_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can delete their own invoice items" ON public.invoice_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

-- 5. LEADS TABLE — authenticated users only
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;
CREATE POLICY "Authenticated users can view leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update leads" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete leads" ON public.leads FOR DELETE TO authenticated USING (true);

-- 6. INVOICE_FEEDBACK TABLE
ALTER TABLE public.invoice_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can submit feedback with valid token" ON public.invoice_feedback;
DROP POLICY IF EXISTS "Invoice owners can view their feedback" ON public.invoice_feedback;
CREATE POLICY "Public can submit feedback with valid token" ON public.invoice_feedback FOR INSERT WITH CHECK (public.validate_feedback_token(invoice_id, (SELECT feedback_token FROM public.invoices WHERE id = invoice_id)));
CREATE POLICY "Invoice owners can view their feedback" ON public.invoice_feedback FOR SELECT USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_feedback.invoice_id AND invoices.user_id = auth.uid()));

-- 7. USAGE_TRACKING TABLE
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can update their own usage" ON public.usage_tracking;
CREATE POLICY "Users can view their own usage" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own usage" ON public.usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own usage" ON public.usage_tracking FOR UPDATE USING (auth.uid() = user_id);
