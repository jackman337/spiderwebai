import { type MapStore, atom, map } from 'nanostores';
import type { Session } from '@supabase/supabase-js';
import { persistentAtom, persistentMap } from '@nanostores/persistent';

export type WebPage = {
  id: string;
  user_id: string;
  url: string;
  domain: string;
  pathname: string;
  shutdown?: boolean;
  updated_at: string;
  created_at: string;
};

export type PagesStore = MapStore<{
  [url: string]: WebPage;
}>;

export type BudgetStore = MapStore<{
  [path: string]: string | number | undefined;
}>;

// simple website management
export type Website = {
  id: string;
  url: string;
  domain: string;
  pages: PagesStore;
  shutdown?: boolean;
  headless?: boolean;
  proxy?: boolean;
  mode?: number; // 0 ready, 1 finished, 2 active, 3 shutdown.
  crawl_duration?: number; // duration as milliseconds of the crawl.
  user_id: string;
  created_at: string;
  updated_at: string;
  totalPages: number;
  crawl_budget: BudgetStore;
};

export const session = persistentAtom<Session | null>('@spiderwebai/session', {} as Session, {
  encode: JSON.stringify,
  decode: JSON.parse,
});
export const websites = map<Partial<{ [url: string]: Website | undefined | null }>>();
export const websitesPagination = atom<number>(0);
export const pagePaginationLimit = atom<{ limit: number; page: number }>({
  limit: 100,
  page: 1,
});
export const proxyEnabled = persistentAtom<boolean>('@spiderwebai/proxy', false, {
  encode: (value: boolean) => value + '',
  decode: (value: string) => value === 'true',
});
export const headlessEnabled = persistentAtom<boolean>('@spiderwebai/headless', false, {
  encode: (value: boolean) => value + '',
  decode: (value: string) => value === 'true',
});
export const crawlBudget = persistentMap('@spiderwebai/crawling-budget', {
  '': '',
} as { [key: string]: string | undefined });
// todo: add reset stores action.
