import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useReferral() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      const referralCode = profile?.referral_code ?? null;
      const referralLink = referralCode
        ? `${window.location.origin}/signup?ref=${referralCode}`
        : null;

      const total = referrals?.length ?? 0;
      const rewarded = referrals?.filter((r) => r.status === 'rewarded').length ?? 0;

      return { referralCode, referralLink, total, rewarded };
    },
    enabled: !!user,
  });
}
