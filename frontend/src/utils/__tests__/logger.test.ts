import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logError, logWarning, logInfo } from '../logger'

describe('Logger Utils', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => { })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logError', () => {
    it('should log message only when no error or context provided', () => {
      logError('Test error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test error message')
    })

    it('should sanitize and log error object', () => {
      const error = new Error('Something went wrong')
      logError('Error occurred', error)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error occurred', {
        name: 'Error',
        message: 'Something went wrong',
        stack: expect.any(String),
      })
    })

    it('should sanitize error message containing CPF', () => {
      const error = new Error('CPF: 12345678901 is invalid')
      logError('Validation failed', error)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[1]).toMatchObject({
        name: 'Error',
        message: expect.stringContaining('123*****901'),
      })
    })

    it('should process error message containing token pattern', () => {
      const error = new Error('token: abc123xyz failed')
      logError('Auth failed', error)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[1]).toMatchObject({
        name: 'Error',
        message: expect.any(String),
      })
    })

    it('should process error message containing email', () => {
      const error = new Error('email: user@example.com not found')
      logError('User not found', error)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[1]).toMatchObject({
        name: 'Error',
        message: expect.any(String),
      })
      expect(callArgs[1].message).toMatch(/@example\.com/)
    })

    it('should sanitize context object with sensitive data', () => {
      const context = {
        cpf: '12345678901',
        email: 'user@example.com',
        phone: '4799999999',
      }
      logError('Error message', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        cpf: expect.stringMatching(/^123.*901$/),
        email: expect.stringMatching(/@example\.com$/),
        phone: expect.any(String),
      })
      expect(callArgs[2].cpf).not.toBe('12345678901')
      expect(callArgs[2].email).not.toBe('user@example.com')
    })

    it('should sanitize context with token field', () => {
      const context = {
        token: 'secret-token-123',
        userId: 'user123',
      }
      logError('Auth error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toEqual({
        token: '[REDACTED]',
        userId: 'user123',
      })
    })

    it('should sanitize context with password field', () => {
      const context = {
        password: 'mySecretPassword',
        username: 'user',
      }
      logError('Login error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        password: '[REDACTED]',
        username: expect.stringContaining('***'),
      })
    })

    it('should sanitize nested objects in context', () => {
      const context = {
        user: {
          cpf: '12345678901',
          email: 'user@example.com',
        },
        metadata: {
          phone: '4799999999',
        },
      }
      logError('Error with nested data', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        user: {
          cpf: expect.stringMatching(/^123.*901$/),
          email: expect.stringMatching(/@example\.com$/),
        },
        metadata: {
          phone: expect.any(String),
        },
      })
      expect(callArgs[2].user.cpf).not.toBe('12345678901')
      expect(callArgs[2].user.email).not.toBe('user@example.com')
    })

    it('should sanitize arrays in context', () => {
      const context = {
        emails: ['user1@example.com', 'user2@example.com'],
        phones: ['4799999999', '4788888888'],
      }
      logError('Error with arrays', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        emails: expect.arrayContaining([
          expect.stringMatching(/@example\.com$/),
        ]),
        phones: expect.arrayContaining([expect.any(String)]),
      })
      expect(Array.isArray(callArgs[2].emails)).toBe(true)
      expect(Array.isArray(callArgs[2].phones)).toBe(true)
      expect(callArgs[2].emails[0]).not.toBe('user1@example.com')
    })

    it('should truncate deeply nested objects', () => {
      const context = {
        level1: {
          level2: {
            level3: {
              level4: {
                data: 'value',
              },
            },
          },
        },
      }
      logError('Deep nesting', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        level1: {
          level2: {
            level3: {
              level4: {
                '[truncated]': true,
              },
            },
          },
        },
      })
    })

    it('should log error and context together', () => {
      const error = new Error('Test error')
      const context = { userId: '123' }
      logError('Operation failed', error, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Operation failed',
        expect.objectContaining({
          name: 'Error',
          message: 'Test error',
        }),
        { userId: '123' },
      )
    })

    it('should sanitize bearer token when value starts with Bearer', () => {
      const context = {
        authHeader: 'Bearer abc123token456',
      }
      logError('Token error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        authHeader: '[TOKEN_REDACTED]',
      })
    })

    it('should sanitize CPF-like patterns in error messages', () => {
      const error = new Error('CPF: 12345678901 is invalid')
      logError('Document error', error)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[1]).toMatchObject({
        name: 'Error',
        message: expect.stringContaining('123*****901'),
      })
    })

    it('should include stack in development mode', () => {
      const error = new Error('Test error')
      logError('Error in development', error)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[1]).toHaveProperty('stack')
      expect(typeof callArgs[1].stack).toBe('string')
    })
  })

  describe('logWarning', () => {
    it('should log message only when no context provided', () => {
      logWarning('Warning message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith('Warning message')
    })

    it('should sanitize and log context', () => {
      const context = {
        cpf: '12345678901',
        email: 'user@example.com',
      }
      logWarning('Warning with context', context)

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith('Warning with context', {
        cpf: expect.stringMatching(/^123.*901$/),
        email: expect.stringMatching(/@example\.com$/),
      })
    })

    it('should sanitize sensitive fields in context', () => {
      const context = {
        password: 'secret',
        token: 'abc123',
        regularField: 'value',
      }
      logWarning('Warning', context)

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleWarnSpy.mock.calls[0]
      expect(callArgs[1]).toEqual({
        password: '[REDACTED]',
        token: '[REDACTED]',
        regularField: 'value',
      })
    })

    it('should sanitize nested context objects', () => {
      const context = {
        user: {
          name: 'John Doe',
          cpf: '12345678901',
        },
      }
      logWarning('User warning', context)

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleWarnSpy.mock.calls[0]
      expect(callArgs[1]).toMatchObject({
        user: {
          name: expect.stringContaining('***'),
          cpf: expect.stringContaining('***'),
        },
      })
    })
  })

  describe('logInfo', () => {
    it('should log message only when no context provided', () => {
      logInfo('Info message')

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy).toHaveBeenCalledWith('Info message')
    })

    it('should sanitize and log context', () => {
      const context = {
        userId: '123',
        email: 'user@example.com',
      }
      logInfo('Info with context', context)

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy).toHaveBeenCalledWith('Info with context', {
        userId: '123',
        email: expect.stringMatching(/@example\.com$/),
      })
    })

    it('should sanitize sensitive data in context', () => {
      const context = {
        authorization: 'Bearer token123',
        phone: '4799999999',
      }
      logInfo('Auth info', context)

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleInfoSpy.mock.calls[0]
      expect(callArgs[1]).toMatchObject({
        authorization: '[REDACTED]',
        phone: expect.any(String),
      })
      expect(callArgs[1].phone).not.toBe('4799999999')
    })
  })

  describe('String Sanitization', () => {
    it('should mask bearer tokens', () => {
      const context = {
        authorization: 'Bearer abc123token456',
      }
      logError('Auth error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toEqual({
        authorization: '[REDACTED]',
      })
    })

    it('should mask CPF patterns', () => {
      const context = {
        document: '12345678901',
      }
      logError('Document error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        document: expect.stringMatching(/^123.*901$/),
      })
    })

    it('should mask phone numbers when context includes phone', () => {
      const context = {
        phone: '4799999999',
        celular: '4788888888',
        telefone: '4777777777',
      }
      logError('Phone error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        phone: expect.any(String),
        celular: expect.any(String),
        telefone: expect.any(String),
      })
      expect(callArgs[2].phone).not.toBe('4799999999')
      expect(callArgs[2].celular).not.toBe('4788888888')
      expect(callArgs[2].telefone).not.toBe('4777777777')
    })

    it('should mask email addresses', () => {
      const context = {
        email: 'user@example.com',
        userEmail: 'john.doe@test.org',
      }
      logError('Email error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        email: expect.stringMatching(/@example\.com$/),
        userEmail: expect.stringMatching(/@test\.org$/),
      })
      expect(callArgs[2].email).not.toBe('user@example.com')
      expect(callArgs[2].userEmail).not.toBe('john.doe@test.org')
    })

    it('should mask generic sensitive patterns', () => {
      const context = {
        patientName: 'John Doe',
        patientId: '12345',
        nome: 'Maria Silva',
      }
      logError('Patient error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        patientName: expect.stringContaining('***'),
        patientId: expect.any(String),
        nome: expect.stringContaining('***'),
      })
    })

    it('should handle short strings in mask function', () => {
      const context = {
        shortCpf: '123',
      }
      logError('Short value', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        shortCpf: '***',
      })
    })

    it('should preserve non-sensitive strings', () => {
      const context = {
        message: 'Regular message',
        status: 'success',
        count: 42,
      }
      logError('Regular error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toEqual({
        message: 'Regular message',
        status: 'success',
        count: 42,
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle null values in context', () => {
      const context = {
        value: null,
        other: 'test',
      }
      logError('Error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toEqual({
        value: null,
        other: 'test',
      })
    })

    it('should handle undefined values in context', () => {
      const context = {
        value: undefined,
        other: 'test',
      }
      logError('Error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        other: 'test',
      })
    })

    it('should handle empty objects', () => {
      logError('Error', undefined, {})

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error', undefined, {})
    })

    it('should handle Error objects in arrays', () => {
      const context = {
        errors: [
          new Error('Error 1'),
          new Error('Error 2'),
        ],
      }
      logError('Multiple errors', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        errors: expect.arrayContaining([
          expect.objectContaining({
            name: 'Error',
            message: 'Error 1',
          }),
          expect.objectContaining({
            name: 'Error',
            message: 'Error 2',
          }),
        ]),
      })
    })

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01')
      const context = {
        createdAt: date,
      }
      logError('Error with date', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        createdAt: expect.any(Object),
      })
    })

    it('should handle boolean and number primitives', () => {
      const context = {
        isActive: true,
        count: 42,
        price: 99.99,
      }
      logError('Error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toEqual({
        isActive: true,
        count: 42,
        price: 99.99,
      })
    })

    it('should sanitize arrays containing nested objects', () => {
      const context = {
        items: [
          { name: 'Item 1', cpf: '12345678901' },
          { name: 'Item 2', email: 'test@example.com' },
        ],
      }
      logError('Error with array objects', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({
            cpf: expect.stringMatching(/^123.*901$/),
          }),
          expect.objectContaining({
            email: expect.stringMatching(/@example\.com$/),
          }),
        ]),
      })
    })

    it('should handle string passed as error', () => {
      logError('Error message', 'some string error')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[1]).toBe('some string error')
    })

    it('should handle object passed as error', () => {
      const errorObj = { code: 500, message: 'Server error' }
      logError('Error message', errorObj)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[1]).toMatchObject({
        code: 500,
        message: 'Server error',
      })
    })

    it('should handle array passed as error', () => {
      const errorArray = ['error1', 'error2']
      logError('Error message', errorArray)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(Array.isArray(callArgs[1])).toBe(true)
      expect(callArgs[1]).toEqual(['error1', 'error2'])
    })

    it('should handle primitive passed as error', () => {
      logError('Error message', 404)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[1]).toBe(404)
    })

    it('should handle null passed as error', () => {
      logError('Error message', null)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error message')
    })

    it('should handle phone context without valid phone number', () => {
      const context = {
        phone: '12345',
      }
      logError('Error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        phone: expect.any(String),
      })
    })

    it('should handle invalid email format without @ symbol', () => {
      const context = {
        email: 'invalid-email',
      }
      logError('Error', undefined, context)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        email: expect.any(String),
      })
    })
  })
})
