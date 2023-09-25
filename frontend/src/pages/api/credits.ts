import type { APIRoute } from 'astro';
import type { Stripe } from 'stripe';
import { authenticateSupabaseClientFromRequest } from '../../lib/supabase';
import { getStripeClient } from '../../lib/stripe';
import { CookieKeys } from '@/lib/storage';
import { StripeSubscriptionService } from '@/service/stripe-subscription.service';

export const config = {
  runtime: 'edge',
};

const CLIENT_URL = import.meta.env.SITE.endsWith('/')
  ? import.meta.env.SITE
  : `${import.meta.env.SITE}/`;

/**
 * add credits by amount
 */
export const post: APIRoute = async ({ request, redirect, cookies }) => {
  const supabase = await authenticateSupabaseClientFromRequest(cookies);

  const {
    data: { user },
  } = (await supabase?.auth?.getUser()) ?? { data: { user: null } };

  if (!user) {
    return new Response(
      cookies.has(CookieKeys.ACCESS_TOKEN)
        ? 'Authentication required, if issues persist please sign out and re-login.'
        : 'Authentication required.',
      { status: 401 }
    );
  }

  const formData = await request.formData();

  const credits = Number(formData.get('credits'));

  // retrieve user profile
  const response = await supabase
    ?.from('profiles')
    .select('stripe_id')
    .eq('id', user.id)
    .maybeSingle();

  let stripe_id = response?.data?.stripe_id;

  // create customer in stripe
  const stripe = getStripeClient();

  let onlyCredits = false;

  // if stipe customer doesnt exist create a new one
  if (stripe_id) {
    try {
      const stripeSubscriptionService = new StripeSubscriptionService(stripe);
      const { id } = await stripeSubscriptionService.getSubscription(stripe_id);
      // subscription exist only allow credits
      if (id) {
        onlyCredits = true;
      }
    } catch (e) {
      console.error(e);
    }
  }

  const lineItems = [
    {
      price: import.meta.env.STRIPE_PRICE_ID,
    },
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${credits} spider credits`,
        },
        unit_amount: Math.trunc(credits / 100), // CREDITS to dollars todo: make util conversion
      },
      quantity: 1,
    },
  ];

  if (onlyCredits) {
    lineItems.shift();
  }

  // check for subscription conditionally to display extra price.
  const checkoutParams: Stripe.Checkout.SessionCreateParams = {
    line_items: lineItems,
    customer: stripe_id ?? undefined,
    mode: onlyCredits ? 'payment' : 'subscription',
    success_url: `${CLIENT_URL}credits/success`,
    cancel_url: `${CLIENT_URL}credits/cancel`,
    allow_promotion_codes: true,
    payment_method_collection: onlyCredits ? undefined : 'always',
    customer_email: user?.email, // use email for first time customer
  };

  if (!stripe_id) {
    delete checkoutParams.customer;
  } else {
    delete checkoutParams.customer_email;
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);

    // first purchase remove banners
    if (!cookies.has(CookieKeys.FIRST_PURCHASE)) {
      cookies.set(CookieKeys.FIRST_PURCHASE, '1', {
        sameSite: 'strict',
        secure: import.meta.env.PROD,
        httpOnly: false,
        path: '/',
        domain: import.meta.env.SITE,
      });
    }

    if (checkoutSession.url) {
      return redirect(checkoutSession.url);
    }
  } catch (e) {
    // console.error(e);
  }

  throw 'Payment Error.';
};
