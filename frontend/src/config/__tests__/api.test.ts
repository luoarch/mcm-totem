import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('api config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads configuration from environment variables', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
    vi.stubEnv('VITE_API_TIMEOUT_MS', '5000')
    vi.stubEnv('VITE_TOTEM_USERNAME', 'totem-user')
    vi.stubEnv('VITE_TOTEM_PASSWORD', 'secret')
    vi.stubEnv('VITE_TOTEM_EMPRESA', 'empresa-x')
    vi.stubEnv('VITE_PANEL_WS_URL', 'wss://panel.example.com')

    const config = await import('../api')

    expect(config.API_BASE_URL).toBe('https://api.example.com')
    expect(config.API_TIMEOUT).toBe(5000)
    expect(config.TOTEM_USERNAME).toBe('totem-user')
    expect(config.TOTEM_PASSWORD).toBe('secret')
    expect(config.TOTEM_EMPRESA).toBe('empresa-x')
    expect(config.PANEL_WS_URL).toBe('wss://panel.example.com')
    expect(config.IS_API_CONFIGURED).toBe(true)
  })

  it('falls back to defaults when variables are missing or blank', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '   ')
    vi.stubEnv('VITE_API_TIMEOUT_MS', '')
    vi.stubEnv('VITE_TOTEM_USERNAME', '')
    vi.stubEnv('VITE_TOTEM_PASSWORD', '')
    vi.stubEnv('VITE_TOTEM_EMPRESA', '')
    vi.stubEnv('VITE_PANEL_WS_URL', '')

    const config = await import('../api')

    expect(config.API_BASE_URL).toBe('')
    expect(config.API_TIMEOUT).toBe(10000)
    expect(config.TOTEM_USERNAME).toBe('')
    expect(config.TOTEM_PASSWORD).toBe('')
    expect(config.TOTEM_EMPRESA).toBe('')
    expect(config.PANEL_WS_URL).toBe('')
    expect(config.IS_API_CONFIGURED).toBe(false)
  })

  it('handles undefined and invalid numeric env values', async () => {
    vi.stubEnv('VITE_TOTEM_USERNAME', undefined as unknown as string)
    vi.stubEnv('VITE_TOTEM_PASSWORD', undefined as unknown as string)
    vi.stubEnv('VITE_TOTEM_EMPRESA', undefined as unknown as string)
    vi.stubEnv('VITE_API_TIMEOUT_MS', '0')

    const config = await import('../api')

    expect(config.TOTEM_USERNAME).toBe('')
    expect(config.TOTEM_PASSWORD).toBe('')
    expect(config.TOTEM_EMPRESA).toBe('')
    expect(config.API_TIMEOUT).toBe(10000)
  })
})

