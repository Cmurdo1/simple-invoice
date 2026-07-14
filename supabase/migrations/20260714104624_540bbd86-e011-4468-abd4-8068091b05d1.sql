
-- 1. LEADS: drop permissive policies, restrict to owner admin
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;

CREATE POLICY "Owner can view leads" ON public.leads
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'murdochcpm_08@yahoo.com');
CREATE POLICY "Owner can insert leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') = 'murdochcpm_08@yahoo.com');
CREATE POLICY "Owner can update leads" ON public.leads
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'murdochcpm_08@yahoo.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'murdochcpm_08@yahoo.com');
CREATE POLICY "Owner can delete leads" ON public.leads
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'murdochcpm_08@yahoo.com');

-- 2. USAGE_TRACKING: remove user insert/update (only SECURITY DEFINER function writes)
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can update their own usage" ON public.usage_tracking;

-- 3. INVOICE_FEEDBACK: remove the flawed token-bypass policy; submissions go via submit-feedback edge function (service_role)
DROP POLICY IF EXISTS "Public can submit feedback with valid token" ON public.invoice_feedback;

-- 4. REALTIME: drop broadcasted tables
ALTER PUBLICATION supabase_realtime DROP TABLE public.leads;
ALTER PUBLICATION supabase_realtime DROP TABLE public.ai_actions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.ai_org_runs;

-- 5. STORAGE: business-assets — remove listing, add path-scoped policies
DROP POLICY IF EXISTS "Business assets are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own logos" ON storage.objects;

CREATE POLICY "Users can upload logos to their own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] = 'logos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can update their own logo files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] = 'logos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] = 'logos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own logo files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] = 'logos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- 6. SECURITY DEFINER functions: revoke public EXECUTE, grant only where needed
REVOKE EXECUTE ON FUNCTION public.process_referral_reward(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_usage(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_overdue_invoices() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_feedback_token(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.process_referral_reward(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_usage(uuid, text) TO authenticated;
