export interface MeloampAPI {
  sendPlaybackInfo: (info: any) => void;
}

export interface ElectronAPI {
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

