import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'spiderwebai-components/react/components/ui/dialog';
import { Button } from 'spiderwebai-components/react/components/ui/button';
import { Scale } from 'lucide-react';
import { CrawlBudgetForm } from './crawl-budget-form';
import { getLangFromUrl, getTranslations } from '@/i18n/utils';
import { crawlBudget } from '@/stores/my';
import { useStore } from '@nanostores/react';

export const CrawlBudgetDialog = ({
  domain,
  crawlBudget,
}: {
  domain?: string;
  crawlBudget: Record<string, any>;
}) => {
  const [budgetOpen, setBudgetOpen] = useState(false);

  return (
    <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="gap-2 min-w-[9.8rem]">
          <Scale size={'14px'} />
          <span>Set Budget</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>
            Set a crawl budget to prevent certain paths from exceeding the limit of pages/resources
            allowed.
          </DialogDescription>
        </DialogHeader>
        <CrawlBudgetForm setOpen={setBudgetOpen} domain={domain} budget={crawlBudget} />
      </DialogContent>
    </Dialog>
  );
};

export const CrawlBudgetSection = ({ domain, url }: { domain?: string; url: URL }) => {
  const lang = getLangFromUrl(url, 'settings');
  const t = getTranslations(lang, 'settings');
  const $crawlBudget = useStore(crawlBudget);

  return (
    <div>
      <h2 className="mt-10 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        {t('crawl.budget')}
      </h2>
      <p className="leading-7 [&:not(:first-child)]">{t('crawl.description')}</p>
      <div className="gap-2 place-items-center flex px-2 py-3">
        <CrawlBudgetDialog crawlBudget={$crawlBudget} />
      </div>
    </div>
  );
};
