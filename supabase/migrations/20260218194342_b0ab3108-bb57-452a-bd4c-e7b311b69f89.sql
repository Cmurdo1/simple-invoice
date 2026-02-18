
-- Usage tracking table for monthly limits
CREATE TABLE public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month_year text NOT NULL, -- format: 'YYYY-MM'
  invoice_count integer NOT NULL DEFAULT 0,
  estimate_count integer NOT NULL DEFAULT 0,
  comparison_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment usage and check limits
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id uuid,
  p_usage_type text -- 'invoice', 'estimate', or 'comparison'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month text;
  v_current_count integer;
  v_limit integer;
  v_subscription_status text;
  v_result jsonb;
BEGIN
  v_month := to_char(now(), 'YYYY-MM');
  
  -- Get user subscription status
  SELECT subscription_status INTO v_subscription_status
  FROM public.profiles WHERE id = p_user_id;
  
  -- Determine limit based on tier and type
  IF v_subscription_status = 'business' THEN
    v_limit := 999999; -- effectively unlimited
  ELSIF v_subscription_status = 'pro' THEN
    IF p_usage_type IN ('invoice', 'estimate') THEN
      v_limit := 50;
    ELSE
      v_limit := 50;
    END IF;
  ELSE -- free
    IF p_usage_type IN ('invoice', 'estimate') THEN
      v_limit := 5;
    ELSE
      v_limit := 10;
    END IF;
  END IF;
  
  -- Upsert usage record
  INSERT INTO public.usage_tracking (user_id, month_year)
  VALUES (p_user_id, v_month)
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  -- Get current count
  IF p_usage_type = 'invoice' THEN
    SELECT invoice_count INTO v_current_count FROM public.usage_tracking
    WHERE user_id = p_user_id AND month_year = v_month;
  ELSIF p_usage_type = 'estimate' THEN
    SELECT estimate_count INTO v_current_count FROM public.usage_tracking
    WHERE user_id = p_user_id AND month_year = v_month;
  ELSE
    SELECT comparison_count INTO v_current_count FROM public.usage_tracking
    WHERE user_id = p_user_id AND month_year = v_month;
  END IF;
  
  -- Check limit
  IF v_current_count >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'current', v_current_count, 'limit', v_limit);
  END IF;
  
  -- Increment
  IF p_usage_type = 'invoice' THEN
    UPDATE public.usage_tracking SET invoice_count = invoice_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND month_year = v_month;
  ELSIF p_usage_type = 'estimate' THEN
    UPDATE public.usage_tracking SET estimate_count = estimate_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND month_year = v_month;
  ELSE
    UPDATE public.usage_tracking SET comparison_count = comparison_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND month_year = v_month;
  END IF;
  
  RETURN jsonb_build_object('allowed', true, 'current', v_current_count + 1, 'limit', v_limit);
END;
$$;
