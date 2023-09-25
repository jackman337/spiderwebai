import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/react/Avatar';
import SignOut from './SignOut';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WebhookEventsForm } from './forms/webhook-events';
import { FeedbackEventsForm } from './forms/feedback-form';
import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/hooks/use-session';
import { BadgeAlertIcon, CoinsIcon, DollarSignIcon, SettingsIcon, User2Icon } from 'lucide-react';

// modal states
enum Triggers {
  'feedback',
  'webhooks',
  'register',
  'login',
}

// todo: get github id if signed on
// todo: use cookies to display pre session display
export const AuthDropdown = () => {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<Triggers>();
  const $session = useSession({ setOpen });

  const email = $session?.user?.email;

  // todo: use cookies or localstorage to determine re-auth
  // const onLoginEvent = () => setTrigger(Triggers.login);
  const onRegisterEvent = () => setTrigger(Triggers.register);
  const onFeedbackTrigger = () => setTrigger(Triggers.feedback);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {$session ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:opacity-70">
            <UserAvatar initials={email ? email[0] : ''} email={email} />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <>
              <p className="text-sm px-2 truncate max-w-xs py-1">{email}</p>
              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <a href="/credits/new" className="w-full flex gap-2 place-items-center">
                  <CoinsIcon size={'1rem'} />
                  <span>Credits</span>
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem>
                <a href="/account/usage" className="w-full flex gap-2 place-items-center">
                  <DollarSignIcon size={'1rem'} />
                  <span>Usage</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="/account/settings" className="w-full flex gap-2 place-items-center">
                  <SettingsIcon size={'1rem'} />
                  <span>Settings</span>
                </a>
              </DropdownMenuItem>
            </>

            <>
              <DialogTrigger asChild>
                <DropdownMenuItem className="cursor-pointer" onClick={onFeedbackTrigger}>
                  <span className="w-full flex gap-2 place-items-center">
                    <BadgeAlertIcon size={'1rem'} />
                    <span>Send Feedback</span>
                  </span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuItem>
                <SignOut />
              </DropdownMenuItem>
            </>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <DialogTrigger
          asChild
          onClick={onRegisterEvent}
          className="border border-blue-600 rounded-full hover:opacity-80 px-3 py-1 hover:bg-blue-300 text-blue-600 hover:cursor-pointer"
        >
          <span className="w-full flex gap-2 place-items-center">
            <User2Icon size={'1rem'} />
            <span>Sign In</span>
          </span>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[425px]">
        {trigger === Triggers.feedback ? (
          <>
            <DialogHeader>
              <DialogTitle>Leave Feedback</DialogTitle>
              <DialogDescription>Tell us what you think!</DialogDescription>
              <FeedbackEventsForm dialogFooter user_id={$session?.user?.id} setOpen={setOpen} />
            </DialogHeader>
          </>
        ) : trigger && [Triggers.register, Triggers.login].includes(trigger) ? (
          <>
            <div className="max-w-screen-sm container text-black dark:text-white pb-10">
              {/* <DialogTitle className="capitalize text-center">{trigger}</DialogTitle>
              <DialogDescription className="text-center">
                Authenticate to start crawling your websites.
              </DialogDescription> */}

              <div className="py-4">
                <Auth
                  supabaseClient={supabase}
                  view={trigger === Triggers.register ? 'sign_up' : undefined}
                  appearance={{
                    extend: false,
                    className: {
                      divider: 'w-full h-0.5 bg-black dark:bg-white my-4',
                      label: 'block py-1',
                      container: 'grid gap-3',
                      button:
                        'px-3 py-2 rounded border-2 border-black hover:bg-blue-300 dark:hover:bg-blue-600 dark:hover:text-gray-200 hover:text-gray-600 dark:border-white dark:hover:border-blue-500 hover:border-blue-500 flex gap-2 place-content-center place-items-center',
                      input:
                        'px-3 py-2 rounded border-2 flex-1 w-full border-black dark:border-white bg-transparent',
                      anchor: 'text-center underline hover:text-blue-500',
                      message: 'block w-full py-2 text-red-500 text-center',
                    },
                  }}
                  providers={['github']}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Edit Webhooks</DialogTitle>
              <DialogDescription>
                Make changes to your webhooks here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>

            <WebhookEventsForm dialogFooter user_id={$session?.user?.id} setOpen={setOpen} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
