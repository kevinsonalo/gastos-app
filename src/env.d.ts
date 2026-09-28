/// <reference types="vite/client" />

/** Variables de entorno de la app (archivo `.env.local`, ver `.env.example`). */
interface ImportMetaEnv {
  /** 'api' para usar el backend .NET; vacío o 'local' para localStorage. */
  readonly VITE_DATA_SOURCE?: string
  /** URL base de la API. Por defecto http://localhost:5080 */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
