
-- Add referral fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Generate a short unique referral code for existing profiles
UPDATE public.profiles
SET referral_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  rewarded_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Function to generate referral code on new profile creation
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.referral_code := new_code;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_referral_code_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION public.generate_referral_code();

-- Function to process a referral reward: gives referrer 30 days of Pro
CREATE OR REPLACE FUNCTION public.process_referral_reward(p_referred_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_referral RECORD;
  v_current_end TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_user_id = p_referred_user_id AND status = 'pending';

  IF NOT FOUND THEN RETURN; END IF;

  SELECT subscription_end INTO v_current_end
  FROM public.profiles WHERE id = v_referral.referrer_id;

  UPDATE public.profiles
  SET
    subscription_status = 'pro',
    subscription_end = GREATEST(COALESCE(v_current_end, now()), now()) + INTERVAL '30 days',
    updated_at = now()
  WHERE id = v_referral.referrer_id;

  UPDATE public.referrals
  SET status = 'rewarded', rewarded_at = now()
  WHERE id = v_referral.id;
END;
$$;
