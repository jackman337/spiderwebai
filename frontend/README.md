# frontend

The frontend to spiderwebai.xyz built with Astro

## Stripe setup

Install Stripe CLI and the run the forwarder in one terminal

```sh
stripe listen --forward-to http://localhost:3000/api/stripe-webhook
```

Make sure to fill environment variables `STRIPE_API_TOKEN` & `STRIPE_WEBHOOK_SIGNING_SECRET` in Astro env file `.env`

If you do not add Stripe you can manually add `approved_usage,billing_limit,billing_limit_soft` in the profiles table along with credits in the credits table to continue.

The route correspond to an [Astro API endpoint](./src/pages/api/stripe-webhook.ts). So you need to start the frontend and that's it.
