import { useEffect, useMemo, useState, type FC } from 'react';
import { supabase } from '../../lib/supabase';
import { formatMoney } from '../../lib/utils/format-money';

interface Props {}

export const useCredits = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [balance, setBalance] = useState<number>(0);

  const lang = 'en';

  // allow up to 1 million in balance or max int8 9999999999
  const price = useMemo(() => formatMoney('en', Math.max(balance / 10000, 0)), [lang, balance]);

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    supabase
      .from('credits')
      .select('credits')
      .limit(1)
      .single()
      .then(({ error, data }) => {
        if (error && error.code !== 'PGRST116') {
          setError(error.message);
        } else {
          setBalance(data?.credits || 0);
        }
        setLoading(false);
      });
  }, []);

  return {
    price,
    loading,
    error,
    balance,
  };
};
