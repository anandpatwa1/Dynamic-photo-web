import { useCallback, useMemo, useState } from 'react';

/**
 * Owns the query state for a list page — pagination, search, sorting and
 * arbitrary filters — and exposes setters that reset the page whenever the
 * result set changes shape (otherwise you land on an empty page 4).
 */
export const useListQuery = ({ limit = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = {}) => {
  const [query, setQuery] = useState({
    page: 1,
    limit,
    search: '',
    sortBy,
    sortOrder,
    ...filters,
  });

  const setPage = useCallback((page) => setQuery((prev) => ({ ...prev, page })), []);

  const setLimit = useCallback(
    (nextLimit) => setQuery((prev) => ({ ...prev, limit: nextLimit, page: 1 })),
    [],
  );

  const setSearch = useCallback(
    (search) => setQuery((prev) => ({ ...prev, search, page: 1 })),
    [],
  );

  const setSort = useCallback(
    ({ sortBy: field, sortOrder: direction }) =>
      setQuery((prev) => ({ ...prev, sortBy: field, sortOrder: direction, page: 1 })),
    [],
  );

  const setFilter = useCallback(
    (key, value) =>
      setQuery((prev) => ({
        ...prev,
        // An empty value clears the filter rather than sending `?status=`.
        [key]: value === '' || value == null ? undefined : value,
        page: 1,
      })),
    [],
  );

  const reset = useCallback(
    () => setQuery({ page: 1, limit, search: '', sortBy, sortOrder, ...filters }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [limit, sortBy, sortOrder],
  );

  /** Strips empty values so the request URL stays clean. */
  const params = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
      ),
    [query],
  );

  const activeFilterCount = useMemo(
    () =>
      Object.entries(query).filter(
        ([key, value]) =>
          !['page', 'limit', 'search', 'sortBy', 'sortOrder'].includes(key) &&
          value !== undefined &&
          value !== '',
      ).length,
    [query],
  );

  return {
    query,
    params,
    sort: { sortBy: query.sortBy, sortOrder: query.sortOrder },
    activeFilterCount,
    setPage,
    setLimit,
    setSearch,
    setSort,
    setFilter,
    reset,
  };
};
