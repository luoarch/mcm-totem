import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpdateNotification } from '../UpdateNotification'

const { logErrorMock, updateServiceWorkerMock, setNeedRefreshMock, setOfflineReadyMock, mockUseRegisterSW } = vi.hoisted(() => {
  const logError = vi.fn()
  const updateServiceWorker = vi.fn()
  const setNeedRefresh = vi.fn()
  const setOfflineReady = vi.fn()
  const useRegisterSW = vi.fn(() => ({
    needRefresh: [false, setNeedRefresh],
    offlineReady: [false, setOfflineReady],
    updateServiceWorker: updateServiceWorker,
  }))
  return {
    logErrorMock: logError,
    updateServiceWorkerMock: updateServiceWorker,
    setNeedRefreshMock: setNeedRefresh,
    setOfflineReadyMock: setOfflineReady,
    mockUseRegisterSW: useRegisterSW,
  }
})

vi.mock('../../utils/logger', () => ({
  logError: logErrorMock,
}))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: mockUseRegisterSW,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUseRegisterSW.mockReturnValue({
    needRefresh: [false, setNeedRefreshMock],
    offlineReady: [false, setOfflineReadyMock],
    updateServiceWorker: updateServiceWorkerMock.mockResolvedValue(undefined),
  })
})

describe('UpdateNotification', () => {
  describe('Initial State', () => {
    it('should not show notification when needRefresh and offlineReady are false', () => {
      render(<UpdateNotification />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Need Refresh Notification', () => {
    it('should show notification when needRefresh is true', async () => {
      mockUseRegisterSW.mockReturnValue({
        needRefresh: [true, setNeedRefreshMock],
        offlineReady: [false, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock.mockResolvedValue(undefined),
      })

      render(<UpdateNotification />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      expect(
        screen.getByText(
          /nova versão disponível. atualize para continuar com a versão mais recente/i,
        ),
      ).toBeInTheDocument()
    })

    it('should show update button when needRefresh is true', async () => {
      mockUseRegisterSW.mockReturnValue({
        needRefresh: [true, setNeedRefreshMock],
        offlineReady: [false, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock.mockResolvedValue(undefined),
      })

      render(<UpdateNotification />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /atualizar/i })).toBeInTheDocument()
      })
    })

    it('should not auto-hide when needRefresh is true', async () => {
      mockUseRegisterSW.mockReturnValue({
        needRefresh: [true, setNeedRefreshMock],
        offlineReady: [false, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock.mockResolvedValue(undefined),
      })

      render(<UpdateNotification />)

      await waitFor(() => {
        const snackbar = screen.getByRole('alert').closest('.MuiSnackbar-root')
        expect(snackbar).toBeInTheDocument()
      })
    })
  })

  describe('Offline Ready Notification', () => {
    it('should show notification when offlineReady is true', async () => {
      mockUseRegisterSW.mockReturnValue({
        needRefresh: [false, setNeedRefreshMock],
        offlineReady: [true, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock.mockResolvedValue(undefined),
      })

      render(<UpdateNotification />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      expect(
        screen.getByText(/aplicativo pronto para uso offline/i),
      ).toBeInTheDocument()
    })

    it('should show OK button when offlineReady is true', async () => {
      mockUseRegisterSW.mockReturnValue({
        needRefresh: [false, setNeedRefreshMock],
        offlineReady: [true, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock.mockResolvedValue(undefined),
      })

      render(<UpdateNotification />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument()
      })
    })
  })

  describe('Update Action', () => {
    it('should call updateServiceWorker when update button is clicked', async () => {
      const user = userEvent.setup()
      updateServiceWorkerMock.mockResolvedValue(undefined)

      mockUseRegisterSW.mockReturnValue({
        needRefresh: [true, setNeedRefreshMock],
        offlineReady: [false, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock,
      })

      render(<UpdateNotification />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /atualizar/i })).toBeInTheDocument()
      })

      const updateButton = screen.getByRole('button', { name: /atualizar/i })
      await user.click(updateButton)

      expect(updateServiceWorkerMock).toHaveBeenCalledWith(true)
    })

    it('should close notification after update', async () => {
      const user = userEvent.setup()
      updateServiceWorkerMock.mockResolvedValue(undefined)

      mockUseRegisterSW.mockReturnValue({
        needRefresh: [true, setNeedRefreshMock],
        offlineReady: [false, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock,
      })

      render(<UpdateNotification />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /atualizar/i })).toBeInTheDocument()
      })

      const updateButton = screen.getByRole('button', { name: /atualizar/i })
      await user.click(updateButton)

      expect(setNeedRefreshMock).toHaveBeenCalledWith(false)
      expect(setOfflineReadyMock).toHaveBeenCalledWith(false)
    })

    it('should log error when updateServiceWorker fails', async () => {
      const user = userEvent.setup()
      const updateError = new Error('Update failed')
      updateServiceWorkerMock.mockRejectedValue(updateError)

      mockUseRegisterSW.mockReturnValue({
        needRefresh: [true, setNeedRefreshMock],
        offlineReady: [false, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock,
      })

      render(<UpdateNotification />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /atualizar/i })).toBeInTheDocument()
      })

      const updateButton = screen.getByRole('button', { name: /atualizar/i })
      await user.click(updateButton)

      await waitFor(
        () => {
          expect(logErrorMock).toHaveBeenCalledWith(
            'Falha ao atualizar service worker',
            updateError,
          )
        },
        { timeout: 3000 },
      )
    })
  })

  describe('Close Action', () => {
    it('should close notification when OK button is clicked', async () => {
      const user = userEvent.setup()

      mockUseRegisterSW.mockReturnValue({
        needRefresh: [false, setNeedRefreshMock],
        offlineReady: [true, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock.mockResolvedValue(undefined),
      })

      render(<UpdateNotification />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument()
      })

      const okButton = screen.getByRole('button', { name: /ok/i })
      await user.click(okButton)

      expect(setNeedRefreshMock).toHaveBeenCalledWith(false)
      expect(setOfflineReadyMock).toHaveBeenCalledWith(false)
    })

    it('should close notification when close button is clicked', async () => {
      const user = userEvent.setup()

      mockUseRegisterSW.mockReturnValue({
        needRefresh: [true, setNeedRefreshMock],
        offlineReady: [false, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock.mockResolvedValue(undefined),
      })

      render(<UpdateNotification />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      const alert = screen.getByRole('alert')
      const closeButton = alert.querySelector('[aria-label="Close"]')
      if (closeButton) {
        await user.click(closeButton)
        expect(setNeedRefreshMock).toHaveBeenCalledWith(false)
        expect(setOfflineReadyMock).toHaveBeenCalledWith(false)
      }
    })
  })

  describe('Notification Severity', () => {
    it('should use info severity for needRefresh', async () => {
      mockUseRegisterSW.mockReturnValue({
        needRefresh: [true, setNeedRefreshMock],
        offlineReady: [false, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock.mockResolvedValue(undefined),
      })

      render(<UpdateNotification />)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveClass('MuiAlert-filledInfo')
      })
    })

    it('should use success severity for offlineReady', async () => {
      mockUseRegisterSW.mockReturnValue({
        needRefresh: [false, setNeedRefreshMock],
        offlineReady: [true, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock.mockResolvedValue(undefined),
      })

      render(<UpdateNotification />)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveClass('MuiAlert-filledSuccess')
      })
    })
  })

  describe('Snackbar Position', () => {
    it('should position snackbar at bottom center', async () => {
      mockUseRegisterSW.mockReturnValue({
        needRefresh: [true, setNeedRefreshMock],
        offlineReady: [false, setOfflineReadyMock],
        updateServiceWorker: updateServiceWorkerMock.mockResolvedValue(undefined),
      })

      const { container } = render(<UpdateNotification />)

      await waitFor(() => {
        const snackbar = container.querySelector('.MuiSnackbar-root')
        expect(snackbar).toBeInTheDocument()
      })
    })
  })
})

