/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_DATA_BASE_URL: string
  readonly VITE_LEAGUES_URL?: string
  readonly VITE_SPORTS_URL?: string
  readonly VITE_HOME_SCREEN_LAYOUT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
