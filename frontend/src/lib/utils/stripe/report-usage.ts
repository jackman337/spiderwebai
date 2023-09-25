import { StripeSubscriptionService } from '@/service/stripe-subscription.service';
import { SupabaseUserProfileService } from '@/service/supabase-user-profile.service';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// send usage directly to stripe
export const reportUsageToStripe = async ({
  supabaseAdmin,
  user,
  usage,
}: {
  usage: number;
  user: Pick<User, 'id' | 'email'>;
  supabaseAdmin?: SupabaseClient;
}) => {
  let customer;

  try {
    customer = await new SupabaseUserProfileService(supabaseAdmin).getCustomerIdByUserId(user.id);
  } catch (error) {
    return new Response(`Can't fetch profile for ${user?.email}: ${error}`, { status: 400 });
  }

  const stripeSubscriptionService = new StripeSubscriptionService();

  try {
    await stripeSubscriptionService.reportUsageForCustomer(customer, usage);
  } catch (error) {
    console.error(error);
    return new Response(`Can't report usage: ${error}`, { status: 500 });
  }
};
