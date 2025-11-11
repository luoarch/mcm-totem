export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10000)

export const TOTEM_USERNAME = import.meta.env.VITE_TOTEM_USERNAME ?? ''
export const TOTEM_PASSWORD = import.meta.env.VITE_TOTEM_PASSWORD ?? ''

export const IS_API_CONFIGURED = API_BASE_URL.trim().length > 0
export const PANEL_WS_URL = import.meta.env.VITE_PANEL_WS_URL ?? ''

