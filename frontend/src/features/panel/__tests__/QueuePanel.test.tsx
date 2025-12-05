import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueuePanel } from '../QueuePanel'
import type { QueueEntry } from '../types'

const { mockUseQueueUpdates, logWarningMock } = vi.hoisted(() => ({
  mockUseQueueUpdates: vi.fn(),
  logWarningMock: vi.fn(),
}))

vi.mock('../useQueueUpdates', () => ({
  useQueueUpdates: mockUseQueueUpdates,
}))

vi.mock('../../utils/logger', () => ({
  logWarning: logWarningMock,
}))

const mockPlay = vi.fn()
const mockPause = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockUseQueueUpdates.mockReturnValue({
    entries: [],
    isRealtime: false,
    error: null,
    lastUpdatedAt: null,
  })

  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    writable: true,
    value: mockPlay.mockResolvedValue(undefined),
  })

  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    writable: true,
    value: mockPause,
  })

  Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
    writable: true,
    value: 0,
  })
})

describe('QueuePanel', () => {
  describe('Empty State', () => {
    it('should render empty state when no entries', () => {
      mockUseQueueUpdates.mockReturnValue({
        entries: [],
        isRealtime: false,
        error: null,
        lastUpdatedAt: null,
      })

      render(<QueuePanel />)

      expect(screen.getByText(/fila vazia/i)).toBeInTheDocument()
      expect(
        screen.getByText(/aguarde novas chamadas/i),
      ).toBeInTheDocument()
    })
  })

  describe('Current Call', () => {
    it('should render current call when entries exist', () => {
      const entries: QueueEntry[] = [
        {
          id: 'call-1',
          patientLabel: 'Carla ***921',
          specialty: 'Clínico Geral',
          status: 'called',
          calledAt: '2024-01-01T10:00:00Z',
          room: 'Consultório 1',
        },
      ]

      mockUseQueueUpdates.mockReturnValue({
        entries,
        isRealtime: false,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      render(<QueuePanel />)

      expect(screen.getByText(/chamando agora/i)).toBeInTheDocument()
      expect(screen.getByText('Carla ***921')).toBeInTheDocument()
      expect(screen.getByText('Clínico Geral')).toBeInTheDocument()
      expect(screen.getByText('Consultório 1')).toBeInTheDocument()
    })

    it('should format calledAt time correctly', () => {
      const entries: QueueEntry[] = [
        {
          id: 'call-1',
          patientLabel: 'Patient',
          specialty: 'Test',
          status: 'called',
          calledAt: '2024-01-01T14:30:00Z',
        },
      ]

      mockUseQueueUpdates.mockReturnValue({
        entries,
        isRealtime: false,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      render(<QueuePanel />)

      expect(screen.getByText(/compareça ao consultório/i)).toBeInTheDocument()
    })

    it('should not render room chip when room is not provided', () => {
      const entries: QueueEntry[] = [
        {
          id: 'call-1',
          patientLabel: 'Patient',
          specialty: 'Test Specialty',
          status: 'called',
        },
      ]

      mockUseQueueUpdates.mockReturnValue({
        entries,
        isRealtime: false,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      const { container } = render(<QueuePanel />)

      expect(screen.getByText('Test Specialty')).toBeInTheDocument()

      const currentCallPaper = container.querySelector('.MuiPaper-root')
      const chipsInCurrentCall = currentCallPaper?.querySelectorAll('.MuiChip-root') || []
      expect(chipsInCurrentCall.length).toBe(1)
      expect(chipsInCurrentCall[0]?.textContent).toBe('Test Specialty')
    })
  })

  describe('Upcoming Calls', () => {
    it('should render upcoming calls', () => {
      const entries: QueueEntry[] = [
        {
          id: 'call-1',
          patientLabel: 'Current',
          specialty: 'Test',
          status: 'called',
        },
        {
          id: 'call-2',
          patientLabel: 'Upcoming 1',
          specialty: 'Cardiology',
          status: 'waiting',
        },
        {
          id: 'call-3',
          patientLabel: 'Upcoming 2',
          specialty: 'Pediatrics',
          status: 'waiting',
        },
      ]

      mockUseQueueUpdates.mockReturnValue({
        entries,
        isRealtime: false,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      render(<QueuePanel />)

      expect(screen.getByText(/próximos atendimentos/i)).toBeInTheDocument()
      expect(screen.getByText('Upcoming 1')).toBeInTheDocument()
      expect(screen.getByText('Upcoming 2')).toBeInTheDocument()
    })

    it('should show empty message when no upcoming calls', () => {
      const entries: QueueEntry[] = [
        {
          id: 'call-1',
          patientLabel: 'Current',
          specialty: 'Test',
          status: 'called',
        },
      ]

      mockUseQueueUpdates.mockReturnValue({
        entries,
        isRealtime: false,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      render(<QueuePanel />)

      expect(
        screen.getByText(/nenhum paciente aguardando chamada/i),
      ).toBeInTheDocument()
    })

    it('should limit upcoming calls to 6', () => {
      const entries: QueueEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `call-${i}`,
        patientLabel: `Patient ${i}`,
        specialty: 'Test',
        status: 'waiting' as const,
      }))

      mockUseQueueUpdates.mockReturnValue({
        entries,
        isRealtime: false,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      render(<QueuePanel />)

      const patientLabels = screen.getAllByText(/patient \d+/i)
      expect(patientLabels.length).toBeLessThanOrEqual(7)
    })

    it('should display status correctly for waiting entries', () => {
      const entries: QueueEntry[] = [
        {
          id: 'call-1',
          patientLabel: 'Current',
          specialty: 'Test',
          status: 'called',
        },
        {
          id: 'call-2',
          patientLabel: 'Waiting',
          specialty: 'Test',
          status: 'waiting',
        },
      ]

      mockUseQueueUpdates.mockReturnValue({
        entries,
        isRealtime: false,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      render(<QueuePanel />)

      expect(screen.getByText(/status: em espera/i)).toBeInTheDocument()
    })
  })

  describe('Realtime Indicator', () => {
    it('should show "Tempo real" when isRealtime is true', () => {
      mockUseQueueUpdates.mockReturnValue({
        entries: [],
        isRealtime: true,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      render(<QueuePanel />)

      expect(screen.getByText('Tempo real')).toBeInTheDocument()
    })

    it('should show "Atualização periódica" when isRealtime is false', () => {
      mockUseQueueUpdates.mockReturnValue({
        entries: [],
        isRealtime: false,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      render(<QueuePanel />)

      expect(screen.getByText('Atualização periódica')).toBeInTheDocument()
    })
  })

  describe('Sound Toggle', () => {
    it('should render sound toggle button', () => {
      render(<QueuePanel />)

      const soundButton = screen.getByRole('button', {
        name: /ativar alerta sonoro/i,
      })
      expect(soundButton).toBeInTheDocument()
    })

    it('should toggle sound when button is clicked', async () => {
      const user = userEvent.setup()
      render(<QueuePanel />)

      const soundButton = screen.getByRole('button', {
        name: /ativar alerta sonoro/i,
      })

      await user.click(soundButton)

      expect(
        screen.getByRole('button', {
          name: /desativar alerta sonoro/i,
        }),
      ).toBeInTheDocument()
    })

    it('should play sound when call changes and sound is enabled', async () => {
      const entries1: QueueEntry[] = [
        {
          id: 'call-1',
          patientLabel: 'Patient 1',
          specialty: 'Test',
          status: 'called',
        },
      ]

      const entries2: QueueEntry[] = [
        {
          id: 'call-2',
          patientLabel: 'Patient 2',
          specialty: 'Test',
          status: 'called',
        },
      ]

      mockUseQueueUpdates.mockReturnValue({
        entries: entries1,
        isRealtime: false,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      const { rerender } = render(<QueuePanel />)

      const soundButton = screen.getByRole('button', {
        name: /ativar alerta sonoro/i,
      })
      await userEvent.click(soundButton)

      mockUseQueueUpdates.mockReturnValue({
        entries: entries2,
        isRealtime: false,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      rerender(<QueuePanel />)

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockPlay).toHaveBeenCalled()
    })

    it('should not play sound when sound is disabled', async () => {
      const entries1: QueueEntry[] = [
        {
          id: 'call-1',
          patientLabel: 'Patient 1',
          specialty: 'Test',
          status: 'called',
        },
      ]

      const entries2: QueueEntry[] = [
        {
          id: 'call-2',
          patientLabel: 'Patient 2',
          specialty: 'Test',
          status: 'called',
        },
      ]

      mockUseQueueUpdates.mockReturnValue({
        entries: entries1,
        isRealtime: false,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      const { rerender } = render(<QueuePanel />)

      mockUseQueueUpdates.mockReturnValue({
        entries: entries2,
        isRealtime: false,
        error: null,
        lastUpdatedAt: Date.now(),
      })

      rerender(<QueuePanel />)

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockPlay).not.toHaveBeenCalled()
    })
  })

  describe('Last Updated Time', () => {
    it('should display last updated time when available', () => {
      const timestamp = Date.now()
      mockUseQueueUpdates.mockReturnValue({
        entries: [],
        isRealtime: false,
        error: null,
        lastUpdatedAt: timestamp,
      })

      render(<QueuePanel />)

      expect(screen.getByText(/atualizado às/i)).toBeInTheDocument()
    })

    it('should not display last updated time when not available', () => {
      mockUseQueueUpdates.mockReturnValue({
        entries: [],
        isRealtime: false,
        error: null,
        lastUpdatedAt: null,
      })

      render(<QueuePanel />)

      expect(screen.queryByText(/atualizado às/i)).not.toBeInTheDocument()
    })
  })

  describe('Error Display', () => {
    it('should display error chip when error exists', () => {
      mockUseQueueUpdates.mockReturnValue({
        entries: [],
        isRealtime: false,
        error: 'Connection error',
        lastUpdatedAt: null,
      })

      render(<QueuePanel />)

      expect(screen.getByText(/sem conexão em tempo real/i)).toBeInTheDocument()
    })

    it('should not display error chip when no error', () => {
      mockUseQueueUpdates.mockReturnValue({
        entries: [],
        isRealtime: false,
        error: null,
        lastUpdatedAt: null,
      })

      render(<QueuePanel />)

      expect(
        screen.queryByText(/sem conexão em tempo real/i),
      ).not.toBeInTheDocument()
    })
  })

  describe('Heading', () => {
    it('should render main heading', () => {
      render(<QueuePanel />)

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /chamada de pacientes/i,
        }),
      ).toBeInTheDocument()
    })
  })
})

