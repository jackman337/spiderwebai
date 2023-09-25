import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import CurrencyInput from 'react-currency-input-field';

interface HardLimitFormProps extends React.HTMLAttributes<HTMLDivElement> {
  hardLimit: number;
  approvedLimit: number;
}

export function HardLimitForm({ className, hardLimit, approvedLimit }: HardLimitFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget as any);

    const billingLimitValue = formData.get('billing_limit');
    const billingLimit = Number(
      typeof billingLimitValue === 'string' ? billingLimitValue.replace('$', '') : billingLimitValue
    );

    if (billingLimit > approvedLimit) {
      setIsLoading(false);
      return toast({
        title: 'Hard limit must be less than approved limit',
      });
    }
    if (billingLimit === hardLimit || !billingLimit) {
      setIsLoading(false);
      return;
    }

    await fetch('/api/user', { method: 'POST', body: formData });
    setIsLoading(false);
    toast({
      title: 'Limit updated',
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Label htmlFor="hard-limit" className="sr-only">
        Hard Limit
      </Label>

      <CurrencyInput
        id="hard-limit"
        name="billing_limit"
        placeholder="Please enter a number"
        prefix="$"
        defaultValue={hardLimit || 50}
        maxLength={9}
        max={approvedLimit}
        decimalsLimit={0}
        className="p-3 bg-transparent bg-white dark:bg-gray-800 flex rounded"
      />

      <Button type="submit" disabled={isLoading}>
        Submit
      </Button>
    </form>
  );
}
