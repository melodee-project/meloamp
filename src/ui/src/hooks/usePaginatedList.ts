import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import api, { unwrapApiPage } from '../api';
import { Meta } from '../apiModels';
import { useApiEffect } from './useApiEffect';
import { getErrorMessage } from '../utils/errors';

export interface PaginatedListState<T> {
  items: T[];
  meta?: Meta;
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  reload: () => void;
}

interface UsePaginatedListOptions {
  /** Endpoint path (from `apiRoutes` where available). */
  path: string;
  /** Extra query parameters (sorting, filters, ...). */
  params?: Record<string, string | number | boolean | undefined>;
  pageSize?: number;
  /** Set false to skip the request (e.g. inactive tab). */
  enabled?: boolean;
}

/**
 * Shared list-page data loader.
 *
 * Replaces the hand-rolled `useEffect` + `api.get` + `res.data.data` pattern
 * that was duplicated across every browse page. Handles envelope unwrapping,
 * pagination metadata, cancellation on unmount/param change, and error copy.
 */
export function usePaginatedList<T>({
  path,
  params,
  pageSize = 20,
  enabled = true,
}: UsePaginatedListOptions): PaginatedListState<T> {
  const { t } = useTranslation();
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>(undefined);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params ?? {});

  useApiEffect(async (signal) => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const query = { page, pageSize, ...(params ?? {}) };
      const response = await api.get<unknown>(path, { params: query, signal });
      const result = unwrapApiPage<T>(response.data);
      if (signal.aborted) return;
      setItems(result.items);
      setMeta(result.meta);
      setTotal(result.meta?.totalCount ?? result.items.length);
    } catch (err) {
      if (signal.aborted) return;
      setError(getErrorMessage(err, t('error.generic', 'Something went wrong')));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [path, page, pageSize, paramsKey, enabled, reloadToken, t]);

  const setPage = useCallback((next: number) => {
    setPageState(Math.max(1, Math.floor(next)));
  }, []);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return useMemo(
    () => ({ items, meta, total, page, pageSize, loading, error, setPage, reload }),
    [items, meta, total, page, pageSize, loading, error, setPage, reload],
  );
}
