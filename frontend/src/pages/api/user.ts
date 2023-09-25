import type { APIRoute } from 'astro';
import {
  authenticateSupabaseClientFromRequest,
  createSupabaseAdminClient,
} from '../../lib/supabase';
import { rateLimit } from '@/lib/utils/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export const config = {
  runtime: 'edge',
};

/**
 * update user profile values
 */
export const post: APIRoute = async ({ request, cookies }) => {
  try {
    await limiter.check(request, 10, 'CACHE_TOKEN');

    const supabase = await authenticateSupabaseClientFromRequest(cookies, request.headers);
    const {
      data: { user },
    } = (await supabase?.auth?.getUser()) ?? { data: { user: null } };

    if (!user) {
      return new Response('Authentication required', { status: 401 });
    }

    const formData = await request.formData();
    const billing_limit = formData.get('billing_limit');

    if (billing_limit && typeof billing_limit !== 'undefined') {
      const supabaseAdmin = createSupabaseAdminClient();

      // TOD: use util that can remove all currency from inputs
      const parseLimit = Number(
        typeof billing_limit === 'string' && billing_limit.startsWith('$')
          ? billing_limit.replaceAll('$', '')
          : billing_limit
      );

      if (!isNaN(parseLimit)) {
        // TODO: validate hard limit over approved limit and submit request.
        try {
          await supabaseAdmin
            .from('profiles')
            .update({ billing_limit: parseLimit })
            .eq('id', user.id);
        } catch (e) {
          console.error(e);
        }
      }
    }

    return new Response(null, { status: 201 });
  } catch {
    return new Response('Rate limit exceeded', {
      status: 429,
    });
  }
};
