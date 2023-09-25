import { useStore } from '@nanostores/react';
import { map } from 'nanostores';
import { type FC, useState, FormEvent } from 'react';
import { BudgetStore, headlessEnabled, proxyEnabled, session, websites } from '@/stores/my';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { onErrorEvent } from '../Errors';
import { toast } from '@/components/ui/use-toast';
import { DropdownCrawlSelect } from '../menus/crawl-select';

interface Props {}

const extractWebsiteUrl = (u: string) => {
  let cleanUrl = String(u)
    .replace(/^(?:https?:\/\/)?/i, '')
    .trim();

  if (cleanUrl.includes(' ')) {
    return;
  }

  let tpt = 'https';

  if (u.includes('http://')) {
    tpt = 'http';
  }

  let urlBase = cleanUrl.includes('://') ? '' : `://`;
  let blockExt = false;

  if (cleanUrl.includes('localhost:')) {
    blockExt = true;
  }

  // determine whether to add an extension or not
  const ex = blockExt || cleanUrl.includes('.');
  const websiteUrl = `${tpt}${urlBase}${cleanUrl}${ex ? '' : '.com'}`.trim();

  return websiteUrl;
};

// parse a url to see if it is valid
const parseUrl = (u?: string) => {
  if (u) {
    try {
      return new URL(u);
    } catch (_) {}
  }
};

const WebsiteForm: FC<Props> = ({}) => {
  const [loading, setLoading] = useState(false);
  const [websiteURL, setWebsiteURL] = useState('');
  const $session = useStore(session);
  const $proxyEnabled = useStore(proxyEnabled);
  const $headlessEnabled = useStore(headlessEnabled);

  const createWebsite = async (uu?: string) => {
    const _urlOrQuery = uu ?? websiteURL;
    const websiteUrl = extractWebsiteUrl(_urlOrQuery);
    let urlParsed: URL | undefined = parseUrl(websiteUrl);

    if ($session?.user.id) {
      if (!urlParsed && _urlOrQuery.length < 6) {
        return toast({
          title: 'Query Error',
          description:
            'You need to put a valid website url or ask a question with at least 6 characters.',
        });
      }

      const body = {
        url: websiteUrl ?? _urlOrQuery, // pass in the query or website url
        domain: urlParsed?.hostname,
        proxy: $proxyEnabled,
        headless: $headlessEnabled,
        query: !urlParsed,
      };

      // TODO: validate URL (or maybe do it on supabase side?)
      let response = null;

      try {
        response = await fetch('/api/create-website', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        if (response.ok) {
          // send prompt
          if (response.status === 202) {
            const t = await response.text();

            return toast({
              title: 'Query did not fulfill',
              description: t,
            });
          } else {
            response = await response.json();
          }

          setWebsiteURL('');
        } else {
          try {
            onErrorEvent(
              response?.status === 400 ? new Error(await response.text()) : new Error('API Error')
            );
          } catch (e) {
            console.error(e);
          }
        }
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          onErrorEvent(e);
        }
      }

      const results = response?.data;

      // prompt the user if they want to crawl the website
      if (results && (Array.isArray(results) || Object.keys(results).length === 1)) {
        let websiteUrl = '';

        if (typeof results === 'object') {
          if (Array.isArray(results)) {
            // only get first item from results TODO: allow multiple websites to be created from response
            // A select option should appear with the choices.
            const random = results.length && results[Math.floor(Math.random() * results.length)];

            if (random) {
              websiteUrl = random.url.replace(/\/$/, '');
            }
          } else {
            websiteUrl = results.url.replace(/\/$/, '');
          }
        }

        return toast({
          title: websiteUrl,
          description: `Would you like to crawl ${websiteUrl}?`,
          action: (
            <Button onClick={async () => await createWebsite(websiteUrl)} type="button">
              Crawl
            </Button>
          ),
        });
      }

      // TODO: prep for an array of websites returned if prompt query was asked.
      const website = response?.data;

      const domain = parseUrl(website?.url)?.hostname;

      // if a valid domain was returned
      if (domain) {
        const budgetMap: BudgetStore = map();

        budgetMap.set({
          '': '',
        });

        websites.setKey(domain, {
          id: website.id,
          url: website.url,
          pages: map(),
          domain,
          proxy: website.proxy,
          user_id: website.user_id,
          updated_at: website.updated_at,
          created_at: website.created_at,
          totalPages: 0,
          crawl_budget: budgetMap,
        });
      } else {
        // no credits
        onErrorEvent(response?.error ?? new Error('Error, could not complete'));
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement> | undefined, u?: string) => {
    event?.preventDefault();
    if (!$session) {
      return toast({
        title: 'Authentication Required',
        description: 'Login and add credits to get started.',
      });
    }
    setLoading(true);

    try {
      await createWebsite(u);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onWebsiteChangeEvent = (e: React.ChangeEvent<HTMLInputElement> | undefined) =>
    setWebsiteURL(e?.target?.value || '');

  const onSelectEvent = async (e: string) => {
    setWebsiteURL(e);
    await handleSubmit(undefined, e);
  };

  return (
    <form
      className={'place-items-center flex flex-col gap-3'}
      onSubmitCapture={handleSubmit}
      aria-busy={loading}
    >
      <Label className={'sr-only'} htmlFor="websiteURL">
        Website URL
      </Label>
      <input
        type="text"
        id="websiteURL"
        value={websiteURL}
        className={`pl-5 pr-5 py-2 md:min-w-[30rem] rounded-full leading-8 dark:text-white hover:shadow-lg w-full bg-white dark:bg-[rgb(59,59,59)]`}
        placeholder="Enter a url or ask a question..."
        onChange={onWebsiteChangeEvent}
        required
      />

      <div className="flex place-items-center gap-3">
        <Button
          type="submit"
          variant={'secondary'}
          className="text-gray-800 dark:text-gray-100 font-normal"
        >
          Spider Crawl
        </Button>
        <DropdownCrawlSelect onSelect={onSelectEvent} />
      </div>
    </form>
  );
};

export default WebsiteForm;
