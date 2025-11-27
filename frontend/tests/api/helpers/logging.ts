type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type SafeLogger = Record<LogLevel, (message: string, meta?: Record<string, unknown>) => void>;

const mask = (value: string, visibleStart = 2, visibleEnd = 2, maskChar = '*') => {
  if (!value) return value;

  const isShort = value.length <= 8;
  const start = isShort ? 1 : visibleStart;
  const end = isShort ? 1 : visibleEnd;

  if (value.length <= start + end) {
    return `${value[0] ?? ''}${maskChar.repeat(Math.max(value.length - 2, 0))}${value.at(-1) ?? ''}`;
  }

  return `${value.slice(0, start)}${maskChar.repeat(value.length - (start + end))}${value.slice(value.length - end)}`;
};

export const redactToken = (token?: string) => (token ? mask(token, 3, 3) : token);

export const redactCpf = (cpf?: string) => (cpf ? mask(cpf.replace(/\D/g, ''), 3, 2) : cpf);

export const redactPhone = (phone?: string) => (phone ? mask(phone.replace(/\D/g, ''), 2, 2) : phone);

const SENSITIVE_KEYWORDS = ['token', 'cpf', 'password', 'authorization', 'celular', 'phone'];
const MAX_SANITIZE_DEPTH = 3;

const shouldRedactKey = (keyLower: string) => SENSITIVE_KEYWORDS.some((keyword) => keyLower.includes(keyword));

const MAX_LOG_STRING_LENGTH = 300;

const truncateString = (value?: string, limit = MAX_LOG_STRING_LENGTH) =>
  value && value.length > limit ? `${value.slice(0, limit)}…` : value;

const sanitizeString = (keyLower: string, value: string) => {
  if (keyLower.includes('token')) {
    return redactToken(value);
  }
  if (keyLower.includes('cpf')) {
    return redactCpf(value);
  }
  if (keyLower.includes('phone') || keyLower.includes('celular')) {
    return redactPhone(value);
  }
  if (keyLower.includes('password')) {
    return mask(value, 1, 1);
  }
  if (keyLower === 'authorization') {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const scheme = parts[0];
      const tokenValue = parts.slice(1).join(' ');
      return `${scheme} ${redactToken(tokenValue)}`;
    }

    return redactToken(trimmed);
  }

  return truncateString(value);
};

const sanitizeValue = (value: unknown, key: string, depth: number): unknown => {
  const keyLower = key.toLowerCase();

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message),
    };
  }

  if (typeof value === 'string') {
    return sanitizeString(keyLower, value);
  }

  if (shouldRedactKey(keyLower)) {
    return '[redacted]';
  }

  if (!value || typeof value !== 'object' || depth >= MAX_SANITIZE_DEPTH) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, key, depth + 1));
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [nestedKey, nestedValue]) => {
    acc[nestedKey] = sanitizeValue(nestedValue, nestedKey, depth + 1);
    return acc;
  }, {});
};

const sanitizeMeta = (meta?: Record<string, unknown>) => {
  if (!meta) return undefined;

  return Object.entries(meta).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[key] = sanitizeValue(value, key, 1);
    return acc;
  }, {});
};

const log = (level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>) => {
  const entry = `[${scope}] ${message}`;
  const serializedMeta = sanitizeMeta(meta);

  switch (level) {
    case 'error':
      console.error(entry, serializedMeta ?? '');  
      break;
    case 'warn':
      console.warn(entry, serializedMeta ?? '');  
      break;
    case 'debug':
      {
        const debugScopes = (process.env.DEBUG ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

        if (debugScopes.includes(scope)) {
          console.debug(entry, serializedMeta ?? '');  
        }
      }
      break;
    default:
      console.info(entry, serializedMeta ?? '');  
  }
};

export const createLogger = (scope = 'totem-e2e'): SafeLogger => ({
  info: (message, meta) => log('info', scope, message, meta),
  warn: (message, meta) => log('warn', scope, message, meta),
  error: (message, meta) => log('error', scope, message, meta),
  debug: (message, meta) => log('debug', scope, message, meta),
});

