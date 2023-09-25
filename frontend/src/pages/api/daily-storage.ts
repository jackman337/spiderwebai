import { createSupabaseAdminClient } from '@/lib/supabase';
import { reportUsageToStripe } from '@/lib/utils/stripe/report-usage';
import type { APIRoute } from 'astro';

export const config = {
  runtime: 'edge',
};

/**
 * API to manage the amount of storage a user is taking.
 * The storage is calculated daily.
 */
export const post: APIRoute = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const sharedKey = searchParams.get(import.meta.env.CRON_KEY);

  if (sharedKey !== import.meta.env.CRON_SECURITY) {
    // silent fail treat as 404
    return new Response('Not Found', { status: 404 });
  }

  const supabase = createSupabaseAdminClient();

  // get all users from the cron table and check if credits exist to run crawls TODO: paginate
  const { data } = await supabase.from('profiles').select('stripe_id,id,email');

  if (data && data.length) {
    for (const user of data) {
      const { data } = await supabase.rpc('get_folder_size_mb', {
        folder_name: user.id,
      });

      // size in mbs of the folder
      // ignore reporting if under 10mb, amount to small - add logic to check over multiple days to accumlate larger number
      if (data && data > 10) {
        // bump 2 gb runs twice a month
        const mbToGB = Math.max((data / 1000) * 3, 1);

        await reportUsageToStripe({
          supabaseAdmin: supabase,
          user,
          usage: mbToGB,
        });
      }
      // TODO: get size of collections usage for user and bake in cost. In general the storage price for now is handling both cases.
      // It would be not so ideal to get the collection records size and instead use a generic alg for the collections weights
    }
  }

  return new Response('Successfully ran all scheduled', { status: 200 });
};
