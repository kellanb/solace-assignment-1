import {
  useInfiniteQuery,
  type InfiniteData,
  type QueryFunctionContext,
} from "@tanstack/react-query";
import {
  fetchAdvocatesPage,
  type AdvocateQueryParams,
  type AdvocateResponse,
} from "@/lib/advocates";

export type AdvocateFilters = Omit<
  AdvocateQueryParams,
  "page" | "pageSize"
> & {
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 20;

/**
 * Infinite query wrapper that fetches advocates page-by-page.
 * The key includes all filters so caching/deduping works automatically.
 */
type AdvocatesQueryKey = ["advocates", AdvocateFilters];

export function useAdvocatesQuery(filters: AdvocateFilters) {
  return useInfiniteQuery<
    AdvocateResponse,
    Error,
    InfiniteData<AdvocateResponse, number>,
    AdvocatesQueryKey,
    number
  >({
    queryKey: ["advocates", filters],
    queryFn: ({ pageParam = 1, signal }: QueryFunctionContext<AdvocatesQueryKey, number>) =>
      fetchAdvocatesPage(
        {
          ...filters,
          page: pageParam,
          pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
        },
        signal
      ),
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta.hasNextPage) return undefined;
      return lastPage.meta.page + 1;
    },
    initialPageParam: 1,
    staleTime: 1000 * 30,
  });
}
