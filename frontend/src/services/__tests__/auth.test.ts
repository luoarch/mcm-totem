import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type ConfigState = {
  API_BASE_URL: string
  API_TIMEOUT: number
  IS_API_CONFIGURED: boolean
  TOTEM_PASSWORD: string
  TOTEM_USERNAME: string
  TOTEM_EMPRESA: string
}

const CONFIG_DEFAULTS: ConfigState = {
  API_BASE_URL: 'https://api.example.com',
  API_TIMEOUT: 5000,
  IS_API_CONFIGURED: true,
  TOTEM_PASSWORD: 'secret',
  TOTEM_USERNAME: 'totem-user',
  TOTEM_EMPRESA: '0001',
}

let configState: ConfigState = { ...CONFIG_DEFAULTS }
const axiosPostMock = vi.fn()

vi.mock('../../config/api', () => ({
  get API_BASE_URL() {
    return configState.API_BASE_URL
  },
  get API_TIMEOUT() {
    return configState.API_TIMEOUT
  },
  get IS_API_CONFIGURED() {
    return configState.IS_API_CONFIGURED
  },
  get TOTEM_PASSWORD() {
    return configState.TOTEM_PASSWORD
  },
  get TOTEM_USERNAME() {
    return configState.TOTEM_USERNAME
  },
  get TOTEM_EMPRESA() {
    return configState.TOTEM_EMPRESA
  },
}))

vi.mock('axios', () => ({
  default: {
    post: (...args: unknown[]) => axiosPostMock(...args),
  },
}))

const loadAuthModule = () => import('../auth')

beforeEach(() => {
  configState = { ...CONFIG_DEFAULTS }
  axiosPostMock.mockReset()
  vi.resetModules()
  vi.useRealTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('auth service', () => {
  it('returns null when API is not configured', async () => {
    configState.IS_API_CONFIGURED = false
    const { ensureTotemSession } = await loadAuthModule()

    const token = await ensureTotemSession()

    expect(token).toBeNull()
    expect(axiosPostMock).not.toHaveBeenCalled()
  })

  it('authenticates once and caches token plus company code', async () => {
    axiosPostMock.mockResolvedValue({
      data: { token: 'jwt-token', codacesso: 'COD123', expiresIn: 7200 },
    })
    const { ensureTotemSession, getCompanyCode, getCurrentToken } =
      await loadAuthModule()

    const first = await ensureTotemSession()
    const second = await ensureTotemSession()

    expect(first).toBe('jwt-token')
    expect(second).toBe('jwt-token')
    expect(axiosPostMock).toHaveBeenCalledTimes(1)
    expect(getCurrentToken()).toBe('jwt-token')
    expect(getCompanyCode()).toBe('COD123')
  })

  it('falls back to configured company code when auth was not executed', async () => {
    configState.TOTEM_EMPRESA = 'DEFAULT-CODE'
    const { getCompanyCode } = await loadAuthModule()

    expect(getCompanyCode()).toBe('DEFAULT-CODE')
  })

  it('clears cached state through clearTotemSession', async () => {
    axiosPostMock.mockResolvedValue({
      data: { token: 'jwt-token', codacesso: 'COD123', expiresIn: 7200 },
    })
    const { ensureTotemSession, getCurrentToken, getCompanyCode, clearTotemSession } =
      await loadAuthModule()

    await ensureTotemSession()
    expect(getCurrentToken()).toBe('jwt-token')
    expect(getCompanyCode()).toBe('COD123')

    clearTotemSession()

    expect(getCurrentToken()).toBeNull()
    expect(getCompanyCode()).toBe(configState.TOTEM_EMPRESA)
  })

  it('does not attempt authentication when credentials are missing', async () => {
    configState.TOTEM_USERNAME = ''
    configState.TOTEM_PASSWORD = ''
    const { ensureTotemSession } = await loadAuthModule()

    const token = await ensureTotemSession()

    expect(token).toBeNull()
    expect(axiosPostMock).not.toHaveBeenCalled()
  })

  it('invalidates cached token after expiration time has passed', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    axiosPostMock.mockResolvedValue({
      data: { token: 'jwt-token', expiresIn: 3600 },
    })
    const { ensureTotemSession, getCurrentToken } = await loadAuthModule()

    await ensureTotemSession()
    expect(getCurrentToken()).toBe('jwt-token')

    vi.setSystemTime(new Date('2024-01-01T02:00:00Z'))

    expect(getCurrentToken()).toBeNull()
  })

  it('reuses ongoing login requests for concurrent ensureTotemSession calls', async () => {
    let resolveRequest!: (value: { data: { token: string } }) => void
    const requestPromise = new Promise<{ data: { token: string } }>((resolve) => {
      resolveRequest = resolve as (value: { data: { token: string } }) => void
    })
    axiosPostMock.mockReturnValue(requestPromise)
    const { ensureTotemSession } = await loadAuthModule()

    const firstPromise = ensureTotemSession()
    const secondPromise = ensureTotemSession()

    expect(axiosPostMock).toHaveBeenCalledTimes(1)
    resolveRequest({ data: { token: 'jwt-token' } })

    await expect(firstPromise).resolves.toBe('jwt-token')
    await expect(secondPromise).resolves.toBe('jwt-token')
  })

  it('handles response without expiresIn and defaults to 1 hour', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    axiosPostMock.mockResolvedValue({
      data: { token: 'jwt-token', codacesso: 'COD123' },
    })
    const { ensureTotemSession, getCurrentToken } = await loadAuthModule()

    await ensureTotemSession()
    expect(getCurrentToken()).toBe('jwt-token')

    vi.setSystemTime(new Date('2024-01-01T01:00:00Z'))
    expect(getCurrentToken()).toBeNull()
  })

  it('handles response without codacesso', async () => {
    axiosPostMock.mockResolvedValue({
      data: { token: 'jwt-token', expiresIn: 3600 },
    })
    const { ensureTotemSession, getCompanyCode } = await loadAuthModule()

    await ensureTotemSession()
    expect(getCompanyCode()).toBe(configState.TOTEM_EMPRESA)
  })

  it('handles authentication failure', async () => {
    axiosPostMock.mockRejectedValue(new Error('Authentication failed'))
    const { ensureTotemSession, getCurrentToken } = await loadAuthModule()

    const token = await ensureTotemSession()

    expect(token).toBeNull()
    expect(getCurrentToken()).toBeNull()
  })

  it('handles token expiration during use', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    axiosPostMock.mockResolvedValue({
      data: { token: 'jwt-token', expiresIn: 3600 },
    })
    const { ensureTotemSession, getCurrentToken } = await loadAuthModule()

    await ensureTotemSession()
    expect(getCurrentToken()).toBe('jwt-token')

    vi.setSystemTime(new Date('2024-01-01T01:00:00Z'))
    expect(getCurrentToken()).toBeNull()

    axiosPostMock.mockResolvedValue({
      data: { token: 'new-token', expiresIn: 3600 },
    })
    const newToken = await ensureTotemSession()
    expect(newToken).toBe('new-token')
    expect(axiosPostMock).toHaveBeenCalledTimes(2)
  })

  it('handles race condition when token expires during concurrent requests', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    axiosPostMock.mockResolvedValue({
      data: { token: 'jwt-token', expiresIn: 3600 },
    })
    const { ensureTotemSession, getCurrentToken } = await loadAuthModule()

    await ensureTotemSession()
    expect(getCurrentToken()).toBe('jwt-token')

    vi.setSystemTime(new Date('2024-01-01T01:00:00Z'))

    let resolveRequest!: (value: { data: { token: string } }) => void
    const requestPromise = new Promise<{ data: { token: string } }>((resolve) => {
      resolveRequest = resolve as (value: { data: { token: string } }) => void
    })
    axiosPostMock.mockReturnValue(requestPromise)

    const promise1 = ensureTotemSession()
    const promise2 = ensureTotemSession()

    expect(axiosPostMock).toHaveBeenCalledTimes(2)
    resolveRequest({ data: { token: 'new-token' } })

    await expect(promise1).resolves.toBe('new-token')
    await expect(promise2).resolves.toBe('new-token')
  })

  it('handles missing TOTEM_EMPRESA config', async () => {
    configState.TOTEM_EMPRESA = ''
    axiosPostMock.mockResolvedValue({
      data: { token: 'jwt-token', expiresIn: 3600 },
    })
    const { ensureTotemSession, getCompanyCode } = await loadAuthModule()

    await ensureTotemSession()
    expect(getCompanyCode()).toBe('')
  })

  it('applies 5 second buffer to expiration time', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    axiosPostMock.mockResolvedValue({
      data: { token: 'jwt-token', expiresIn: 3600 },
    })
    const { ensureTotemSession, getCurrentToken } = await loadAuthModule()

    await ensureTotemSession()
    expect(getCurrentToken()).toBe('jwt-token')

    vi.setSystemTime(new Date('2024-01-01T00:59:54Z'))
    expect(getCurrentToken()).toBe('jwt-token')

    vi.setSystemTime(new Date('2024-01-01T00:59:55Z'))
    expect(getCurrentToken()).toBeNull()
  })
})

