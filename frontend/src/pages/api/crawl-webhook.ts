import type { APIRoute } from 'astro';
import { createSupabaseAdminClient, supabase } from '@/lib/supabase';
import { CookieKeys } from '@/lib/storage';
import { reportUsageToStripe } from '@/lib/utils/stripe/report-usage';
import { resser } from '@/lib/server/responses';

export const config = {
  runtime: 'edge',
};

/**
 * Call this method at the end of a crawl to report usage
 *
 */
export const post: APIRoute = async ({ request, cookies }) => {
  const auth = request.headers.get('authorization') ?? cookies?.get(CookieKeys.ACCESS_TOKEN)?.value;

  // make sure authorization or md5 is allowed TODO: md5 to prevent excess calls
  if (!auth) {
    return resser.auth;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser(auth);

  if (!user) {
    return resser.auth;
  }

  const { usage }: { usage: number } = await request.json();

  const supabaseAdmin = createSupabaseAdminClient();

  await reportUsageToStripe({
    supabaseAdmin,
    user,
    usage,
  });

  return resser.ok;
};
