import { type FC, useCallback, useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { map } from 'nanostores';
import { supabase } from '@/lib/supabase';
import { type PagesStore, pagePaginationLimit, websites, session, BudgetStore } from '@/stores/my';
import { WebsitesCell } from './WebsitesCell';

interface Props {
  // the browser url, not the website
  url: URL;
}

const WebsiteList: FC<Props> = ({ url }) => {
  const [loading, setLoading] = useState(false);
  const $websites = useStore(websites);
  const $session = useStore(session);

  const selectWebPages = useCallback(() => {
    setLoading(true);
    return supabase
      .from('websites')
      .select('*')
      .then(async (results) => {
        if (results && results.data) {
          const oldPages = websites.get();

          for (const item of results.data) {
            const pagesMap: PagesStore = map();

            const { data: pagesData, count } = await supabase
              .from('pages')
              .select('*', { count: 'exact', head: true })
              .eq('domain', item.domain)
              .limit(pagePaginationLimit.get().limit);

            // if pre-fetching set data instantly
            if (pagesData && pagesData.length) {
              const pagesDataMap = pagesData.reduce((obj, item) => {
                return {
                  ...obj,
                  [item.url]: item,
                };
              }, {});

              pagesMap.set(pagesDataMap);
            }

            const oldWebsite = oldPages[item.domain];

            const budgetValues = oldWebsite ? oldWebsite.crawl_budget : item.crawl_budget;
            const _budget = budgetValues ?? {};

            const budgetMap: BudgetStore = map();

            budgetMap.set({
              ..._budget,
              '': '',
            });

            websites.setKey(item.domain, {
              id: item.id,
              user_id: item.user_id,
              url: item.url,
              domain: item.domain,
              headless: item.headless,
              created_at: item.created_at,
              updated_at: item.updated_at,
              pages: oldWebsite ? oldWebsite.pages : pagesMap,
              crawl_budget: budgetMap,
              proxy: item.proxy,
              // reflect for pagination
              totalPages: count || 0,
            });
          }
        }

        setLoading(false);

        return results;
      });
  }, [setLoading]);

  // only load websites on first auth or re-auths
  useEffect(() => {
    if ($session?.access_token) {
      selectWebPages();
    }
  }, [selectWebPages, $session]);

  return (
    <ul
      aria-busy={loading}
      className={`grid px-1 gap-4 py-12 max-w-screen-sm w-full md:w-[640px] overflow-hidden scrollbar-thin scrollbar-thumb-gray-900 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-100 dark:scrollbar-track-gray-900`}
    >
      {Object.values($websites).map((website) => {
        return website ? (
          <WebsitesCell key={`websites-${website.id}`} website={website} url={url} />
        ) : undefined;
      })}
    </ul>
  );
};

export default WebsiteList;
