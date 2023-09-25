import type { APIRoute } from 'astro';
import { authenticateSupabaseClientFromRequest, createSupabaseAdminClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/utils/rate-limit';
import { CacheControl } from '@/lib/server/cache';

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
    await limiter.check(request, 10, CacheControl.UPDATES);

    const supabase = await authenticateSupabaseClientFromRequest(cookies, request.headers);
    const {
      data: { user },
    } = (await supabase?.auth?.getUser()) ?? { data: { user: null } };

    if (!user) {
      return new Response('Authentication required', { status: 401 });
    }

    const { proxy, headless, hardLimit, budget, domain } = await request.json();

    // retrieve user profile
    const supabaseAdmin = createSupabaseAdminClient();

    if (typeof hardLimit !== 'undefined') {
      try {
        await supabaseAdmin
          .from('profiles')
          .update({ hard_limit: Math.max(hardLimit, 90000) })
          .eq('id', user.id);
      } catch (e) {
        console.error(e);
      }
    }

    if (typeof proxy !== 'undefined') {
      try {
        await supabaseAdmin.from('profiles').update({ proxy }).eq('id', user.id);
      } catch (e) {
        console.error(e);
      }
    }

    if (typeof headless !== 'undefined') {
      try {
        await supabaseAdmin.from('profiles').update({ headless }).eq('id', user.id);
      } catch (e) {
        console.error(e);
      }
    }

    if (typeof budget !== 'undefined' && typeof budget === 'object') {
      // delete the empty key incase
      delete budget[''];

      // determine if object needs to be deleted
      const _budget = Object.keys(budget ?? {}).length === 0 ? null : budget;

      if (domain) {
        try {
          await supabaseAdmin
            .from('websites')
            .update({ crawl_budget: _budget })
            .match({ user_id: user.id, domain });
        } catch (e) {
          console.error(e);
        }
      } else {
        try {
          await supabaseAdmin.from('profiles').update({ crawl_budget: _budget }).eq('id', user.id);
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
