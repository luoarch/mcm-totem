import axios from 'axios'
import {
  API_BASE_URL,
  API_TIMEOUT,
  IS_API_CONFIGURED,
  TOTEM_PASSWORD,
  TOTEM_USERNAME,
} from '../config/api'

type AuthResponse = {
  token: string
  expiresIn: number
}

let cachedToken: string | null = null
let tokenExpiration: number | null = null
let ongoingRequest: Promise<string | null> | null = null

export function getCurrentToken(): string | null {
  if (!tokenExpiration || Date.now() >= tokenExpiration) {
    cachedToken = null
    tokenExpiration = null
  }

  return cachedToken
}

export async function ensureTotemSession(): Promise<string | null> {
  if (!IS_API_CONFIGURED) {
    return null
  }

  const existingToken = getCurrentToken()
  if (existingToken) {
    return existingToken
  }

  if (!ongoingRequest) {
    ongoingRequest = authenticateTotemUser()
      .then((token) => {
        ongoingRequest = null
        return token
      })
      .catch((error) => {
        ongoingRequest = null
        throw error
      })
  }

  return ongoingRequest
}

async function authenticateTotemUser(): Promise<string | null> {
  if (!TOTEM_USERNAME || !TOTEM_PASSWORD) {
    console.warn(
      'Credenciais do usuário totem não configuradas. Defina VITE_TOTEM_USERNAME e VITE_TOTEM_PASSWORD.',
    )
    return null
  }

  try {
    const { data } = await axios.post<AuthResponse>(
      `${API_BASE_URL}/auth/login`,
      {
        username: TOTEM_USERNAME,
        password: TOTEM_PASSWORD,
      },
      {
        timeout: API_TIMEOUT,
      },
    )

    cachedToken = data.token
    tokenExpiration = Date.now() + data.expiresIn * 1000 - 5000
    return cachedToken
  } catch (error) {
    console.error('Falha ao autenticar usuário do totem', error)
    cachedToken = null
    tokenExpiration = null
    return null
  }
}

export function clearTotemSession() {
  cachedToken = null
  tokenExpiration = null
  ongoingRequest = null
}

