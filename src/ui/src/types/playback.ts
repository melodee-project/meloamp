/**
 * Playback types shared by the queue store, the settings store, and the player.
 *
 * `RepeatMode` lives here (rather than in `queueStore`) so that `types/settings.ts`
 * and `settings.ts` can depend on it without creating an import cycle.
 */
export enum RepeatMode {
  OFF = 'off',
  ALL = 'all',
  ONE = 'one',
}

const REPEAT_MODES = new Set<string>(Object.values(RepeatMode));

export function isRepeatMode(value: unknown): value is RepeatMode {
  return typeof value === 'string' && REPEAT_MODES.has(value);
}
