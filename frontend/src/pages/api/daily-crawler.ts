import { createSupabaseAdminClient } from '@/lib/supabase';
import type { APIRoute } from 'astro';
import { isSameDay, isSameMonth, isSameWeek } from 'date-fns';
import { sendCrawlSQS } from '@/lib/utils/sqs-queue';
import { validateCredits } from '@/lib/utils/check-credits';

export const config = {
  runtime: 'edge',
};

/**
 * API route to start crawls for websites that set the date frequency. This will be short lived for the cron limits on vercel.
 * this should be able to handle millions of records within the current limit, we may need to split up the processing between batch periods.
 */
export const post: APIRoute = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const sharedKey = searchParams.get(import.meta.env.CRON_KEY);

  if (sharedKey !== import.meta.env.CRON_SECURITY) {
    // silent fail treat as 404
    return new Response('Not Found', { status: 404 });
  }

  const cu = new Date();
  const supabase = createSupabaseAdminClient();
  // get all users from the cron table and check if credits exist to run crawls TODO: paginate
  const { data } = await supabase
    .from('crons')
    .select('last_ran_at,cron_freq,user_id,domain,updated_at');

  if (data && data.length) {
    for (const schedule of data) {
      const cronDate = schedule.last_ran_at || schedule.updated_at;

      const sameDayCron = schedule.cron_freq === 'daily' && !isSameDay(cronDate, cu);
      const sameWeekCron = schedule.cron_freq === 'weekly' && !isSameWeek(cronDate, cu);
      const sameMonthCron = schedule.cron_freq === 'monthly' && !isSameMonth(cronDate, cu);

      // check cron frequency and last fired date and compare time
      // if match exist check for credits before sending to lambda
      if (sameDayCron || sameWeekCron || sameMonthCron) {
        // cron can fire update the last date and check for credits before sending queue
        const { error } = await supabase
          .from('crons')
          .update({ last_ran_at: cu })
          .match({ user_id: schedule.user_id, domain: schedule.domain });

        if (error) {
          console.error(error);
        } else if (await validateCredits(supabase, schedule.user_id, true)) {
          // 10 credits cannot crawl so set as min
          // TODO: get webhook data
          // TODO: paging get websites
          const { data: websiteData } = await supabase
            .from('websites')
            .select('url,proxy,domain')
            .match({ user_id: schedule.user_id, domain: schedule.domain })
            .limit(100);

          // if the website data exist
          if (websiteData) {
            // top level account webhooks.
            const webhook = await supabase
              .from('webhooks')
              .select(
                'destination,domain,on_credits_depleted,on_credits_half_depleted,on_website_status,on_find,on_find_metadata'
              )
              .or(`domain.eq.${schedule.domain},domain.is.null`)
              .limit(1)
              .maybeSingle();
            for (const website of websiteData) {
              // set the cron trigger
              await sendCrawlSQS({
                supabase,
                url: website.url,
                user_id: schedule.user_id,
                proxy: website.url,
                webhook: webhook?.data ? webhook.data : undefined,
              });
            }
          }
        }
      }
    }
  }

  return new Response('Successfully ran all scheduled', { status: 200 });
};
