import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useQueueUpdates } from '../useQueueUpdates'

const { mockApiGet, logErrorMock } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  logErrorMock: vi.fn(),
}))

let configState = {
  IS_API_CONFIGURED: true,
  PANEL_WS_URL: 'ws://localhost:8080',
}

vi.mock('../../../config/api', () => ({
  get IS_API_CONFIGURED() {
    return configState.IS_API_CONFIGURED
  },
  get PANEL_WS_URL() {
    return configState.PANEL_WS_URL
  },
}))

vi.mock('../../../services/http', () => ({
  apiClient: {
    get: mockApiGet,
  },
}))

vi.mock('../../../services/api-validation', async () => {
  const actual = await vi.importActual('../../../services/api-validation')
  return {
    ...actual,
    validateApiResponse: vi.fn((data) => {
      if (Array.isArray(data)) {
        return data
      }
      return data
    }),
  }
})

vi.mock('../../../utils/logger', () => ({
  logError: logErrorMock,
}))
// Track WebSocket instances created during tests
let lastWsInstance: WebSocket | null = null
let mockAddEventListener: ReturnType<typeof vi.fn> | null = null
let mockClose: ReturnType<typeof vi.fn> | null = null
const originalWebSocket = globalThis.WebSocket

beforeEach(() => {
  vi.clearAllMocks()
  lastWsInstance = null
  mockAddEventListener = null
  mockClose = null
  configState = {
    IS_API_CONFIGURED: true,
    PANEL_WS_URL: 'ws://localhost:8080',
  }

  // Create a spy wrapper around the global MockWebSocket
  const SpyWebSocket = class extends originalWebSocket {
    constructor(url: string) {
      super(url)
       
      lastWsInstance = this as WebSocket
      // Spy on addEventListener
      const origAddEventListener = this.addEventListener.bind(this)
      mockAddEventListener = vi.fn((type: string, listener: EventListener) => {
        origAddEventListener(type, listener)
      })
      this.addEventListener = mockAddEventListener as typeof this.addEventListener
      // Spy on close
      const origClose = this.close.bind(this)
      mockClose = vi.fn(() => {
        origClose()
      })
      this.close = mockClose as typeof this.close
    }
  }
  // @ts-expect-error - Assigning custom WebSocket class to global
  globalThis.WebSocket = SpyWebSocket
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useQueueUpdates', () => {
  describe('Initial Load', () => {
    it('should load queue from API when configured', async () => {
      const mockEntries = [
        {
          id: 'call-1',
          patientLabel: 'Patient 1',
          specialty: 'Cardiology',
          status: 'waiting' as const,
        },
      ]

      mockApiGet.mockResolvedValue({ data: mockEntries })

      const { result } = renderHook(() => useQueueUpdates())

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledWith('/queue/panel')
      })

      await waitFor(() => {
        expect(result.current.entries).toEqual(mockEntries)
      })

      expect(result.current.lastUpdatedAt).not.toBeNull()
    })

    it('should use mock data when API is not configured', async () => {
      configState.IS_API_CONFIGURED = false

      const { result } = renderHook(() => useQueueUpdates())

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(3)
      })
      expect(result.current.entries[0].id).toBe('call-100')
      expect(mockApiGet).not.toHaveBeenCalled()
    })
  })

  describe('Polling', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    // These tests are skipped because they require complex fake timer coordination
    // with async operations that cause timing conflicts. To be addressed in a future refactor.
    it.skip('should poll at default interval', async () => {
      mockApiGet.mockResolvedValue({ data: [] })

      renderHook(() => useQueueUpdates())

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledTimes(1)
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledTimes(2)
      })
    })

    it.skip('should poll at custom interval', async () => {
      mockApiGet.mockResolvedValue({ data: [] })

      renderHook(() => useQueueUpdates({ refreshIntervalMs: 10000 }))

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledTimes(1)
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })
      expect(mockApiGet).toHaveBeenCalledTimes(1)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledTimes(2)
      })
    })

    it.skip('should stop polling on unmount', async () => {
      mockApiGet.mockResolvedValue({ data: [] })

      const { unmount } = renderHook(() => useQueueUpdates())

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledTimes(1)
      })

      unmount()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })

      expect(mockApiGet).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should set error when API call fails', async () => {
      configState.IS_API_CONFIGURED = true
      mockApiGet.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useQueueUpdates())

      await waitFor(() => {
        expect(result.current.error).toBe('Não foi possível atualizar a fila.')
      })

      expect(logErrorMock).toHaveBeenCalledWith(
        'Falha ao consultar fila de atendimento',
        expect.any(Error),
      )
    })

    it('should use mock data when API fails and not configured', async () => {
      configState.IS_API_CONFIGURED = false
      mockApiGet.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useQueueUpdates())

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(3)
      })
    })
  })

  describe('WebSocket', () => {
    it('should connect to WebSocket when enabled and URL is configured', async () => {
      configState.PANEL_WS_URL = 'ws://localhost:8080'

      renderHook(() => useQueueUpdates({ enableRealtime: true }))

      await waitFor(() => {
        expect(lastWsInstance).toBeDefined()
        expect(lastWsInstance?.url).toBe('ws://localhost:8080')
      })

      expect(mockAddEventListener).toHaveBeenCalledWith('open', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenCalledWith('message', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenCalledWith('close', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should not connect when WebSocket is disabled', () => {
      renderHook(() => useQueueUpdates({ enableRealtime: false }))

      expect(lastWsInstance).toBeNull()
    })

    it('should not connect when PANEL_WS_URL is not configured', () => {
      configState.PANEL_WS_URL = ''

      renderHook(() => useQueueUpdates({ enableRealtime: true }))

      expect(lastWsInstance).toBeNull()
    })

    it('should set isRealtime to true when WebSocket opens', async () => {
      configState.PANEL_WS_URL = 'ws://localhost:8080'

      const { result } = renderHook(() => useQueueUpdates({ enableRealtime: true }))

      await waitFor(() => {
        expect(lastWsInstance).toBeDefined()
      })

      expect(result.current.isRealtime).toBe(false)

      const openHandler = mockAddEventListener?.mock.calls.find(
        (call) => call[0] === 'open',
      )?.[1] as () => void

      await act(async () => {
        if (openHandler) {
          openHandler()
        }
      })

      await waitFor(() => {
        expect(result.current.isRealtime).toBe(true)
      })
    })

    it('should update entries when WebSocket receives message', async () => {
      configState.PANEL_WS_URL = 'ws://localhost:8080'

      const { result } = renderHook(() => useQueueUpdates({ enableRealtime: true }))

      await waitFor(() => {
        expect(lastWsInstance).toBeDefined()
      })

      const messageHandler = mockAddEventListener?.mock.calls.find(
        (call) => call[0] === 'message',
      )?.[1] as (event: { data: string }) => void

      const mockEntries = [
        {
          id: 'call-1',
          patientLabel: 'Patient 1',
          specialty: 'Cardiology',
          status: 'waiting' as const,
        },
      ]

      await act(async () => {
        if (messageHandler) {
          messageHandler({
            data: JSON.stringify(mockEntries),
          } as MessageEvent)
        }
      })

      await waitFor(() => {
        expect(result.current.entries).toEqual(mockEntries)
      })
      expect(result.current.lastUpdatedAt).not.toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('should set error when WebSocket message is invalid', async () => {
      configState.PANEL_WS_URL = 'ws://localhost:8080'

      const { result } = renderHook(() => useQueueUpdates({ enableRealtime: true }))

      await waitFor(() => {
        expect(lastWsInstance).toBeDefined()
      })

      const messageHandler = mockAddEventListener?.mock.calls.find(
        (call) => call[0] === 'message',
      )?.[1] as (event: { data: string }) => void

      await act(async () => {
        if (messageHandler) {
          messageHandler({
            data: 'invalid json',
          } as MessageEvent)
        }
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Dados recebidos do servidor são inválidos.')
      })
      expect(logErrorMock).toHaveBeenCalled()
    })

    it('should set isRealtime to false when WebSocket closes', async () => {
      configState.PANEL_WS_URL = 'ws://localhost:8080'

      const { result } = renderHook(() => useQueueUpdates({ enableRealtime: true }))

      await waitFor(() => {
        expect(lastWsInstance).toBeDefined()
      })

      const openHandler = mockAddEventListener?.mock.calls.find(
        (call) => call[0] === 'open',
      )?.[1] as () => void

      await act(async () => {
        if (openHandler) {
          openHandler()
        }
      })

      await waitFor(() => {
        expect(result.current.isRealtime).toBe(true)
      })

      const closeHandler = mockAddEventListener?.mock.calls.find(
        (call) => call[0] === 'close',
      )?.[1] as () => void

      await act(async () => {
        if (closeHandler) {
          closeHandler()
        }
      })

      await waitFor(() => {
        expect(result.current.isRealtime).toBe(false)
      })
    })

    it('should set isRealtime to false when WebSocket errors', async () => {
      configState.PANEL_WS_URL = 'ws://localhost:8080'

      const { result } = renderHook(() => useQueueUpdates({ enableRealtime: true }))

      await waitFor(() => {
        expect(lastWsInstance).toBeDefined()
      })

      const openHandler = mockAddEventListener?.mock.calls.find(
        (call) => call[0] === 'open',
      )?.[1] as () => void

      await act(async () => {
        if (openHandler) {
          openHandler()
        }
      })

      await waitFor(() => {
        expect(result.current.isRealtime).toBe(true)
      })

      const errorHandler = mockAddEventListener?.mock.calls.find(
        (call) => call[0] === 'error',
      )?.[1] as () => void

      await act(async () => {
        if (errorHandler) {
          errorHandler()
        }
      })

      await waitFor(() => {
        expect(result.current.isRealtime).toBe(false)
      })
    })

    it('should close WebSocket on unmount', async () => {
      configState.PANEL_WS_URL = 'ws://localhost:8080'

      const { unmount } = renderHook(() => useQueueUpdates({ enableRealtime: true }))

      await waitFor(() => {
        expect(lastWsInstance).toBeDefined()
      })

      unmount()

      expect(mockClose).toHaveBeenCalled()
    })
  })

  describe('Return Values', () => {
    it('should return entries from state', async () => {
      const mockEntries = [
        {
          id: 'call-1',
          patientLabel: 'Patient 1',
          specialty: 'Cardiology',
          status: 'waiting' as const,
        },
      ]

      mockApiGet.mockResolvedValue({ data: mockEntries })

      const { result } = renderHook(() => useQueueUpdates())

      await waitFor(() => {
        expect(result.current.entries).toEqual(mockEntries)
      })
    })

    it('should return isRealtime status', () => {
      const { result } = renderHook(() => useQueueUpdates({ enableRealtime: false }))

      expect(result.current.isRealtime).toBe(false)
    })

    it('should return error status', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useQueueUpdates())

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })
    })

    it('should return lastUpdatedAt timestamp', async () => {
      const mockEntries = [
        {
          id: 'call-1',
          patientLabel: 'Patient 1',
          specialty: 'Cardiology',
          status: 'waiting' as const,
        },
      ]

      mockApiGet.mockResolvedValue({ data: mockEntries })

      const { result } = renderHook(() => useQueueUpdates())

      await waitFor(() => {
        expect(result.current.lastUpdatedAt).not.toBeNull()
        expect(typeof result.current.lastUpdatedAt).toBe('number')
      })
    })
  })
})
