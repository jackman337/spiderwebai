import { useEffect, useMemo, useState, type FC } from 'react';
import { formatMoney } from '@/lib/utils/format-money';
import { useStore } from '@nanostores/react';
import { session } from '@/stores/my';

interface Props {
  className?: string;
}

export const UsageBalance: FC<Props> = ({ className }) => {
  const $session = useStore(session);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [balance, setBalance] = useState<number>(0);

  const lang = 'en';

  const price = useMemo(() => formatMoney('en', Math.max(balance, 0)), [lang, balance]);

  useEffect(() => {
    if ($session?.access_token) {
      setError(undefined);
      (async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/get-usage', {
            headers: {
              authorization: $session.access_token,
            },
          });
          const json = res.ok && (await res.json());

          let usage = 0;

          if (json && Array.isArray(json) && json.length) {
            for (const item of json) {
              usage += item.total_usage;
            }
          }

          setBalance(usage / 100);
        } catch (e) {
          console.error(e);
        }
        setLoading(false);
      })();
    }
  }, [$session]);

  return (
    <>
      <p className={className ?? 'text-xl px-2'}>
        Usage this month: {loading ? 'Loading... ' : price}
      </p>
      {error ? (
        <div className="px-2">
          <p className="text-xs text-red-500">{error}</p>
          {error === 'JWT expired' ? null : <p className="text-xs">Contact Support for Help</p>}
        </div>
      ) : null}
    </>
  );
};
