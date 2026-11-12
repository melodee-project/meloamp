/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Preferred API base URL override for Vite builds. */
  readonly VITE_API_URL?: string;
  /** Backwards-compatible override kept from the CRA era. */
  readonly REACT_APP_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
