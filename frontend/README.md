# spider frontend application

The frontend to spider to delivery high performance data collecting with intelligence.

### Configure Auth

In your Supabase project, navigate to [auth > URL configuration](https://app.supabase.com/project/_/auth/url-configuration) and set your main production URL (e.g. https://yourspiderwebsite.com) as the site url.

#### [Maybe Optional] - Set up Supabase environment variables (not needed in dev defaults are set)

Navigate to the [API settings](https://app.supabase.com/project/_/settings/api) and paste them into the Vercel deployment interface. Copy project API keys and paste into the `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_URL_STORAGE`, and `SUPABASE_SERVICE_ROLE` fields.

## Configure Stripe

Make sure to fill environment variables `STRIPE_API_TOKEN` & `STRIPE_WEBHOOK_SIGNING_SECRET` in Astro env file `.env`

#### Create a webhook

We need to create a webhook in the `Developers` section of Stripe. Pictured in the architecture diagram above, this webhook is the piece that connects Stripe to your Vercel Serverless Functions.

1. Click the "Add Endpoint" button on the [test Endpoints page](https://dashboard.stripe.com/test/webhooks).
1. Enter your production deployment URL followed by `/api/stripe-webhook` for the endpoint URL. (e.g. `https://your-deployment-url.vercel.app/api/stripe-webhook`)
1. Click `Select events` under the `Select events to listen to` heading.
1. Click `Select all events` in the `Select events to send` section.
1. Copy `Signing secret` as we'll need that in the next step.
1. In addition to the `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and the `STRIPE_SECRET_KEY` we've set earlier during deployment, we need to add the webhook secret as `STRIPE_WEBHOOK_SIGNING_SECRET` env var.

Install Stripe CLI and the run the forwarder in one terminal

```sh
stripe listen --forward-to http://localhost:3000/api/stripe-webhook
```

The route correspond to an [Astro API endpoint](./src/pages/api/stripe-webhook.ts). So you need to start the frontend and that's it.

*note If you do not add Stripe you can manually add `approved_usage,billing_limit,billing_limit_soft` in the profiles table along with credits in the credits table to continue.*

#### Create product and pricing information

Your application's webhook listens for product updates on Stripe and automatically propagates them to your Supabase database. So with your webhook listener running, you can now create your product and pricing information in the [Stripe Dashboard](https://dashboard.stripe.com/test/products). Set the priceID to the env variable `STRIPE_PRICE_ID`.