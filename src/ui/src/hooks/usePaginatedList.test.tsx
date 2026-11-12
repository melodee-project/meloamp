import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import MockAdapter from 'axios-mock-adapter';

import api from '../api';
import { testI18n } from '../test/testUtils';
import { usePaginatedList } from './usePaginatedList';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
);

describe('usePaginatedList', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  test('loads items and pagination metadata from the envelope', async () => {
    mock.onGet('/albums').reply(200, {
      data: [{ id: 'a1' }],
      meta: { totalCount: 42, pageSize: 20, currentPage: 1, totalPages: 3, hasNext: true, hasPrevious: false },
    });

    const { result } = renderHook(() => usePaginatedList<{ id: string }>({ path: '/albums' }), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([{ id: 'a1' }]);
    expect(result.current.total).toBe(42);
    expect(result.current.meta?.totalPages).toBe(3);
  });

  test('supports bare-array responses', async () => {
    mock.onGet('/songs').reply(200, [{ id: 's1' }, { id: 's2' }]);

    const { result } = renderHook(() => usePaginatedList<{ id: string }>({ path: '/songs' }), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(2);
    expect(result.current.total).toBe(2);
  });

  test('surfaces errors and can be disabled', async () => {
    mock.onGet('/broken').reply(500, { message: 'nope' });

    const { result, rerender } = renderHook(
      ({ enabled }) => usePaginatedList<{ id: string }>({ path: '/broken', enabled }),
      { wrapper, initialProps: { enabled: true } },
    );

    await waitFor(() => expect(result.current.error).toBe('nope'));

    rerender({ enabled: false });
    expect(result.current.error).toBe('nope');
  });

  test('setPage clamps to at least one', async () => {
    mock.onGet('/items').reply(200, []);
    const { result } = renderHook(() => usePaginatedList<{ id: string }>({ path: '/items' }), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    result.current.setPage(-5);
    await waitFor(() => expect(result.current.page).toBe(1));
  });
});
