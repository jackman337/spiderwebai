import { useRef, type FormEvent, type SyntheticEvent } from 'react';
import { crawlBudget, websites } from '@/stores/my';
import { Button } from 'spiderwebai-components/react/components/ui/button';
import { Input } from 'spiderwebai-components/react/components/ui/input';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { Label } from 'spiderwebai-components/react/components/ui/label';
import { toast } from 'spiderwebai-components/react/components/ui/use-toast';

const BudgetInput = ({
  index,
  budget,
  remove,
  onBudgetEvent,
  domain,
}: {
  remove?: boolean;
  index: number;
  budget: [string, string | undefined];
  onBudgetEvent?: (x?: any) => any;
  domain?: string;
}) => {
  const pathInput = useRef<HTMLInputElement | null>(null);
  const budgetInput = useRef<HTMLInputElement | null>(null);

  const pname = `path-${index}`;
  const bname = `budget-${index}`;

  const onAddEntryEvent = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!pathInput.current || !budgetInput.current) return;

    const budgets = crawlBudget.get();
    // todo: use ref instead
    const pathElement = pathInput.current?.value || '';
    const budgetElement = budgetInput.current?.value || '';

    if (!domain) {
      // validate if input is in budget
      if (crawlBudget.get()[pathElement]) {
        return toast({
          title: 'Path already exist',
          description: 'Paths have to be unique, edit the path instead.',
        });
      }
      if (budgets) {
        crawlBudget.setKey(pathElement, budgetElement);
      } else {
        crawlBudget.set({
          '': '',
          [pathElement]: budgetElement,
        });
      }
    } else {
      const web = websites.get()[domain];

      if (web) {
        if (web.crawl_budget.get()[pathElement]) {
          return toast({
            title: 'Path already exist',
            description: 'Paths have to be unique, edit the path instead.',
          });
        }
        web.crawl_budget?.setKey(pathElement, budgetElement);
      }
    }

    pathInput.current.value = '';
    budgetInput.current.value = '';
  };

  const onRemoveEntry = async (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!pathInput.current) return;

    if (!domain) {
      // todo: use ref instead
      crawlBudget.setKey(pathInput.current?.value, undefined);

      // todo: hide the fields on delete instead
      if (onBudgetEvent) {
        await onBudgetEvent({
          preventDefault: e.preventDefault,
          currentTarget: document.getElementById('budget-form'),
        });
      }
    } else {
      const web = websites.get()[domain];

      if (web) {
        if (web.crawl_budget) {
          web.crawl_budget.setKey(pathInput.current?.value, undefined);
        }
      }
    }
  };

  return (
    <li className="flex flex-1 gap-1">
      <Label htmlFor={pname} className="sr-only">
        Path
      </Label>
      <Input placeholder="*" id={pname} defaultValue={budget[0]} name={'path'} ref={pathInput} />
      <Label htmlFor={bname} className="sr-only">
        Budget
      </Label>
      <Input
        placeholder="200"
        id={bname}
        defaultValue={budget[1]}
        name={'budget'}
        type="number"
        ref={budgetInput}
      />
      {remove ? (
        <Button type="button" size={'sm'} onClick={onRemoveEntry}>
          <MinusIcon />
          <span className="sr-only">Remove Row</span>
        </Button>
      ) : (
        <Button type="button" size={'sm'} onClick={onAddEntryEvent}>
          <PlusIcon />
          <span className="sr-only">Add More</span>
        </Button>
      )}
    </li>
  );
};

export const CrawlBudgetForm = ({
  setOpen,
  domain,
  budget,
}: {
  domain?: string;
  setOpen?: (x: boolean) => any;
  budget: Record<string, any>;
}) => {
  const budgets = Object.entries(budget);

  const onBudgetEvent = async (e: FormEvent<HTMLFormElement>) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (budgets.length > 100) {
      return toast({
        title: 'Over paths limit!',
        description: 'You can only add up to a 100 paths for your crawl budget.',
      });
    }

    const formElement = new FormData(e.currentTarget);
    const budgetObject: Record<string, number> = {};

    let cu_budget = '';

    // todo: use reduceRight instead - each form is grouped
    for (const [k, v] of formElement.entries()) {
      if (k === 'path') {
        cu_budget = (v as string).trim();
      }
      if (k === 'budget') {
        budgetObject[cu_budget] = Number(v);
      }
    }

    // remove empty budgets
    delete budgetObject[''];

    try {
      await fetch('/api/update-user', {
        method: 'POST',
        body: JSON.stringify({ domain, budget: budgetObject }),
      });

      const _nextBudget = {
        '': '',
        ...budgetObject,
      };

      if (!domain) {
        crawlBudget.set(_nextBudget);
      } else {
        const web = websites.get()[domain];
        if (web) {
          web.crawl_budget?.set(_nextBudget);
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (setOpen) {
      setOpen(false);
    }
  };

  const onClearEvent = async () => {
    if (!domain) {
      crawlBudget.set({
        '': '',
      });
    } else {
      // clear all from the website and upload. todo: check if exist local
      await fetch('/api/update-user', {
        method: 'POST',
        body: JSON.stringify({ domain, budget: {} }),
      });

      const web = websites.get()[domain];
      if (web) {
        web.crawl_budget?.set({ '': '' });
      }

      if (setOpen) {
        setOpen(false);
      }
    }
  };

  return (
    <form onSubmit={onBudgetEvent} id="budget-form">
      <ul className="py-4 gap-1 grid">
        {budgets
          .sort((x) => (!x[0] ? -1 : 0))
          .map((budget, index: number) => (
            <BudgetInput
              index={index}
              budget={budget}
              key={`budgetkey-${index}`}
              remove={!!budget[0] && budgets.length > 1}
              onBudgetEvent={onBudgetEvent}
              domain={domain}
            />
          ))}
      </ul>
      <div className="flex gap-3 place-content-end place-items-center">
        <Button type="button" onClick={onClearEvent} variant={'outline'}>
          Clear
        </Button>
        <Button type="submit">Set Budget</Button>
      </div>
    </form>
  );
};
