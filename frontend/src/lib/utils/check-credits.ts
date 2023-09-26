import { StripeSubscriptionService } from '@/service/stripe-subscription.service';
import type { SupabaseClient } from '@supabase/supabase-js';

// determine if user can proceed with app features
export const validateCredits = async (
  supabase?: SupabaseClient,
  id?: string,
  returnBool?: boolean
) => {
  const creditsData = await supabase
    ?.from('credits')
    ?.select('credits')
    ?.eq('user_id', id)
    ?.single();

  // TODO: get all credits from records instead of single and combo the credit usage
  const creditsValue = creditsData?.data?.credits;
  let blockRequest = !(creditsValue && creditsValue > 0);
  let has_sub = false;
  let hardLimit = 0;
  let approvedLimit = 0;
  let totalUsage = 0;
  let responseMessage = '';

  // check if user has valid subscription if credits are not found TODO: pass both checks to the crawler to continue
  const { data } = (await supabase
    ?.from('profiles')
    ?.select('stripe_id,billing_limit,approved_usage,crawl_budget')
    ?.eq('id', id)
    ?.single()) ?? { data: undefined };

  // check for subscription each crawl
  if (data?.stripe_id) {
    const stripeService = await new StripeSubscriptionService();
    const usageRecords = await stripeService.getUsageRecordSummariesForCustomer(data.stripe_id);

    // check if sub to unblock request
    if (blockRequest) {
      blockRequest = !usageRecords?.length;
    }

    hardLimit = data.billing_limit;
    approvedLimit = data.approved_usage;
    has_sub = !!usageRecords?.length;

    if (usageRecords && usageRecords.length) {
      for (const sub of usageRecords) {
        if (sub.total_usage) {
          totalUsage += sub.total_usage / 100;
        }
      }
    }

    if (totalUsage >= approvedLimit) {
      responseMessage = 'Usage exceeds approved limit.';
      blockRequest = true;
    }

    if (totalUsage >= hardLimit) {
      responseMessage = 'Usage exceeds hard limit.';
      blockRequest = true;
    }
  }

  // no credits exist
  if (blockRequest) {
    // return bool directly to prevent api from closing
    if (returnBool) {
      return false;
    }

    return new Response(responseMessage || 'You need to add credits first.', {
      status: 400,
    });
  }

  return {
    creditsValue,
    // limits
    hardLimit,
    approvedLimit,
    // crawl limit
    crawlLimit: Math.ceil(hardLimit - (totalUsage || 0)), // the actual crawl usage left in dollars with floats
    has_sub, // user has subscription
    crawl_budget: data?.crawl_budget,
  };
};
