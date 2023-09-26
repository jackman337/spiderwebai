import type { APIRoute } from 'astro';
import { authenticateSupabaseClientFromRequest } from '@/lib/supabase';
import { validateCredits } from '@/lib/utils/check-credits';
import { crawlLambda } from '@/lib/utils/crawl-request';
import { sendCrawlSQS } from '@/lib/utils/sqs-queue';
import { resser } from '@/lib/server/responses';

export const config = {
  runtime: 'edge',
};

/**
 * Start a crawl job
 */
export const post: APIRoute = async ({ request, cookies }) => {
  const supabase = await authenticateSupabaseClientFromRequest(cookies, request.headers);
  const {
    data: { user },
  } = (await supabase?.auth?.getUser()) ?? { data: { user: null } };

  if (!user) {
    return resser.rate;
  }

  const { url, proxy, domain, headless, budget } = await request.json();

  if (!url) {
    return resser.urlRequired;
  }

  // check if credits exist or if they pass in their own API key later
  const creditsData = await validateCredits(supabase, user?.id);

  if (creditsData instanceof Response) {
    return creditsData;
  }

  const webhooks = await supabase
    ?.from('webhooks')
    ?.select(
      'destination,domain,on_credits_depleted,on_credits_half_depleted,on_website_status,on_find,on_find_metadata'
    )
    ?.or(`domain.eq.${domain},domain.is.null`)
    ?.limit(1)
    ?.maybeSingle();

  const webhookData = webhooks?.data ? webhooks.data : undefined;
  const hasCreditObject = typeof creditsData === 'object';

  const crawlParams = {
    supabase,
    url,
    user_id: user.id,
    proxy_enabled: proxy,
    webhook: webhookData,
    headless,
    hard_limit: hasCreditObject ? Math.trunc(creditsData.crawlLimit * 10000 * 2) : undefined,
    has_sub: (hasCreditObject && creditsData.has_sub) || undefined,
    budget: budget ?? hasCreditObject ? (creditsData as any)?.crawl_budget : undefined,
  };

  if (import.meta.env.AWS_SQS_ENABLED) {
    await sendCrawlSQS(crawlParams);
  } else {
    // this will only work in dev due to authorizer
    crawlLambda(crawlParams);
  }

  const updateDate = new Date();
  const matchParams = { domain, url, user_id: user.id };

  try {
    // TODO: move to side effect at db level
    await supabase
      ?.from('websites')
      ?.update({
        updated_at: updateDate,
      })
      ?.match(matchParams)
      ?.maybeSingle();
  } catch (e) {
    console.error(e);
  }

  return new Response(
    JSON.stringify({
      ...matchParams,
      updated_at: updateDate,
    })
  );
};
