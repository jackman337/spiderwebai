import { useState, createContext, type SyntheticEvent, FC, PropsWithChildren } from 'react';
import { useStore } from '@nanostores/react';
import { supabase } from '@/lib/supabase';
import { pagePaginationLimit, websites, type PagesStore, type WebPage } from '@/stores/my';
import { toast } from 'spiderwebai-components/react/components/ui/use-toast';

type PagesProps = {
  totalPages: number;
  pages: PagesStore;
  domain: string;
  userID: string;
};

export const usePages = ({ pages, domain, totalPages, userID }: PagesProps) => {
  const $pages = useStore(pages);
  const $pageLimit = useStore(pagePaginationLimit);

  const [visible, setVisible] = useState<boolean>(false);
  const [filterLoading, setFilterLoading] = useState<boolean>(false);

  const [filteredPagesList, setFiltered] = useState<WebPage[]>([]);
  const [filteredPageIndex, setFilteredIndex] = useState<number>(1);

  const pagesList = Object.values($pages);

  const pageLength = pagesList?.length || 0;
  const filteredLength = filteredPagesList?.length || 0;
  const pagesSet = filteredLength ? filteredPagesList : pagesList;

  const onLoadMoreEvent = async (_?: any, _page?: number) => {
    const website = websites.get()[domain];

    if (website) {
      const _currentPage = _page ?? $pageLimit.page;
      const nextPage = _currentPage + 1;
      // bump the next page
      pagePaginationLimit.set({ limit: $pageLimit.limit, page: nextPage });

      const pageFrom = $pageLimit.limit * _currentPage;
      const pageTo = $pageLimit.limit * nextPage;

      // small records limit to 1k TODO: pagination
      const { data: pagesData, count } = await supabase
        .from('pages')
        .select('*', { count: 'exact', head: false })
        .eq('domain', domain)
        .range(pageFrom, pageTo)
        .limit($pageLimit.limit);

      if (pagesData && pagesData.length) {
        for (const page of pagesData) {
          website?.pages.setKey(page.url, page);
        }
      }

      if (count && website.totalPages < count) {
        website.totalPages = count;
      }
    }
  };

  const onSearchEvent = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { search } = Object.fromEntries(formData);

    setFilterLoading(true);
    let { data } = await supabase
      .from('pages')
      .select()
      .eq('user_id', userID)
      .eq('domain', domain)
      .textSearch('fts', `${search} | '/${search}'`, {
        type: 'websearch',
        config: 'english',
      });

    if (!data || (data && !data.length)) {
      const { data: nd } = await supabase
        .from('pages')
        .select()
        .eq('user_id', userID)
        .eq('domain', domain)
        .like('url', `%${search}%`);

      if (data) {
        data = nd;
      }
    }

    setFiltered(data || []);
    setFilteredIndex(1);
    setFilterLoading(false);
  };

  const onLoadMoreFiltersEvent = async (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const element = document.getElementById(`search-${domain}`) as HTMLInputElement;

    if (element) {
      const nextPage = filteredPageIndex + 1;
      setFilterLoading(true);

      const search = element.value;
      let { data } = await supabase
        .from('pages')
        .select()
        .eq('domain', domain)
        .eq('user_id', userID)
        .range($pageLimit.limit * nextPage, $pageLimit.limit * (nextPage + 1))
        .textSearch('fts', `${search} | '/${search}'`, {
          type: 'websearch',
          config: 'english',
        });

      if (!data || (data && !data.length)) {
        const { data: nd } = await supabase
          .from('pages')
          .select()
          .eq('user_id', userID)
          .eq('domain', domain)
          .like('url', `%${search}%`)
          .range($pageLimit.limit * nextPage, $pageLimit.limit * (nextPage + 1));

        if (data) {
          data = nd;
        }
      }

      if (data) {
        setFiltered(data || []);
        setFilteredIndex(nextPage);
      } else {
        toast({
          title: 'No more pages left.',
          description: '',
        });
      }

      setFilterLoading(false);
    }
  };

  const onClearSearch = () => {
    setFiltered([]);
    setFilteredIndex(1);
  };

  const onSetVisible = async () => {
    if (!Object.keys($pages ?? {}).length) {
      await onLoadMoreEvent(undefined, 0);
    }
    setVisible((x) => !x);
  };

  const _totalPagesDisplay = Math.max(pageLength, totalPages);
  const pageCounterDisplay = `${pageLength} ${
    _totalPagesDisplay < $pageLimit.limit
      ? ''
      : `- ${Math.min($pageLimit.limit, _totalPagesDisplay) * $pageLimit.page}`
  } of ${_totalPagesDisplay}`;

  return {
    pageCounterDisplay,
    onClearSearch,
    onLoadMoreFiltersEvent,
    onSearchEvent,
    onSetVisible,
    onLoadMoreEvent,
    filterLoading,
    filteredLength,
    pagesSet,
    totalPages,
    visible,
    $pageLimit,
    $pages,
  };
};

export const PagesContext = createContext({} as ReturnType<typeof usePages>);

export const PagesProvider: FC<PropsWithChildren<PagesProps>> = ({
  pages,
  domain,
  totalPages,
  userID,
  children,
}) => {
  const data = usePages({ pages, domain, totalPages, userID });

  return <PagesContext.Provider value={data}>{children}</PagesContext.Provider>;
};
