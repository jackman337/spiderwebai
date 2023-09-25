import type { APIRoute } from 'astro';
import type { Stripe } from 'stripe';
import { getStripeClient } from '../../lib/stripe';
import { createSupabaseAdminClient } from '../../lib/supabase';
// import { StripeSubscriptionService } from '../../service/stripe-subscription.service';
import { SupabaseCreditsService } from '../../service/supabase-credits.service';
import { SupabaseUserProfileService } from '../../service/supabase-user-profile.service';

/**
 * Stripe webhooks handler
 */
export const post: APIRoute = async ({ request }) => {
  const signature = request.headers.get('Stripe-Signature');
  const body = await request.text();
  const stripe = getStripeClient();

  const receivedEvent = await stripe.webhooks.constructEventAsync(
    body,
    signature!,
    import.meta.env.STRIPE_WEBHOOK_SIGNING_SECRET,
    undefined
  );

  switch (receivedEvent.type) {
    case 'charge.succeeded':
      try {
        return await handleChargeSucceeded(receivedEvent, body);
      } catch (error) {
        console.error(error);
        return new Response(JSON.stringify(error), { status: 500 });
      }
    default:
      return new Response('ok');
  }
};

/**
 * 1. Increment credits
 * 2. start a subscription
 */
async function handleChargeSucceeded(
  event: Stripe.Event,
  body: string,
): Promise<Response> {
  const customer = (event.data.object as any).customer;
  const supabase = createSupabaseAdminClient();
  const parsedBody = JSON.parse(body);
  const creditsAmount = parsedBody.data.object.amount;

  if (!creditsAmount) return new Response('No credits were paid.', { status: 200 });

  const profileService = new SupabaseUserProfileService(supabase);

  let userId;

  try {
    userId = await profileService.getUserIdByEmail(
      (event.data.object as any).billing_details?.email
    );
  } catch (e) {
    userId = await profileService.getUserIdFromCustomerId(customer);
  }

  const { data } = await supabase
    ?.from('profiles')
    .select('approved_usage,stripe_id')
    .eq('id', userId)
    .maybeSingle();

  const approvedUsage = data?.approved_usage || 0;
  const creditLimit = creditsAmount / 100;
  const nextApprovedLimit = Math.max(creditLimit, 60) * 2;
  const billingLimit = Math.trunc(Math.ceil(Math.max(creditLimit, 25) * 2));

  const updateUserProps = {
    approved_usage: Math.trunc(Math.ceil(nextApprovedLimit)),
    billing_limit: billingLimit,
    billing_limit_soft: Math.trunc(billingLimit / 1.2),
    stripe_id: customer,
  };

  // first time create user profile data
  if (!data?.stripe_id) {
    await supabase?.from('profiles').update(updateUserProps).eq('id', userId).maybeSingle();
  } else if (approvedUsage < nextApprovedLimit) {
    await supabase
      ?.from('profiles')
      .update(updateUserProps) // default hard limit allowed for account
      .eq('id', userId)
      .maybeSingle();
  }

  await new SupabaseCreditsService(supabase).addCreditsToUser(creditsAmount, userId);

  return new Response('ok');
}
