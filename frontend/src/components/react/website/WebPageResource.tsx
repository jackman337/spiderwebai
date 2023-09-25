import { useContext } from 'react';
import { PagesContext } from './providers/pages';
import clsx from 'clsx';

// display the amomunt of resources available
export const WebPageResource = () => {
  const { onSetVisible, pageCounterDisplay, visible } = useContext(PagesContext);

  return (
    <button
      className={clsx(
        'text-xs px-1.5 py-0.5 rounded bg-slate-300 dark:bg-gray-700 min-w-[6.8rem]',
        visible
          ? 'text-gray-600 dark:text-purple-200 hover:text-pink-400 dark:hover:text-purple-100'
          : 'hover:text-pink-600 dark:hover:text-purple-300'
      )}
      type="button"
      onClick={onSetVisible}
      title="View all resources"
    >
      {pageCounterDisplay}
    </button>
  );
};
