import { ToastAction } from '@radix-ui/react-toast';
import { toast } from 'spiderwebai-components/react/components/ui/use-toast';

export const onErrorEvent = (e: Error) => {
  const needsCredits = e.message === 'You need to add credits first.';
  toast({
    title: 'Error',
    description: e.message,
    variant: needsCredits ? 'destructive' : undefined,
    action: needsCredits ? (
      <ToastAction altText="Add Credits" asChild>
        <a href={'/credits/new'} className="hover:underline">
          Add Credits
        </a>
      </ToastAction>
    ) : undefined,
  });
};
