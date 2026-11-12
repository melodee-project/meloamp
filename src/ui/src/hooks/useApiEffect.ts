import { useEffect, useRef } from 'react';

import { isCanceledError } from '../utils/errors';

/**
 * Run an async effect that is cancelled when its dependencies change or the
 * component unmounts.
 *
 * The effect receives an `AbortSignal` that should be forwarded to axios
 * (`api.get(url, { signal })`). Aborted requests are ignored, so call sites no
 * longer need manual `let cancelled = false` bookkeeping — and no state updates
 * happen after unmount.
 *
 * @example
 * useApiEffect(async (signal) => {
 *   const res = await api.get('/albums', { signal });
 *   setAlbums(unwrapApiPage<Album>(res.data).items);
 * }, [page]);
 */
export function useApiEffect(
  effect: (signal: AbortSignal) => Promise<void> | void,
  deps: readonly unknown[],
): void {
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        await effectRef.current(controller.signal);
      } catch (error) {
        if (!controller.signal.aborted && !isCanceledError(error)) {
          // Surface unexpected failures; call sites that expect errors handle
          // them inside the effect and never reach this branch.
          console.error('[useApiEffect] Unhandled effect error:', error);
        }
      }
    };
    void run();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
