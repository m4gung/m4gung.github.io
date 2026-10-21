/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEOCODER_URL?: string;
  readonly VITE_GEOCODER_COUNTRYCODES?: string;
  readonly VITE_GEOCODER_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
