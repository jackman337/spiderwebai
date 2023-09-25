import type { FC, PropsWithChildren } from 'react';
import { session } from '@/stores/my';
import { useStore } from '@nanostores/react';

const IfLogged: FC<PropsWithChildren> = ({ children }) => {
  const $session = useStore(session);
  const isLoggedIn = $session?.access_token;

  return <>{isLoggedIn ? children : null}</>;
};

export default IfLogged;
