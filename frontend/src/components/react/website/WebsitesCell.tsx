import { useEffect, useMemo, useRef, useState } from 'react';
import type { Website } from '@/stores/my';
import { Pages } from './WebPages';
import { FlaskConicalOffIcon } from 'lucide-react';
import Chat from '@/components/react/chat/Chat';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'spiderwebai-components/react/components/ui/tooltip';
import { formatDistanceStrict } from 'date-fns';
import { PagesProvider } from './providers/pages';
import { WebPageResource } from './WebPageResource';
import { WebsitesCellOptions } from './WebsiteCellOptions';

export const WebsitesCell = ({ website }: { website: Website; url: URL }) => {
  const [chatVisible, setChatVisible] = useState<boolean | 'hidden'>(false);
  const pagesRef = useRef<{ pageCounterDisplay?: string; onSetVisible: () => void }>(null);

  const updateDate = useMemo(() => new Date(website.updated_at), [website.updated_at]);

  const formatedDate = useMemo(
    () => formatDistanceStrict(updateDate, new Date(), { addSuffix: true }),
    [updateDate]
  );

  return (
    <li
      key={`website-${website.id}`}
      className="flex flex-col flex-1 border-2 px-4 py-3 rounded border-gray-300 dark:border-gray-800 relative"
    >
      <PagesProvider
        domain={website.domain}
        userID={website.user_id}
        pages={website.pages}
        totalPages={website.totalPages}
      >
        <div className="absolute -top-3 right-1 z-10">
          <WebPageResource />
        </div>

        <div className="flex gap-2 flex-1 flex-col md:flex-row md:place-items-center md:place-content-between">
          <div>
            <a
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline scroll-m-20 text-lg tracking-tight truncate hover:text-blue-500 flex gap-2 place-items-center"
            >
              <img
                height={16}
                width={16}
                src={`/fav/${encodeURI(website.domain)}`}
                alt={`${website.domain} favicon`}
              />

              <span>{website.domain}</span>
              <span>
                {website.shutdown ? (
                  <FlaskConicalOffIcon className="text-gray-500" size="14px" />
                ) : null}
              </span>
            </a>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <time
                    dateTime={updateDate.toISOString()}
                    className="text-sm block py-1 font-light"
                  >
                    {formatedDate}
                  </time>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The last crawl date for {website.domain}.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <WebsitesCellOptions
            website={website}
            setChatVisible={setChatVisible}
            pagesRef={pagesRef}
            chatVisible={chatVisible}
          />
        </div>

        <div>
          <Pages
            pages={website.pages}
            domain={website.domain}
            totalPages={website.totalPages}
            userID={website.user_id}
            ref={pagesRef}
          />

          {chatVisible ? (
            <div className={`py-2${chatVisible === 'hidden' ? ' hidden' : ''}`}>
              <Chat hideHeader website={website} />
            </div>
          ) : null}
        </div>
      </PagesProvider>
    </li>
  );
};
