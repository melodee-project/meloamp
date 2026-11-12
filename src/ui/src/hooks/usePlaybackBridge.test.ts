import { act, renderHook } from '@testing-library/react';
import { MutableRefObject } from 'react';

import { usePlaybackBridge } from './usePlaybackBridge';

type Handler = (_event: unknown, command: string, ...args: unknown[]) => void;

describe('usePlaybackBridge', () => {
  const handlers = new Map<string, Handler>();
  const removed: string[] = [];

  const audioRef = { current: null } as MutableRefObject<HTMLAudioElement | null>;

  beforeEach(() => {
    handlers.clear();
    removed.length = 0;
    (window as unknown as { electron: unknown }).electron = {
      versions: {},
      ipcRenderer: {
        on: (channel: string, handler: Handler) => handlers.set(channel, handler),
        removeListener: (channel: string) => removed.push(channel),
      },
    };
  });

  afterEach(() => {
    delete (window as unknown as { electron?: unknown }).electron;
  });

  const setup = () => {
    const onTogglePlay = jest.fn();
    const onNext = jest.fn();
    const onPrevious = jest.fn();
    const onStop = jest.fn();
    const onSeekTo = jest.fn();
    const onSeekBy = jest.fn();

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
    expect([...handlers.keys()].sort()).toEqual(['meloamp-media-key', 'meloamp-mpris-control']);

    view.unmount();
    expect(removed.sort()).toEqual(['meloamp-media-key', 'meloamp-mpris-control']);
  });

  test('treats MPRIS seek/position payloads as seconds (no double conversion)', () => {
    const { onSeekBy, onSeekTo } = setup();

    act(() => handlers.get('meloamp-mpris-control')?.(null, 'seek', 5));
    expect(onSeekBy).toHaveBeenCalledWith(5);

    act(() => handlers.get('meloamp-mpris-control')?.(null, 'position', 12.5));
    expect(onSeekTo).toHaveBeenCalledWith(12.5);
  });

  test('ignores non-numeric seek payloads and unknown commands', () => {
    const { onSeekBy, onSeekTo, onNext } = setup();

    act(() => handlers.get('meloamp-mpris-control')?.(null, 'seek', 'nope'));
    act(() => handlers.get('meloamp-mpris-control')?.(null, 'position', undefined));
    act(() => handlers.get('meloamp-mpris-control')?.(null, 'unknown-command'));
    expect(onSeekBy).not.toHaveBeenCalled();
    expect(onSeekTo).not.toHaveBeenCalled();

    act(() => handlers.get('meloamp-mpris-control')?.(null, 'next'));
    expect(onNext).toHaveBeenCalled();
  });

  test('maps media keys to playback actions', () => {
    const { onTogglePlay, onNext, onPrevious, onStop } = setup();

    act(() => handlers.get('meloamp-media-key')?.(null, 'playPause'));
    act(() => handlers.get('meloamp-media-key')?.(null, 'next'));
    act(() => handlers.get('meloamp-media-key')?.(null, 'previous'));
    act(() => handlers.get('meloamp-media-key')?.(null, 'stop'));
    act(() => handlers.get('meloamp-media-key')?.(null, 'bogus'));

    expect(onTogglePlay).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  test('does nothing when the Electron bridge is unavailable', () => {
    delete (window as unknown as { electron?: unknown }).electron;
    expect(() => setup()).not.toThrow();
    expect(handlers.size).toBe(0);
  });
});
