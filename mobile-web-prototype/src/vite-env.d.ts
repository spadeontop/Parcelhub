/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly HANDOFF_CUTOFF_TIME_MINS?: string;
  readonly VITE_HANDOFF_CUTOFF_TIME_MINS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
