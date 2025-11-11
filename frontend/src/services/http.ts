import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, API_TIMEOUT, IS_API_CONFIGURED } from '../config/api'
import { clearTotemSession, ensureTotemSession, getCurrentToken } from './auth'

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

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

    if (response?.status === 401 && config) {
      const retriableConfig = config as RetriableConfig
      if (retriableConfig._retry) {
        clearTotemSession()
        return Promise.reject(error)
      }

      retriableConfig._retry = true
      clearTotemSession()
      const token = await ensureTotemSession()
      if (token) {
        retriableConfig.headers = {
          ...retriableConfig.headers,
          Authorization: `Bearer ${token}`,
        }
        return apiClient(retriableConfig)
      }
    }

    return Promise.reject(error)
  },
)

