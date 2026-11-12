import { MutableRefObject, useEffect, useRef, useState } from 'react';

import { EQUALIZER_BAND_COUNT } from '../types/settings';
import { readUserSettings, updateUserSettings } from '../settings';

export const EQ_BANDS = [60, 170, 350, 1000, 3500, 10000] as const;

interface UseEqualizerDeps {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  src: string;
}

const clampGain = (value: number): number => Math.min(12, Math.max(-12, value));

const loadPersistedGains = (): number[] => {
  const gains = readUserSettings().equalizerGains;
  if (Array.isArray(gains) && gains.length === EQ_BANDS.length) {
    return gains.map((gain) => clampGain(gain));
  }
  return Array(EQ_BANDS.length).fill(0);
};

const persistGains = (gains: number[]): void => {
  updateUserSettings({ equalizerGains: gains.map((gain) => clampGain(gain)) });
};

export function useEqualizer({ audioRef, src }: UseEqualizerDeps) {
  const [eqGains, setEqGains] = useState<number[]>(loadPersistedGains);
  const audioCtx = useRef<AudioContext | null>(null);
  const sourceNode = useRef<MediaElementAudioSourceNode | null>(null);
  const eqNodes = useRef<BiquadFilterNode[]>([]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (!audioCtx.current) audioCtx.current = new window.AudioContext();
    if (!sourceNode.current) {
      try {
        sourceNode.current = audioCtx.current.createMediaElementSource(audioRef.current);
      } catch {
        /* already connected */
      }
    }
  }, [audioRef]);

  useEffect(() => {
    const context = audioCtx.current;
    const source = sourceNode.current;
    if (!audioRef.current || !context || !source) return;

    // Resume a suspended context (autoplay policies) so EQ does not mute audio.
    if (context.state === 'suspended') {
      void context.resume().catch(() => undefined);
    }

    eqNodes.current.forEach((node) => node.disconnect());
    eqNodes.current = EQ_BANDS.map((frequency, index) => {
      const filter = context.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = frequency;
      filter.gain.value = eqGains[index];
      filter.Q.value = 1;
      return filter;
    });

    let previous: AudioNode = source;
    eqNodes.current.forEach((node) => {
      previous.connect(node);
      previous = node;
    });
    previous.connect(context.destination);

    return () => {
      eqNodes.current.forEach((node) => node.disconnect());
    };
  }, [audioRef, src, eqGains]);

  useEffect(() => {
    persistGains(eqGains);
  }, [eqGains]);

  return { eqGains, setEqGains, bandCount: EQUALIZER_BAND_COUNT };
}
