import { act, renderHook, waitFor } from '@testing-library/react';
import { useApiEffect } from './useApiEffect';

describe('useApiEffect', () => {
  test('runs the effect and aborts on unmount', async () => {
    let seenSignal: AbortSignal | undefined;
    const { unmount } = renderHook(() =>
      useApiEffect(async (signal) => {
        seenSignal = signal;
        await Promise.resolve();
      }, []));

    await waitFor(() => expect(seenSignal).toBeDefined());
    expect(seenSignal?.aborted).toBe(false);

    unmount();
    expect(seenSignal?.aborted).toBe(true);
  });

  test('re-runs and aborts the previous signal when deps change', async () => {
    const signals: AbortSignal[] = [];
    const { rerender } = renderHook(
      ({ page }) => useApiEffect(async (signal) => {
        signals.push(signal);
      }, [page]),
      { initialProps: { page: 1 } },
    );

    await waitFor(() => expect(signals).toHaveLength(1));

    rerender({ page: 2 });
    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  test('ignores cancellation errors and logs real failures', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderHook(() => useApiEffect(async () => {
      throw Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' });
    }, []));
    await act(async () => Promise.resolve());

    renderHook(() => useApiEffect(async () => {
      throw new Error('real failure');
    }, []));
    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith(
      '[useApiEffect] Unhandled effect error:',
      expect.any(Error),
    ));

    errorSpy.mockRestore();
  });
});
