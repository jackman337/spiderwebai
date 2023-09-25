import type { SupabaseClient } from '@supabase/supabase-js';
import type { Webhook } from './hooks';

export type CrawlBase = {
  supabase?: SupabaseClient;
  url: string;
  user_id: string;
  proxy?: boolean;
  webhook?: Webhook;
  headless?: boolean;
  hard_limit?: number;
  has_sub?: boolean;
  budget?: Record<string, number>;
};
