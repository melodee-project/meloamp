import { RepeatMode } from '../queueStore';

export interface UserSettings {
  theme: string;
  language: string;
  highContrast: boolean;
  fontScale: number;
  caching: boolean;
  mode: 'light' | 'dark';
  repeatMode?: RepeatMode;
  shuffleEnabled?: boolean;
  equalizerGains?: number[];
  dashboardRecentLimit?: number;
}

export type SettingsUpdater = (settings: UserSettings) => void;
