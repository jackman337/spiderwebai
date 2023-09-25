import React from 'react';
import { session } from '@/stores/my';
import { useStore } from '@nanostores/react';

export const StripePortalLink = () => {
  const $session = useStore(session);

  const manageBillingUrl = `${
    import.meta.env.PUBLIC_STRIPE_PORTAL
  }?prefilled_email=${encodeURIComponent($session?.user?.email || '')}`;

  return (
    <a
      href={manageBillingUrl}
      className="hover:text-blue-600 p-4 border-2 rounded border-black dark:border-white hover:border-blue-600 dark:hover:border-blue-600"
    >
      Manage Payments
    </a>
  );
};
