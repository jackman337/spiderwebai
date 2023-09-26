import { StripeSubscriptionService } from '@/service/stripe-subscription.service';
import { SupabaseUserProfileService } from '@/service/supabase-user-profile.service';
import type { SupabaseClient } from '@supabase/supabase-js';

// return the stripe records for customer
export async function getUsageRecordSummaries(supabase: SupabaseClient, user_id?: string) {
  const userProfileService = new SupabaseUserProfileService(supabase);
  let customerId = "";

  try {
    customerId = await userProfileService.getCustomerId(user_id);
  } catch (e) {
    console.error(e);
  }

  if (customerId) {
    try {
      return new StripeSubscriptionService().getUsageRecordSummariesForCustomer(customerId);
    } catch (error) {
      console.error(error);
    }
  }
}
