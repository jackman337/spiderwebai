import { useCallback, useImperativeHandle, forwardRef, useContext } from 'react';
import type { PagesStore } from '@/stores/my';
import { Button } from 'spiderwebai-components/react/components/ui/button';
import { LoaderIcon } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { Input } from 'spiderwebai-components/react/components/ui/input';
import { Label } from 'spiderwebai-components/react/components/ui/label';
import { PagesContext } from './providers/pages';
import { Page } from './WebPage';

type PagesProps = {
  totalPages: number;
  pages: PagesStore;
  domain: string;
  userID: string;
};

export const PagesBase = ({ domain }: PagesProps, ref?: any) => {
  const {
    filteredLength,
    $pageLimit,
    visible,
    onSetVisible,
    onLoadMoreEvent,
    onSearchEvent,
    onLoadMoreFiltersEvent,
    onClearSearch,
    pagesSet,
    filterLoading,
    totalPages,
  } = useContext(PagesContext);

  const onRenderPageItem = useCallback(
    (index: number) => {
      const page = pagesSet[index];
      return <Page key={`pages-${page.id}`} page={page} />;
    },
    [pagesSet]
  );

  useImperativeHandle(
    ref,
    () => {
      return {
        onSetVisible,
      };
    },
    [onSetVisible]
  );

  // TODO: fix filtered total
  const canPaginateForward = pagesSet.length >= $pageLimit.limit * ($pageLimit.page || 1);
  const paginateTotalBlock = !totalPages ? true : pagesSet.length === totalPages;

  return (
    <div className={`${visible ? 'visible' : 'hidden'} py-3`}>
      <form onSubmit={onSearchEvent} className="pb-3 space-y-1" noValidate>
        <Label htmlFor={`search-${domain}`} className="sr-only">
          Search
        </Label>
        <div className="relative flex place-items-center">
          <Input
            id={`search-${domain}`}
            name={'search'}
            type="text"
            placeholder={`Search...`}
            className={filteredLength ? 'pr-20' : undefined}
          />
          {filterLoading ? (
            <LoaderIcon
              className={`absolute ${filteredLength ? 'right-16' : 'right-2'} text-blue-500`}
            />
          ) : null}
          <Button
            type="button"
            onClick={onClearSearch}
            className={`absolute right-1 ${filteredLength ? '' : ' hidden'} text-blue-500`}
            variant={'ghost'}
            size={'sm'}
          >
            Clear
          </Button>
        </div>
        <button type="submit" className="sr-only">
          Submit
        </button>
      </form>

      <div className={`relative px-2`}>
        <div
          className={`absolute right-[16px] left-[5px] h-1 top-0 rounded-lg bg-gradient-to-t from-white via-gray-400 to-gray-800 opacity-10 blur`}
        />
        <ul>
          <Virtuoso
            style={{ height: '20rem' }}
            className={`max-h-[20rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-900 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-100 dark:scrollbar-track-gray-900`}
            aria-hidden={!visible}
            totalCount={pagesSet?.length || 0}
            itemContent={onRenderPageItem}
            components={{
              Footer: () =>
                !paginateTotalBlock && canPaginateForward ? (
                  <Button
                    type="button"
                    onClick={filteredLength ? onLoadMoreFiltersEvent : onLoadMoreEvent}
                  >
                    Load More
                  </Button>
                ) : null,
            }}
          />
        </ul>
        <div
          className={`absolute right-[16px] left-[5px] h-1 dark:h-2 bottom-0 rounded-lg bg-gradient-to-b from-black via-gray-500 to-gray-200 dark:from-white dark:via-gray-100 dark:to-gray-900 opacity-20 dark:opacity-10 blur`}
        />
      </div>
    </div>
  );
};

export const Pages = forwardRef(PagesBase);
