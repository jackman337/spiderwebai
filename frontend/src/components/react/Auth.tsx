import type { FC, PropsWithChildren } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/hooks/use-session';

const unauthRoutes = ['/pricing', '/privacy'];

const supabaseClassName = {
  extend: false,
  className: {
    divider: 'w-full h-0.5 bg-black dark:bg-white my-4',
    label: 'block py-1',
    container: 'grid gap-3',
    button:
      'px-3 py-2 rounded border-2 border-black hover:bg-blue-300 dark:hover:bg-blue-600 dark:hover:text-gray-200 hover:text-gray-600 dark:border-white dark:hover:border-blue-500 hover:border-blue-500 flex gap-2 place-content-center place-items-center',
    input: 'px-3 py-2 rounded border-2 flex-1 w-full border-black dark:border-white bg-transparent',
    anchor: 'text-center underline hover:text-blue-500',
    message: 'block w-full py-2 text-red-500 text-center',
  },
};

const SupbaseAuth: FC<PropsWithChildren & { pathname?: string }> = ({ children, pathname }) => {
  const $session = useSession();

  if (!$session && !unauthRoutes.includes(pathname || '')) {
    return (
      <div className="max-w-screen-sm container text-black dark:text-white pb-10">
        <Auth supabaseClient={supabase} appearance={supabaseClassName} providers={['github']} />
        {children}
      </div>
    );
  }

  return children;
};

export default SupbaseAuth;
