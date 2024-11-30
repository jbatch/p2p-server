// example/src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_SESSION_STORAGE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
