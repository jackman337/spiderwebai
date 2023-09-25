import { getStripeClient } from '@/lib/stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

export const createStripeCustomer = async ({
  supabaseAdmin,
  user,
  stripe,
}: {
  supabaseAdmin: SupabaseClient;
  user: { id: string; email: string };
  stripe?: Stripe;
}) => {
  // create customer in stripe
  const stripeClient = stripe ?? getStripeClient();
  let stripeCustomer = null;

  try {
    stripeCustomer = await stripeClient.customers.create(
      { email: user.email, metadata: { id: user.id } },
      { idempotencyKey: user.id }
    );
  } catch (e) {
    console.error(e);
  }

  if (stripeCustomer) {
    // update profile
    await supabaseAdmin.from('profiles').update({ stripe_id: stripeCustomer.id }).eq('id', user.id);
  }

  return stripeCustomer;
};
