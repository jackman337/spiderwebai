import type { Website } from '@/stores/my';
import type { SupabaseClient } from '@supabase/supabase-js';

// get webhook data
export const getWebhooks = async ({
  supabase,
  website,
  user_id,
}: {
  supabase: SupabaseClient;
  user_id?: string;
  website?: Partial<Website>;
}) => {
  let defaultData = supabase.from('webhooks').select('*').eq('user_id', user_id);

  if (website) {
    defaultData = defaultData.eq('domain', website.domain);
  } else {
    defaultData = defaultData.is('domain', null);
  }
  try {
    const { data } = await defaultData.limit(1).maybeSingle();

    return {
      destination: data?.destination || '',
      events: Object.entries(data ?? {})
        .filter((k) => {
          return k[0].startsWith('on_') && k[1];
        })
        .map((k) => k[0]),
    };
  } catch (_) {
    return {
      destination: '',
      events: [],
    };
  }
};
