import { CookieKeys } from '@/lib/storage';
import { createSupabaseAdminClient, supabase } from '@/lib/supabase';
import { getUsageRecordSummaries } from '@/lib/utils/get-stripe-usage';
import type { APIRoute } from 'astro';

export const config = {
  runtime: 'edge',
};

export const get: APIRoute = async ({ request, cookies }) => {
  const auth = request.headers.get('authorization') ?? cookies?.get(CookieKeys.ACCESS_TOKEN)?.value;

  // make sure authorization or md5 is allowed TODO: md5
  if (!auth) {
    return new Response('Authentication required', { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser(auth);

  if (!user) {
    return new Response('Authentication required', { status: 401 });
  }

  let usageData = null;

  try {
    usageData = await getUsageRecordSummaries(createSupabaseAdminClient(), user.id);
  } catch (e) {
    console.error(e);
  }

  return new Response(usageData ? JSON.stringify(usageData) : '');
};
