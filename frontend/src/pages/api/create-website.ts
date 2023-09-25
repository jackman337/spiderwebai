import type { APIRoute } from 'astro';
import { authenticateSupabaseClientFromRequest } from '../../lib/supabase';
import { validateCredits } from '@/lib/utils/check-credits';
import { crawlLambda } from '@/lib/utils/crawl-request';
import { sendCrawlSQS } from '@/lib/utils/sqs-queue';
import { rateLimit } from '@/lib/utils/rate-limit';
import { CacheControl } from '@/lib/server/cache';
import { promptGenerateWebsite } from '@/lib/chat/prompt-website';

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export const config = {
  runtime: 'edge',
};

/**
 * Create a website
 */
export const post: APIRoute = async ({ request, cookies }) => {
  try {
    await limiter.check(request, 10, CacheControl.CRAWL);

    const supabase = await authenticateSupabaseClientFromRequest(cookies, request.headers);
    const {
      data: { user },
    } = (await supabase?.auth?.getUser()) ?? { data: { user: null } };

    if (!user) {
      return new Response('Authentication required', { status: 401 });
    }

    const { url, domain, proxy, headless, budget, query } = await request.json();

    if (!url) {
      return new Response('URL not provided', { status: 400 });
    }

    // check credits
    const creditsData = await validateCredits(supabase, user?.id);

    if (creditsData instanceof Response) {
      return creditsData;
    }

    let websiteUrl = url;
    let websiteDomain = domain;

    // perform AI request to get url or urls for crawl
    if (query) {
      return await promptGenerateWebsite({ message: url, supabase, user });
    }

    // VALIDATE if website is valid or throw
    try {
      new URL(websiteUrl);
    } catch (e) {
      return new Response('Could not get a valid domain.', {
        status: 400,
      });
    }

    let response = await supabase
      ?.from('websites')
      ?.upsert({
        url: websiteUrl,
        domain: websiteDomain,
        user_id: user.id, // only use auth id for updates
      })
      ?.select()
      ?.single();

    let status = response?.status || 200;

    // fallback to select - item already exist in different protocol
    if (status === 409) {
      try {
        response = await supabase
          ?.from('websites')
          ?.select('*')
          ?.eq('domain', domain)
          ?.eq('user_id', user.id)
          ?.single();
        status = response?.status || 200;
      } catch (e) {
        console.error(e);
      }
    }

    const webhooks = await supabase
      ?.from('webhooks')
      ?.select(
        'destination,domain,on_credits_depleted,on_credits_half_depleted,on_website_status,on_find,on_find_metadata'
      )
      ?.or(`domain.eq.${websiteDomain},domain.is.null`)
      ?.limit(1)
      ?.maybeSingle();

    const webhookData = webhooks?.data ? webhooks.data : undefined;

    // TODO: get headless config from profile
    const hasCreditObject = typeof creditsData === 'object';
    const crawlParams = {
      supabase,
      url: websiteUrl,
      user_id: user.id,
      proxy_enabled: proxy,
      webhook: webhookData,
      headless: headless,
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

    return new Response(JSON.stringify(response), { status });
  } catch {
    return new Response('Rate limit exceeded', {
      status: 429,
    });
  }
};
