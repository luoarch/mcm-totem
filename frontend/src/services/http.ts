import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, API_TIMEOUT, IS_API_CONFIGURED } from '../config/api'
import { clearTotemSession, ensureTotemSession, getCurrentToken } from './auth'

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

let refreshPromise: Promise<string | null> | null = null

export const apiClient = axios.create({
  baseURL: IS_API_CONFIGURED ? API_BASE_URL : undefined,
  timeout: API_TIMEOUT,
})

apiClient.interceptors.request.use(async (config) => {
  if (!IS_API_CONFIGURED) {
    return config
  }

  const token = getCurrentToken() ?? (await ensureTotemSession())

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!IS_API_CONFIGURED) {
      return Promise.reject(error)
    }

    const { response, config } = error

    // Handle both 401 (Unauthorized) and 403 (Forbidden) for token refresh
    if ((response?.status === 401 || response?.status === 403) && config) {
      const retriableConfig = config as RetriableConfig

      // If already retried, clear session and reject
      if (retriableConfig._retry) {
        clearTotemSession()
        refreshPromise = null
        return Promise.reject(error)
      }

      retriableConfig._retry = true

      // Use shared promise to prevent multiple simultaneous refresh attempts
      if (!refreshPromise) {
        clearTotemSession()
        refreshPromise = ensureTotemSession()
          .then((token) => {
            refreshPromise = null
            return token
          })
          .catch((err) => {
            refreshPromise = null
            clearTotemSession()
            throw err
          })
      }

      try {
        const token = await refreshPromise
        if (token) {
          retriableConfig.headers.Authorization = `Bearer ${token}`
          return apiClient(retriableConfig)
        }
      } catch {
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)

