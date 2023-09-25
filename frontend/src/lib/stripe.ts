import Stripe from 'stripe';

export function getStripeClient() {
  return new Stripe(String(import.meta.env.STRIPE_API_TOKEN), {
    apiVersion: '2023-08-16',
  });
}
