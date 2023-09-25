import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FeedbackEventsForm } from './feedback-form';
import { useStore } from '@nanostores/react';
import { session } from '@/stores/my';
import { useState } from 'react';

export const LimitIncreaseForm = () => {
  const $session = useStore(session);
  const [open, setOpen] = useState(false);

  const uid = $session?.user?.id;

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger className="text-blue-500 hover:text-purple-500">
        Ask for increase.
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ask for limit increase.</DialogTitle>
          <DialogDescription>
            Tell us why you need a limit increase. We normally get back in a couple hours to a day.
          </DialogDescription>
          <FeedbackEventsForm
            dialogFooter
            user_id={uid}
            defaultTitle={`Limit increase ${uid}`}
            hideTitle
            limitIncrease
            setOpen={setOpen}
          />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
