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

export interface MeloampAPI {
  sendPlaybackInfo: (info: any) => void;
  sendPosition: (position: number) => void;
  checkForUpdates: () => void;
  updateMediaKeys: (config: MediaKeyConfig) => void;
  getMediaKeys: () => Promise<MediaKeyConfig>;
  updateTray: (nowPlaying: TrayNowPlaying | null) => void;
}

export interface ElectronAPI {
  versions: any;
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
    removeListener: (channel: string, listener: (...args: any[]) => void) => void;
  };
}

declare global {
  interface Window {
    meloampAPI?: MeloampAPI;
    electron?: ElectronAPI;
  }
}
