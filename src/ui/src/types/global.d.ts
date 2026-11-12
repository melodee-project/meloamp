export interface MediaKeyConfig {
  playPause?: string;
  next?: string;
  previous?: string;
  stop?: string;
}

export interface TrayNowPlaying {
  title?: string;
  artist?: string;
  playing?: boolean;
}

export interface PlaybackInfo {
  trackId?: string;
  length: number;
  artUrl: string;
  title: string;
  album: string | { name?: string };
  artist: string | { name?: string } | { name?: string; imageUrl?: string }[];
  status: 'Playing' | 'Paused' | 'Stopped';
  position: number;
}

export interface MeloampAPI {
  sendPlaybackInfo: (info: PlaybackInfo) => void;
  sendPosition: (position: number) => void;
  checkForUpdates: () => void;
  updateMediaKeys: (config: MediaKeyConfig) => void;
  getMediaKeys: () => Promise<MediaKeyConfig>;
  updateTray: (nowPlaying: TrayNowPlaying | null) => void;
  openExternal: (url: string) => Promise<boolean>;
}

export interface ElectronAPI {
  versions: NodeJS.ProcessVersions;
  ipcRenderer: {
    // IPC payloads are untyped at the process boundary; every consumer narrows them.
    on: (channel: string, callback: (...args: any[]) => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
  };
}

declare global {
  interface Window {
    meloampAPI: MeloampAPI;
    electron: ElectronAPI;
  }
}
