/**
 * Safe logging utility to prevent PII (Personally Identifiable Information)
 * from being exposed in console logs or error tracking services.
 */

type SanitizableValue = unknown

const SENSITIVE_PATTERNS = [
  /token/i,
  /password/i,
  /senha/i,
  /cpf/i,
  /celular/i,
  /phone/i,
  /telefone/i,
  /email/i,
  /authorization/i,
  /nome/i,
  /name/i,
  /patient/i,
  /paciente/i,
]

/**
 * Check if a string contains sensitive patterns
 */
function containsSensitivePattern(value: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(value))
}

/**
 * Mask a string showing only first and last characters
 */
function mask(value: string, start: number, end: number): string {
  if (value.length <= start + end) {
    return '***'
  }
  return `${value.slice(0, start)}${'*'.repeat(Math.max(0, value.length - start - end))}${value.slice(-end)}`
}

/**
 * Sanitize a string value by masking sensitive parts
 */
function sanitizeString(value: string, context?: string): string {
  const lowerContext = context?.toLowerCase() ?? ''
  const lowerValue = value.toLowerCase()

  // Check if value itself looks like sensitive data
  if (lowerValue.includes('bearer ') || lowerValue.startsWith('bearer')) {
    return '[TOKEN_REDACTED]'
  }

  // CPF-like patterns (11 digits)
  if (/^\d{11}$/.test(value.replace(/\D/g, ''))) {
    return mask(value.replace(/\D/g, ''), 3, 3)
  }

  // Phone-like patterns
  if (lowerContext.includes('phone') || lowerContext.includes('celular') || lowerContext.includes('telefone')) {
    if (/\d{10,}/.test(value.replace(/\D/g, ''))) {
      return '[PHONE_REDACTED]'
    }
  }

  // Email patterns
  if (lowerContext.includes('email') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    const [local, domain] = value.split('@')
    if (local && domain) {
      return `${mask(local, 2, 0)}@${domain}`
    }
  }

  // Generic sensitive context
  if (containsSensitivePattern(lowerContext) || containsSensitivePattern(lowerValue)) {
    return mask(value, 2, 2)
  }

  return value
}

/**
 * Sanitize an Error object, removing sensitive information
 */
function sanitizeError(error: Error): {
  name: string
  message: string
  stack?: string
} {
  let sanitizedMessage = error.message

  // Remove potential sensitive data from error messages
  // Match patterns like "CPF: 12345678901" or "token: abc123"
  sanitizedMessage = sanitizedMessage.replace(
    /(?:cpf|token|password|senha|celular|phone|telefone|email|authorization)[\s:=]+([^\s,;)]+)/gi,
    (_, match) => {
      return sanitizeString(match.trim(), match)
    },
  )

  return {
    name: error.name,
    message: sanitizedMessage,
    // Optionally include stack trace in development only
    ...(import.meta.env.DEV ? { stack: error.stack } : {}),
  }
}

/**
 * Sanitize an object recursively, masking sensitive fields
 */
function sanitizeObject(obj: Record<string, unknown>, depth = 0, maxDepth = 3): Record<string, unknown> {
  if (depth > maxDepth) {
    return { '[truncated]': true }
  }

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()

    // Skip sensitive fields entirely
    if (
      lowerKey.includes('token') ||
      lowerKey.includes('password') ||
      lowerKey.includes('senha') ||
      lowerKey === 'authorization'
    ) {
      sanitized[key] = '[REDACTED]'
      continue
    }

    // Sanitize string values
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, key)
      continue
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Error)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, depth + 1, maxDepth)
      continue
    }

    // Sanitize arrays
    if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (typeof item === 'string') {
          return sanitizeString(item, key)
        }
        if (item && typeof item === 'object' && !(item instanceof Error)) {
          return sanitizeObject(item as Record<string, unknown>, depth + 1, maxDepth)
        }
        return item
      })
      continue
    }

    // Keep other values as-is
    sanitized[key] = value
  }

  return sanitized
}

/**
 * Sanitize unknown values for safe logging
 */
function sanitizeValue(value: SanitizableValue): unknown {
  // Error objects
  if (value instanceof Error) {
    return sanitizeError(value)
  }

  // String values
  if (typeof value === 'string') {
    return sanitizeString(value)
  }

  // Objects
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return sanitizeObject(value as Record<string, unknown>)
  }

  // Arrays
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  // Primitives (safe to log)
  return value
}

/**
 * Safe error logger that sanitizes sensitive data before logging
 */
export function logError(message: string, error?: unknown, context?: Record<string, unknown>): void {
  const sanitizedError = error ? sanitizeValue(error) : undefined
  const sanitizedContext = context ? sanitizeObject(context) : undefined

  if (sanitizedContext) {
    console.error(message, sanitizedError, sanitizedContext)
  } else if (sanitizedError) {
    console.error(message, sanitizedError)
  } else {
    console.error(message)
  }
}

/**
 * Safe warning logger
 */
export function logWarning(message: string, context?: Record<string, unknown>): void {
  const sanitizedContext = context ? sanitizeObject(context) : undefined

  if (sanitizedContext) {
    console.warn(message, sanitizedContext)
  } else {
    console.warn(message)
  }
}

/**
 * Safe info logger (same as console.info, but consistent API)
 */
export function logInfo(message: string, context?: Record<string, unknown>): void {
  const sanitizedContext = context ? sanitizeObject(context) : undefined

  if (sanitizedContext) {
    console.info(message, sanitizedContext)
  } else {
    console.info(message)
  }
}

