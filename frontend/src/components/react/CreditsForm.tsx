import { useState, useMemo, lazy } from 'react';
import { Label } from '@/components/ui/label';
import { formatMoney } from '@/lib/utils/format-money';
import { Button } from '@/components/ui/button';
import { useStore } from '@nanostores/react';
import { session } from '@/stores/my';
import CurrencyInput from 'react-currency-input-field';

const SupbaseAuth = lazy(() => import('./Auth'));

const preFillOptions = new Array(448).fill(0);

export const CreditsForm = () => {
  const $session = useStore(session);

  // the estimated credits display from and to
  const [creditsValue, setCreditsValue] = useState<string>('2,500 - 10,000');
  // the dollar amount in credits to purchase
  const [dollarAmount, setDollarAmount] = useState<number>(5);

  const numFormatter = useMemo(() => new Intl.NumberFormat(), []);

  const onChangeEvent = (value: any, n?: any, currentInput?: any) => {
    const v = Number(value || 0);
    const formatedNextPages = numFormatter.format((v * 500) | 0);
    setCreditsValue(`${formatedNextPages} - ${numFormatter.format((v * 2000) | 0)}`);
    setDollarAmount(value);
  };

  // prefill the inputs with a number
  const onPrefillEvent = (p: number) => {
    onChangeEvent(p);
    setDollarAmount(p);
  };

  if (!$session) {
    return (
      <div className="py-6 space-y-4">
        <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors text-center">
          Authenticate to get started
        </h2>
        <SupbaseAuth />
      </div>
    );
  }

  return (
    <>
      <div className="text-sm">
        Estimated pages: <span className="text-gray-600 dark:text-gray-300">{creditsValue}</span>
      </div>
      <form method="POST" action="/api/credits">
        <div className="py-4 grid overflow-hidden px-1">
          <div className="space-y-1">
            <Label
              htmlFor="credits-field"
              className="sr-only text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Credits
            </Label>

            <CurrencyInput
              id="credits-field"
              placeholder="$5"
              prefix="$"
              min={5}
              max={1000000}
              maxLength={9}
              onValueChange={onChangeEvent}
              value={dollarAmount}
              decimalsLimit={0}
              className="p-3 bg-transparent bg-white dark:bg-gray-800 flex rounded w-full"
            />
          </div>
          <input type="hidden" name="credits" value={dollarAmount * 10000} />
          <ul className="flex overflow-auto py-2 gap-1 scrollbar-thin scrollbar-thumb-gray-900 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-100 dark:scrollbar-track-gray-900">
            {preFillOptions.map((_, index) => {
              const baseNumber = 5000;
              let prefillNumber = baseNumber * (index + 1);

              // TODO: improve logic to pick btns
              if (index >= 100) {
                prefillNumber *= Math.abs(index);
              } else if (index >= 70) {
                prefillNumber *= Math.abs(index) / 2;
              } else if (index >= 60) {
                prefillNumber *= Math.abs(index) / 3;
              } else if (index >= 50) {
                prefillNumber *= Math.abs(index) / 5;
              } else if (index >= 30) {
                prefillNumber *= 10;
              } else if (index >= 20) {
                prefillNumber *= 8;
              } else if (index >= 10) {
                prefillNumber *= 4;
              } else if (index >= 5) {
                prefillNumber *= 2;
              }

              // last item render one million
              if (index === 447) {
                prefillNumber = 9999999999;
              }

              return (
                <Button
                  key={`pre-fill-${index}`}
                  onClick={(_) => onPrefillEvent(prefillNumber / 1000)}
                  type="button"
                  variant={'outline'}
                >
                  {formatMoney(
                    'en',
                    Math.ceil(index === 447 ? prefillNumber / 10000 : prefillNumber / 1000),
                    {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                    }
                  )}
                </Button>
              );
            })}
          </ul>
        </div>
        <Button type="submit">Add Credits</Button>
        <div className="py-4 text-xs">After purchase, you will only pay for what you use.</div>
      </form>
    </>
  );
};
