import { SetStateAction, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import cookie from 'cookie';
import { supabase } from '@/lib/supabase';
import { type WebPage, session, websites, Website } from '@/stores/my';
import { CookieKeys } from '@/lib/storage';
import { toast } from 'spiderwebai-components/react/components/ui/use-toast';
import { ToastAction } from '@radix-ui/react-toast';
import { formatDuration } from 'date-fns';
import { expireAuthCookies } from '@/lib/utils/cookies/expire-auth';

type SessionHookProps = { setOpen?: React.Dispatch<SetStateAction<boolean>> };

// hook to get the session data out of supabase
export const useSession = (hookProps?: SessionHookProps) => {
  const $session = useStore(session);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase?.auth?.onAuthStateChange(async (event, newSession) => {
      // same session
      if (event === 'SIGNED_IN' && $session?.access_token === newSession?.access_token) return;

      // sign out of the session
      if (event === 'SIGNED_OUT') {
        expireAuthCookies();
        return session.set(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (hookProps && typeof hookProps.setOpen === 'function') {
          hookProps.setOpen(false);
        }

        document.cookie = cookie.serialize(
          CookieKeys.ACCESS_TOKEN,
          newSession?.access_token || '',
          {
            sameSite: 'lax',
            secure: !import.meta.env.DEV,
            path: '/',
          }
        );
        // keep refresh token around for re-auth
        document.cookie = cookie.serialize(
          CookieKeys.REFRESH_TOKEN,
          newSession?.refresh_token || '',
          {
            sameSite: 'lax',
            secure: !import.meta.env.DEV,
            path: '/',
          }
        );
      }

      // perform refresh if not authed to see if still allowed
      if (!newSession && $session?.refresh_token) {
        try {
          console;
          const freshSession = await supabase?.auth?.refreshSession({
            refresh_token: $session.refresh_token,
          });

          if (freshSession.data.session) {
            newSession = freshSession.data.session;
          }
        } catch (e) {
          console.error(e);
        }
      }

      session.set(newSession || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // check for subscription as well for realtime changes
    if ($session) {
      const realtime = supabase.realtime
        .channel('any')
        .on('postgres_changes', { event: '*', schema: '*' }, (payload) => {
          // update pages collection map TODO
          if (payload.table === 'pages') {
            const page = payload.new as WebPage;
            const website = websites.get()[page.domain];
            if (website) {
              website.pages.setKey(page.url, page);
            }
          }
          if (payload.table === 'crawl_state') {
            const page = payload.new as Website;
            const website = websites.get()[page.domain];

            if (!website) {
              return;
            }

            if (page.mode === 1) {
              return toast({
                title: `Crawl complete.`,
                description: `The crawl completed in ${formatDuration({
                  seconds: page.crawl_duration ? page.crawl_duration / 1000 : 0,
                })} for ${website.domain}.`,
              });
            }

            if (website && !website.shutdown) {
              toast({
                title: `Credits ran out!`,
                description: `You need to add more credits to continue, the crawl took ${formatDuration(
                  { seconds: page.crawl_duration ? page.crawl_duration / 1000 : 0 }
                )}.`,
                variant: 'destructive',
                action: (
                  <ToastAction altText="Add Credits" asChild>
                    <a href={'/credits/new'} className="hover:underline">
                      Add Credits
                    </a>
                  </ToastAction>
                ),
              });
              website.shutdown = true;
            }
          }
        })
        .subscribe();

      return () => {
        realtime.unsubscribe();
      };
    }
  }, [$session]);

  return $session;
};
