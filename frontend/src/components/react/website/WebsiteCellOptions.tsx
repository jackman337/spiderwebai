import { useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import type { Website } from '@/stores/my';
import {
  DownloadIcon,
  MessagesSquareIcon,
  WebhookIcon,
  CalendarIcon,
  RefreshCcwIcon,
  FilesIcon,
  MoreVerticalIcon,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '../../../lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { headlessEnabled, proxyEnabled, websites } from '@/stores/my';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { downloadFolder } from '@/lib/utils/download';
import { onErrorEvent } from '../Errors';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WebhookEventsForm } from '../forms/webhook-events';
import { ScheduleEventsForm } from '../forms/schedule-events';
import clsx from 'clsx';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CrawlBudgetDialog } from '../forms/crawl-budget-section';
import { useStore } from '@nanostores/react';

export const WebsitesCellOptions = ({
  website,
  pagesRef,
  setChatVisible,
  chatVisible,
}: {
  website: Website;
  chatVisible: string | boolean;
  setChatVisible: Dispatch<SetStateAction<boolean | 'hidden'>>;
  pagesRef: RefObject<{ pageCounterDisplay?: string; onSetVisible: () => void }>;
}) => {
  const $budget = useStore(website?.crawl_budget);
  const [downloading, setDownloading] = useState<boolean>(false);
  const { toast } = useToast();

  const onDisplayChatEvent = () =>
    setChatVisible((x) => {
      if (x === true) {
        return 'hidden';
      }
      if (x === 'hidden') {
        return true;
      }
      return !x;
    });

  const onDownloadFilesEvent = async () => {
    setDownloading(true);
    await downloadFolder(website, supabase);
    setDownloading(false);
  };

  const onScanEvent = async () => {
    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        body: JSON.stringify({
          ...website,
          headless: website.headless ?? headlessEnabled.get(),
          proxy: website.proxy ?? proxyEnabled.get(),
        }),
      });

      if (!res.ok) {
        try {
          onErrorEvent(res?.status === 400 ? new Error(await res.text()) : new Error('API Error'));
        } catch (e) {
          console.error(e);
        }
      } else {
        try {
          const dataSource = await res.json();

          if (dataSource) {
            const w = websites.get()[dataSource.domain];

            if (w) {
              websites.setKey(dataSource.domain, {
                ...w,
                updated_at: dataSource.updated_at,
              });
            }
          }
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
  };

  const onDeleteEvent = async () => {
    // perform Server side delete records to prevent client disconnecting
    websites.setKey(website.domain, undefined);

    try {
      await fetch('/api/website', { method: 'DELETE', body: JSON.stringify(website) });
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        toast({
          title: e.name,
          description: e.message,
        });
      }
    }
  };

  // adjust proxy configurations
  const onProxyUpdateEvent = async () => {
    const { error } = await supabase
      .from('websites')
      .update({
        proxy: !website?.proxy,
      })
      .eq('id', website.id);

    if (error) {
      return toast({
        title: error.details,
        description: error.hint,
      });
    }

    const w = websites.get()[website.domain];

    if (w) {
      websites.setKey(website.domain, {
        ...w,
        proxy: !w?.proxy,
      });
    }
  };

  // adjust headless configurations
  const onHeadlessUpdateEvent = async () => {
    const { error } = await supabase
      .from('websites')
      .update({
        headless: !website?.headless,
      })
      .eq('id', website.id);

    if (error) {
      return toast({
        title: error.details,
        description: error.hint,
      });
    }

    const w = websites.get()[website.domain];

    if (w) {
      websites.setKey(website.domain, {
        ...w,
        headless: !w?.headless,
      });
    }
  };

  // first loading map may be unclean
  const _budget = 'get' in $budget && typeof $budget.get === 'function' ? $budget.value : $budget;

  return (
    <div className="grid grid-flow-row grid-cols-4 gap-1 place-items-center border-t md:border-none pt-2 md:pt-0">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size={'icon'} onClick={onScanEvent} type="button">
              <>
                <RefreshCcwIcon />
                <span className="sr-only">Run</span>
              </>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Start a new crawl for {website.domain}.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={'icon'}
              onClick={pagesRef.current?.onSetVisible}
              type="button"
            >
              <>
                <FilesIcon />
                <span className="sr-only">View</span>
              </>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View all the resources or pages found for {website.domain}.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={'icon'}
              onClick={onDisplayChatEvent}
              type="button"
              className={chatVisible && chatVisible !== 'hidden' ? 'text-blue-600' : ''}
            >
              <>
                <MessagesSquareIcon />
                <span className="sr-only">Chat AI</span>
              </>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Chat with AI about {website.domain}.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="ghost" size={'icon'} type="button">
                  <>
                    <MoreVerticalIcon />
                    <span className="sr-only">Settings</span>
                  </>
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Adjust settings for {website.domain}.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DialogContent className={'lg:max-w-screen-lg overflow-y-auto max-h-[90vh]'}>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Make changes to your website here like proxies, schedules, and more.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div>
              <h3 className="font-semibold">Proxies</h3>
              <p className="text-sm">Enable high performance proxies to prevent detection.</p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={website.proxy}
                id="proxy-mode"
                onCheckedChange={onProxyUpdateEvent}
              />
              <Label htmlFor="proxy-mode">Proxy</Label>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex place-items-center gap-2">
                <h3 className="font-semibold">Browser</h3>
              </div>
              <p className="text-sm">
                Use a headless browser to crawl websites that require Javascript to build.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={website.headless}
                id="headless-mode"
                onCheckedChange={onHeadlessUpdateEvent}
              />
              <Label htmlFor="headless-mode">Headless Browser</Label>
            </div>
          </div>

          <Dialog>
            <div className="space-y-2">
              <div>
                <h3 className="font-semibold">Webhooks</h3>
                <p className="text-sm">Listen to events with webhooks.</p>
              </div>

              <DialogTrigger asChild>
                <Button type="button" className="gap-2 min-w-[9.8rem]">
                  <WebhookIcon size={'14px'} />
                  <span>Set Webhooks</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Webhooks</DialogTitle>
                  <DialogDescription>
                    Make changes to your webhooks here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>

                <WebhookEventsForm website={website} dialogFooter />
              </DialogContent>
            </div>
          </Dialog>

          <Dialog>
            <div className="space-y-2">
              <div>
                <h3 className="font-semibold">Schedule</h3>
                <p className="text-sm">Set a crawl schedule to keep data fresh.</p>
              </div>

              <DialogTrigger asChild>
                <Button type="button" className="gap-2 min-w-[9.8rem]">
                  <CalendarIcon size={'14px'} />
                  <span>Set Schedule</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Schedule</DialogTitle>
                  <DialogDescription>Set the schedule of re-crawling the domain.</DialogDescription>
                </DialogHeader>

                <ScheduleEventsForm website={website} dialogFooter />
              </DialogContent>
            </div>
          </Dialog>

          <div className="space-y-2">
            <div>
              <h3 className="font-semibold">Crawl Budget</h3>
              <p className="text-sm">Set the crawl budget of the website to prevent excess cost.</p>
            </div>

            <CrawlBudgetDialog
              domain={website.domain}
              crawlBudget={(_budget as Record<string, any>) ?? { '': '' }}
            />
          </div>

          <div className="space-y-2">
            <div>
              <h3 className="font-semibold">Download</h3>
              <p className="text-sm">Download all files to zip.</p>
            </div>

            <Button
              type="button"
              className={clsx(downloading ? 'text-purple-600' : '', 'gap-2 min-w-[9.8rem]')}
              onClick={onDownloadFilesEvent}
              variant={'outline'}
            >
              <DownloadIcon size={'14px'} />
              <span>Download</span>
            </Button>
          </div>

          <div className="space-y-2">
            <div>
              <h3 className="font-semibold">Delete Website</h3>
              <p className="text-sm">Remove website and all related data.</p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" className="gap-2">
                  Delete Website
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your website and
                    remove all related data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteEvent}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
