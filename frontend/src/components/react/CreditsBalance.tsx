import type { FC } from 'react';
import { useCredits } from '@/lib/hooks/use-credits';

interface Props {
  className?: string;
}

const CreditsBalance: FC<Props> = ({ className }) => {
  const { loading, error, price } = useCredits();

  return (
    <>
      <p className={className ?? 'text-xs px-2'}>Credits: {loading ? 'Loading... ' : price}</p>
      {error ? (
        <div className="px-2">
          <p className="text-xs text-red-500">{error}</p>
          {error === 'JWT expired' ? null : <p className="text-xs">Contact Support for Help</p>}
        </div>
      ) : null}
    </>
  );
};

export default CreditsBalance;
