import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSession } from '@/lib/hooks/use-session';
import { proxyEnabled, headlessEnabled } from '@/stores/my';
import { useStore } from '@nanostores/react';
import { getLangFromUrl, getTranslations } from '@/i18n/utils';
import SupbaseAuth from '@/components/react/Auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WebhookEventsForm } from './webhook-events';
import { Button } from '@/components/ui/button';
import { LucideMonitorDot, WebhookIcon } from 'lucide-react';
import { CrawlBudgetForm } from './crawl-budget-form';
import { CrawlBudgetSection } from './crawl-budget-section';

type SettingsProps = {
  url: URL;
};

export const SettingsForm = ({ url }: SettingsProps) => {
  const $proxy = useStore(proxyEnabled);
  const $headless = useStore(headlessEnabled);
  const $session = useSession();
  const [open, setOpen] = useState(false);

  const lang = getLangFromUrl(url, 'settings');
  const t = getTranslations(lang, 'settings');

  const onProxyToggleEvent = async () => {
    proxyEnabled.set(!$proxy);
    try {
      await fetch('/api/update-user', {
        method: 'POST',
        body: JSON.stringify({ proxy: !$proxy }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const onHeadlessToggleEvent = async () => {
    headlessEnabled.set(!$headless);
    try {
      await fetch('/api/update-user', {
        method: 'POST',
        body: JSON.stringify({ headless: !$headless }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!$session) {
    return (
      <div className="p-4 grid place-content-center py-16 gap-5">
        <div>
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl">
            {t('intro.header')}
          </h1>
          <p className="leading-7 [&:not(:first-child)]:mt-6">{t('intro.description')}</p>
        </div>

        <div className="py-6 space-y-4">
          <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors text-center">
            Authenticate to get started
          </h2>
          <SupbaseAuth />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 grid place-content-center py-16 gap-5">
      <div>
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl">
          {t('intro.header')}
        </h1>
        <p className="leading-7 [&:not(:first-child)]:mt-6">{t('intro.description')}</p>
      </div>

      <div>
        <h2 className="mt-10 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          {t('proxy')}
        </h2>
        <p className="leading-7 [&:not(:first-child)]">{t('proxy.description')}</p>

        <div className="gap-2 place-items-center flex px-2 py-3">
          <Switch name="proxy" id="proxy-form" onClick={onProxyToggleEvent} checked={$proxy} />
          <Label htmlFor="proxy-form" className="text-xs font-normal">
            Proxy
          </Label>
        </div>
      </div>

      <div>
        <h2 className="mt-10 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          {t('headless')}
        </h2>
        <p className="leading-7 [&:not(:first-child)]">{t('headless.description')}</p>

        <div className="gap-2 place-items-center flex px-2 py-3">
          <Switch
            name="headless"
            id="headless-form"
            onClick={onHeadlessToggleEvent}
            checked={$headless}
          />
          <Label htmlFor="headless-form" className="text-xs font-normal">
            Headless
          </Label>
        </div>
      </div>

      <div>
        <h2 className="mt-10 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          {t('webhooksheader')}
        </h2>
        <p className="leading-7 [&:not(:first-child)]">{t('webhooksheader.description')}</p>
        <div className="gap-2 place-items-center flex px-2 py-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="gap-2">
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
              <WebhookEventsForm dialogFooter user_id={$session?.user?.id} setOpen={setOpen} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <CrawlBudgetSection url={url} />
    </div>
  );
};
