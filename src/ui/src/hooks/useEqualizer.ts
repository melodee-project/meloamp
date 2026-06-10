import { MutableRefObject, useEffect, useRef, useState } from 'react';

export const EQ_BANDS = [60, 170, 350, 1000, 3500, 10000] as const;

interface UseEqualizerDeps {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  src: string;
}

const STORAGE_KEY = 'userSettings';

const loadPersistedGains = (): number[] => {
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (Array.isArray(settings.equalizerGains) && settings.equalizerGains.length === EQ_BANDS.length) {
      return settings.equalizerGains;
    }
  } catch { /* noop */ }
  return Array(EQ_BANDS.length).fill(0);
};

const persistGains = (gains: number[]): void => {
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    settings.equalizerGains = gains;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('userSettingsChanged', { detail: settings }));
  } catch { /* noop */ }
};

export function useEqualizer({ audioRef, src }: UseEqualizerDeps) {
  const [eqGains, setEqGains] = useState<number[]>(() => loadPersistedGains());
  const audioCtx = useRef<AudioContext | null>(null);
  const sourceNode = useRef<MediaElementAudioSourceNode | null>(null);
  const eqNodes = useRef<BiquadFilterNode[]>([]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (!audioCtx.current) audioCtx.current = new window.AudioContext();
    if (!sourceNode.current) {
      try {
        sourceNode.current = audioCtx.current.createMediaElementSource(audioRef.current);
      } catch { /* already connected */ }
    }
    return () => {
      eqNodes.current.forEach((node) => node.disconnect());
    };
  }, [audioRef]);

  useEffect(() => {
    if (!audioRef.current || !audioCtx.current || !sourceNode.current) return;
    eqNodes.current.forEach((node) => node.disconnect());
    eqNodes.current = EQ_BANDS.map((freq, i) => {
      const filter = audioCtx.current!.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.gain.value = eqGains[i];
      filter.Q.value = 1;
      return filter;
    });
    let prev: AudioNode = sourceNode.current;
    eqNodes.current.forEach((node) => {
      prev.connect(node);
      prev = node;
    });
    prev.connect(audioCtx.current.destination);
    eqNodes.current.forEach((node, i) => { node.gain.value = eqGains[i]; });
    return () => { eqNodes.current.forEach((node) => node.disconnect()); };
  }, [audioRef, src, eqGains]);

  useEffect(() => {
    persistGains(eqGains);
  }, [eqGains]);

  return { eqGains, setEqGains };
}
