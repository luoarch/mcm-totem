import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios'

type ConfigState = {
  API_BASE_URL: string
  API_TIMEOUT: number
  IS_API_CONFIGURED: boolean
}

const CONFIG_DEFAULTS: ConfigState = {
  API_BASE_URL: 'https://api.example.com',
  API_TIMEOUT: 5000,
  IS_API_CONFIGURED: true,
}

let configState: ConfigState = { ...CONFIG_DEFAULTS }

const ensureTotemSessionMock = vi.fn<() => Promise<string | null>>(() =>
  Promise.resolve(null),
)
const getCurrentTokenMock = vi.fn<() => string | null>(() => null)
const clearTotemSessionMock = vi.fn()

let requestHandler:
  | ((
    config: InternalAxiosRequestConfig,
  ) => Promise<InternalAxiosRequestConfig> | InternalAxiosRequestConfig)
  | null = null
let responseSuccessHandler: ((response: AxiosResponse) => AxiosResponse) | null =
  null
let responseErrorHandler:
  | ((error: AxiosError) => Promise<unknown> | unknown)
  | null = null

const mockAxiosInstance = Object.assign(vi.fn(), {
  interceptors: {
    request: {
      use: vi.fn((handler) => {
        requestHandler = handler
      }),
    },
    response: {
      use: vi.fn((success, error) => {
        responseSuccessHandler = success
        responseErrorHandler = error
      }),
    },
  },
})

vi.mock('../../config/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../config/api')>()
  return {
    ...actual,
    get API_BASE_URL() {
      return configState.API_BASE_URL
    },
    get API_TIMEOUT() {
      return configState.API_TIMEOUT
    },
    get IS_API_CONFIGURED() {
      return configState.IS_API_CONFIGURED
    },
  }
})

vi.mock('../auth', () => ({
  ensureTotemSession: ensureTotemSessionMock,
  getCurrentToken: getCurrentTokenMock,
  clearTotemSession: clearTotemSessionMock,
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}))

const loadHttpModule = () => import('../http')

const callRequestInterceptor = async (config: InternalAxiosRequestConfig) => {
  await loadHttpModule()
  if (!requestHandler) {
    throw new Error('request handler not registered')
  }
  return requestHandler(config)
}

const callResponseErrorInterceptor = async (error: AxiosError) => {
  await loadHttpModule()
  if (!responseErrorHandler) {
    throw new Error('response error handler not registered')
  }
  return responseErrorHandler(error)
}

const callResponseSuccessInterceptor = async (response: AxiosResponse) => {
  await loadHttpModule()
  if (!responseSuccessHandler) {
    throw new Error('response success handler not registered')
  }
  return responseSuccessHandler(response)
}

beforeEach(() => {
  configState = { ...CONFIG_DEFAULTS }
  requestHandler = null
  responseSuccessHandler = null
  responseErrorHandler = null
  mockAxiosInstance.mockReset()
  mockAxiosInstance.interceptors.request.use.mockClear()
  mockAxiosInstance.interceptors.response.use.mockClear()
  ensureTotemSessionMock.mockReset().mockResolvedValue(null)
  getCurrentTokenMock.mockReset().mockReturnValue(null)
  clearTotemSessionMock.mockReset()
  vi.resetModules()
})

describe('http service interceptors', () => {
  it('skips token attachment when API is not configured', async () => {
    configState.IS_API_CONFIGURED = false
    const config = {
      headers: {},
    } as InternalAxiosRequestConfig

    const result = await callRequestInterceptor(config)

    expect(result).toBe(config)
    expect(getCurrentTokenMock).not.toHaveBeenCalled()
    expect(ensureTotemSessionMock).not.toHaveBeenCalled()
  })

  it('adds Authorization header with cached token', async () => {
    getCurrentTokenMock.mockReturnValue('cached-token')
    const config = {
      headers: {},
    } as InternalAxiosRequestConfig

    const result = await callRequestInterceptor(config)

    expect(result.headers.Authorization).toBe('Bearer cached-token')
    expect(ensureTotemSessionMock).not.toHaveBeenCalled()
  })

  it('awaits ensureTotemSession when token is missing', async () => {
    getCurrentTokenMock.mockReturnValue(null)
    ensureTotemSessionMock.mockResolvedValue('fresh-token')
    const config = {
      headers: {},
    } as InternalAxiosRequestConfig

    const result = await callRequestInterceptor(config)

    expect(ensureTotemSessionMock).toHaveBeenCalled()
    expect(result.headers.Authorization).toBe('Bearer fresh-token')
  })

  it('returns successful responses untouched', async () => {
    const response = { data: { ok: true } } as AxiosResponse

    const result = await callResponseSuccessInterceptor(response)

    expect(result).toBe(response)
  })

  it('rejects errors when API is not configured', async () => {
    configState.IS_API_CONFIGURED = false
    const error = new Error('network') as AxiosError

    await expect(callResponseErrorInterceptor(error)).rejects.toBe(error)
    expect(clearTotemSessionMock).not.toHaveBeenCalled()
  })

  it('retries 401/403 responses once with refreshed token', async () => {
    ensureTotemSessionMock.mockResolvedValue('new-token')
    mockAxiosInstance.mockResolvedValue({ data: {} })
    const error = {
      response: { status: 401 },
      config: { headers: {}, _retry: false },
    } as AxiosError & { config: InternalAxiosRequestConfig & { _retry?: boolean } }

    await expect(callResponseErrorInterceptor(error as AxiosError)).resolves.toEqual({
      data: {},
    })

    expect(clearTotemSessionMock).toHaveBeenCalledTimes(1)
    expect(ensureTotemSessionMock).toHaveBeenCalledTimes(1)
    expect(mockAxiosInstance).toHaveBeenCalledTimes(1)
    expect(error.config.headers.Authorization).toBe('Bearer new-token')
    expect(error.config._retry).toBe(true)
  })

  it('gives up retrying when token refresh fails', async () => {
    ensureTotemSessionMock.mockResolvedValue(null)
    const error = {
      response: { status: 403 },
      config: { headers: {}, _retry: false },
    } as AxiosError & { config: InternalAxiosRequestConfig & { _retry?: boolean } }

    await expect(callResponseErrorInterceptor(error as AxiosError)).rejects.toBe(error)

    expect(mockAxiosInstance).not.toHaveBeenCalled()
  })

  it('rejects immediately when retry flag already set', async () => {
    const error = {
      response: { status: 401 },
      config: { headers: {}, _retry: true },
    } as AxiosError & { config: InternalAxiosRequestConfig & { _retry?: boolean } }

    await expect(callResponseErrorInterceptor(error as AxiosError)).rejects.toBe(error)

    expect(clearTotemSessionMock).toHaveBeenCalledTimes(1)
    expect(ensureTotemSessionMock).not.toHaveBeenCalled()
  })
})

