export interface MeloampAPI {
  sendPlaybackInfo: (info: any) => void;
  sendPosition: (position: number) => void;
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
