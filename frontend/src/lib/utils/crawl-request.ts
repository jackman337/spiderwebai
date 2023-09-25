import type { CrawlBase } from './crawl-types';

const CRAWL_LAMDA_URL = import.meta.env.CRAWL_LAMDA_URL;
const CRAWL_CHROME_LAMDA_URL = import.meta.env.CRAWL_CHROME_LAMDA_URL;

// perform a crawl to the lambda endpoint: this only runs in dev
export const crawlLambda = async ({ supabase, headless, ...params }: CrawlBase) => {
  try {
    await fetch(
      headless
        ? CRAWL_CHROME_LAMDA_URL || CRAWL_LAMDA_URL.replace('9001', '9002')
        : CRAWL_LAMDA_URL,
      {
        method: 'POST',
        body: JSON.stringify(params),
        headers: {
          'content-type': 'application/json',
          authorization: supabase?.realtime?.accessToken || '',
        },
        credentials: 'include',
      }
    );
  } catch (e) {
    console.error(e);
  }
};
