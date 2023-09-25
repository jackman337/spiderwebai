// perform a crawl to the lambda endpoint
export type Webhook = {
  destination: string;
  on_credits_depleted: boolean;
  on_credits_half_depleted: boolean;
  on_website_status: boolean;
  on_find: boolean;
  on_find_metadata: boolean;
};
