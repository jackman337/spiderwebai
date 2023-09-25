import type { Website } from '@/stores/my';
import type { SupabaseClient } from '@supabase/supabase-js';

// get crons data
export const getCrons = async ({
  supabase,
  website,
  user_id,
}: {
  supabase: SupabaseClient;
  user_id?: string;
  website?: Partial<Website>;
}) => {
  let defaultData = supabase.from('crons').select('*').eq('user_id', user_id);

  if (website) {
    defaultData = defaultData.eq('domain', website.domain);
  } else {
    defaultData = defaultData.is('domain', null);
  }

  try {
    const { data } = await defaultData.limit(1).maybeSingle();

    return {
      events: data?.cron_frequency ? [data.cron_frequency] : [],
    };
  } catch (_) {
    return {
      events: [],
    };
  }
};
