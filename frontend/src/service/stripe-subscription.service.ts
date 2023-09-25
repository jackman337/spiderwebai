import { v4 as uuid } from 'uuid';
import { getStripeClient } from '../lib/stripe';

export class StripeSubscriptionService {
  constructor(private readonly stripe = getStripeClient()) {}

  createSubscription(customer: string) {
    return this.stripe.subscriptions.create({
      customer,
      items: [
        {
          price: import.meta.env.STRIPE_PRICE_ID,
        },
      ],
    });
  }

  // set the users default payment
  async setDefaultCard(customerid: string, cardId: string) {
    return await this.stripe.customers.update(customerid, {
      source: cardId,
    });
  }

  async createSubscriptionIfNotExists(customer: string) {
    const subscriptions = await this.getSubscriptions(customer);

    if (subscriptions?.length > 0) return subscriptions[0];

    return this.createSubscription(customer);
  }

  async getSubscriptions(customer: string) {
    const res = await this.stripe.subscriptions.list({ customer });
    return res.data;
  }

  async getSubscription(customer: string) {
    const subscriptions = await this.getSubscriptions(customer);
    const subscription = subscriptions.length ? subscriptions[0] : { id: undefined };

    return subscription;
  }

  async reportUsageForCustomer(customer: string, quantity: number) {
    const { id } = await this.getSubscription(customer);

    if (id) {
      return this.reportUsageForSubscription(id, quantity);
    }
  }

  async reportUsageForSubscription(subscription: string, quantity: number) {
    const subscriptionItems = await this.getSubscriptionItems(subscription);
    const subscriptionItem = subscriptionItems[0];
    if (!subscriptionItem)
      throw Error(`Cannot find subscription items for subscription=${subscriptionItems}`);

    const idempotencyKey = uuid();
    const timestamp = parseInt(String(Date.now() / 1000));

    // 500 credits per 1cent
    return this.stripe.subscriptionItems.createUsageRecord(
      subscriptionItem.id,
      { quantity: Math.ceil(quantity / 500), timestamp, action: 'increment' },
      { idempotencyKey }
    );
  }

  async getUsageRecordSummariesForCustomer(customer: string) {
    const { id: subscription } = await this.getSubscription(customer);

    if (subscription) {
      const { id } = await this.getSubscriptionItem(subscription);
      const res = await this.stripe.subscriptionItems.listUsageRecordSummaries(id);

      return res.data;
    }
  }

  async getUsageRecordSummariesForSubscription(subscription: string) {
    const { id } = await this.getSubscriptionItem(subscription);
    const res = await this.stripe.subscriptionItems.listUsageRecordSummaries(id);

    return res.data;
  }

  private async getSubscriptionItems(subscription: string) {
    const res = await this.stripe.subscriptionItems.list({ subscription });
    return res.data;
  }

  private async getSubscriptionItem(subscription: string) {
    const subscriptionItems = await this.getSubscriptionItems(subscription);
    const subscriptionItem = subscriptionItems[0];
    if (!subscriptionItem)
      throw Error(`Cannot find subscription items for subscription=${subscriptionItems}`);

    return subscriptionItem;
  }
}
