import axios from 'axios'
import {
  API_BASE_URL,
  API_TIMEOUT,
  IS_API_CONFIGURED,
  TOTEM_PASSWORD,
  TOTEM_USERNAME,
  TOTEM_EMPRESA,
} from '../config/api'

type MCAuthResponse = {
  token: string
  codacesso?: string
  expiresIn?: number
}

let cachedToken: string | null = null
let codacesso: string | null = null
let tokenExpiration: number | null = null
let ongoingRequest: Promise<string | null> | null = null

/**
 * Get the company code (codacesso) from login response
 * Used as codempresa param in API calls
 */
export function getCompanyCode(): string {
  return codacesso ?? TOTEM_EMPRESA
}

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

  if (!TOTEM_EMPRESA) {
    console.warn(
      'Código da empresa não configurado. Defina VITE_TOTEM_EMPRESA.',
    )
  }

  try {
    // Create URLSearchParams for application/x-www-form-urlencoded
    const params = new URLSearchParams()
    params.append('empresa', TOTEM_EMPRESA)
    params.append('username', TOTEM_USERNAME)
    params.append('password', TOTEM_PASSWORD)
    params.append('integracaowhatsapp', 'S')

    const { data } = await axios.post<MCAuthResponse>(
      `${API_BASE_URL}/login/externo`,
      params,
      {
        timeout: API_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    cachedToken = data.token

    // Store codacesso if provided, for use as codempresa in API calls
    if (data.codacesso) {
      codacesso = data.codacesso
    }

    // Calculate expiration (default to 1 hour if not provided)
    const expiresInMs = (data.expiresIn ?? 3600) * 1000
    tokenExpiration = Date.now() + expiresInMs - 5000 // 5s buffer

    return cachedToken
  } catch (error) {
    console.error('Falha ao autenticar usuário do totem', error)
    cachedToken = null
    codacesso = null
    tokenExpiration = null
    return null
  }
}

export function clearTotemSession() {
  cachedToken = null
  codacesso = null
  tokenExpiration = null
  ongoingRequest = null
}

