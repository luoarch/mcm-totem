import { useEffect, useMemo, useRef, useState } from 'react'
import { IS_API_CONFIGURED, PANEL_WS_URL } from '../../config/api'
import { apiClient } from '../../services/http'
import type { QueueEntry, QueuePanelState } from './types'
import { logError } from '../../utils/logger'
import {
  queueEntriesSchema,
  validateApiResponse,
} from '../../services/api-validation'

type UseQueueUpdatesOptions = {
  refreshIntervalMs?: number
  enableRealtime?: boolean
}

type UseQueueUpdatesResult = {
  entries: QueueEntry[]
  isRealtime: boolean
  error: string | null
  lastUpdatedAt: number | null
}

const DEFAULT_REFRESH_INTERVAL = 5000

const MOCK_QUEUE: QueueEntry[] = [
  {
    id: 'call-100',
    patientLabel: 'Carla ***921',
    specialty: 'Clínico Geral',
    status: 'called',
    calledAt: new Date().toISOString(),
    room: 'Consultório 1',
  },
  {
    id: 'call-099',
    patientLabel: 'João ***552',
    specialty: 'Trauma',
    status: 'waiting',
  },
  {
    id: 'call-098',
    patientLabel: 'Beatriz ***334',
    specialty: 'Pediatria',
    status: 'waiting',
  },
]

export function useQueueUpdates(
  options: UseQueueUpdatesOptions = {},
): UseQueueUpdatesResult {
  const { refreshIntervalMs = DEFAULT_REFRESH_INTERVAL, enableRealtime = true } = options
  const [state, setState] = useState<QueuePanelState>({
    entries: [],
    lastUpdatedAt: null,
  })
  const [error, setError] = useState<string | null>(null)
  const [isRealtime, setIsRealtime] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let isMounted = true
    let interval: number | null = null

    const loadQueue = async () => {
      try {
        const { data } = await apiClient.get<unknown>('/queue/panel')
        if (!isMounted) return
        const validatedEntries = validateApiResponse(
          data,
          queueEntriesSchema,
          'fila de atendimento',
        )
        setState({ entries: validatedEntries, lastUpdatedAt: Date.now() })
        setError(null)
      } catch (requestError) {
        if (!isMounted) return
        logError('Falha ao consultar fila de atendimento', requestError)
        if (!IS_API_CONFIGURED) {
          setState({ entries: MOCK_QUEUE, lastUpdatedAt: Date.now() })
        }
        setError('Não foi possível atualizar a fila.')
      }
    }

    if (IS_API_CONFIGURED) {
      void loadQueue()
      interval = window.setInterval(() => {
        void loadQueue()
      }, refreshIntervalMs)
    } else {
      setState({ entries: MOCK_QUEUE, lastUpdatedAt: Date.now() })
    }

    return () => {
      isMounted = false
      if (interval) {
        window.clearInterval(interval)
      }
    }
  }, [refreshIntervalMs])

  useEffect(() => {
    if (!enableRealtime || !PANEL_WS_URL) {
      setIsRealtime(false)
      return
    }

    const socket = new WebSocket(PANEL_WS_URL)
    wsRef.current = socket

    socket.addEventListener('open', () => {
      setIsRealtime(true)
    })

    socket.addEventListener('message', (event) => {
      try {
        const rawData = JSON.parse(event.data)
        const validatedEntries = validateApiResponse(
          rawData,
          queueEntriesSchema,
          'fila de atendimento via WebSocket',
        )
        setState({ entries: validatedEntries, lastUpdatedAt: Date.now() })
        setError(null)
      } catch (parseError) {
        logError('Falha ao validar atualização da fila via WebSocket', parseError)
        setError('Dados recebidos do servidor são inválidos.')
      }
    })

    socket.addEventListener('close', () => {
      setIsRealtime(false)
    })

    socket.addEventListener('error', () => {
      setIsRealtime(false)
    })

    return () => {
      socket.close()
    }
  }, [enableRealtime])

  const entries = useMemo(() => state.entries, [state.entries])

  return {
    entries,
    isRealtime,
    error,
    lastUpdatedAt: state.lastUpdatedAt,
  }
}

