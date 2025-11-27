const readEnv = (key: keyof ImportMetaEnv) => {
  const value = import.meta.env[key]
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

const readNumber = (key: keyof ImportMetaEnv, fallback: number) => {
  const raw = readEnv(key)
  if (!raw) {
    return fallback
  }
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const API_BASE_URL = readEnv('VITE_API_BASE_URL')
export const API_TIMEOUT = readNumber('VITE_API_TIMEOUT_MS', 10000)

export const TOTEM_USERNAME = readEnv('VITE_TOTEM_USERNAME')
export const TOTEM_PASSWORD = readEnv('VITE_TOTEM_PASSWORD')
export const TOTEM_EMPRESA = readEnv('VITE_TOTEM_EMPRESA')

export const IS_API_CONFIGURED = API_BASE_URL.length > 0
export const PANEL_WS_URL = readEnv('VITE_PANEL_WS_URL')

