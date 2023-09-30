import type { FC } from 'react';
import { supabase } from '@/lib/supabase';
import { session, websites, websitesPagination } from '@/stores/my';
import { toast } from 'spiderwebai-components/react/components/ui/use-toast';
import { expireAuthCookies } from '@/lib/utils/cookies/expire-auth';
import { LogOutIcon } from 'lucide-react';

interface Props {}

const SignOut: FC<Props> = ({}) => {
  const onSignoutEvent = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: error.name,
        description: error.message,
      });
      localStorage.clear();
    }

    session.set(null);
    websites.set({});
    websitesPagination.set(0);
    expireAuthCookies();
  };

  return (
    <button
      type={'button'}
      onClick={onSignoutEvent}
      className="text-left w-full flex gap-2 place-items-center"
    >
      <LogOutIcon size={'1rem'} />
      <span>Sign Out</span>
    </button>
  );
};

export default SignOut;
