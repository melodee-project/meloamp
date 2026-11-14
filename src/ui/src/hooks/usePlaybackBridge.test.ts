import { act, renderHook } from '@testing-library/react';
import { MutableRefObject } from 'react';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';

import { usePlaybackBridge } from './usePlaybackBridge';

const preloadSource = readFileSync(resolve('../electron/preload.js'), 'utf8');

describe('usePlaybackBridge', () => {
  let rawIpc: EventEmitter;
  const emit = (channel: string, ...payload: unknown[]) => {
    // Exercise the real preload boundary, including removal of Electron's event.
    rawIpc.emit(channel, { sender: 'main' }, ...payload);
  };

  const audioRef = { current: null } as MutableRefObject<HTMLAudioElement | null>;

  beforeEach(() => {
    rawIpc = new EventEmitter();
    runInNewContext(preloadSource, {
      process: { versions: {} },
      require: () => ({
        ipcRenderer: rawIpc,
        contextBridge: {
          exposeInMainWorld: (name: string, value: unknown) => {
            (window as unknown as Record<string, unknown>)[name] = value;
          },
        },
      }),
    });
  });

  afterEach(() => {
    delete (window as unknown as { electron?: unknown }).electron;
    delete (window as unknown as { meloampAPI?: unknown }).meloampAPI;
  });

  const setup = () => {
    const onTogglePlay = vi.fn();
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const onStop = vi.fn();
    const onSeekTo = vi.fn();
    const onSeekBy = vi.fn();

    const view = renderHook(() => usePlaybackBridge({
      audioRef,
      onTogglePlay,
      onNext,
      onPrevious,
      onStop,
      onSeekTo,
      onSeekBy,
    }));

    return { view, onTogglePlay, onNext, onPrevious, onStop, onSeekTo, onSeekBy };
  };

  test('registers only the allowlisted IPC channels and cleans up', () => {
    const { view } = setup();
    expect(rawIpc.eventNames().sort()).toEqual(['meloamp-media-key', 'meloamp-mpris-control']);

    view.unmount();
    expect(rawIpc.eventNames()).toEqual([]);
  });

  test('treats MPRIS seek/position payloads as seconds (no double conversion)', () => {
    const { onSeekBy, onSeekTo } = setup();

    act(() => emit('meloamp-mpris-control', 'seek', 5));
    expect(onSeekBy).toHaveBeenCalledWith(5);

    act(() => emit('meloamp-mpris-control', 'position', 12.5));
    expect(onSeekTo).toHaveBeenCalledWith(12.5);
  });

  test('ignores non-numeric seek payloads and unknown commands', () => {
    const { onSeekBy, onSeekTo, onNext } = setup();

    act(() => emit('meloamp-mpris-control', 'seek', 'nope'));
    act(() => emit('meloamp-mpris-control', 'position', undefined));
    act(() => emit('meloamp-mpris-control', 'unknown-command'));
    expect(onSeekBy).not.toHaveBeenCalled();
    expect(onSeekTo).not.toHaveBeenCalled();

    act(() => emit('meloamp-mpris-control', 'next'));
    expect(onNext).toHaveBeenCalled();
  });

  test('maps media keys to playback actions', () => {
    const { onTogglePlay, onNext, onPrevious, onStop } = setup();

    act(() => emit('meloamp-media-key', 'playPause'));
    act(() => emit('meloamp-media-key', 'next'));
    act(() => emit('meloamp-media-key', 'previous'));
    act(() => emit('meloamp-media-key', 'stop'));
    act(() => emit('meloamp-media-key', 'bogus'));

    expect(onTogglePlay).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  test('does nothing when the Electron bridge is unavailable', () => {
    delete (window as unknown as { electron?: unknown }).electron;
    expect(() => setup()).not.toThrow();
    expect(rawIpc.eventNames()).toEqual([]);
  });
});
