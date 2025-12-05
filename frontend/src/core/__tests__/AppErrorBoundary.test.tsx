import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppErrorBoundary } from '../AppErrorBoundary'

const { logErrorMock } = vi.hoisted(() => ({
  logErrorMock: vi.fn(),
}))

vi.mock('../../utils/logger', () => ({
  logError: logErrorMock,
}))

let reloadMock: ReturnType<typeof vi.fn>
const originalLocation = window.location

beforeEach(() => {
  vi.clearAllMocks()
  reloadMock = vi.fn()
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, reload: reloadMock },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
    configurable: true,
  })
})

describe('AppErrorBoundary', () => {
  describe('Normal Rendering', () => {
    it('should render children when there is no error', () => {
      render(
        <AppErrorBoundary>
          <div>Test Content</div>
        </AppErrorBoundary>,
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render multiple children when there is no error', () => {
      render(
        <AppErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </AppErrorBoundary>,
      )

      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should catch render errors and display fallback UI', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <AppErrorBoundary>
          <ThrowError />
        </AppErrorBoundary>,
      )

      expect(screen.getByText(/algo saiu errado/i)).toBeInTheDocument()
      expect(
        screen.getByText(
          /recarregue o totem para tentar novamente/i,
        ),
      ).toBeInTheDocument()
    })

    it('should log error when error is caught', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <AppErrorBoundary>
          <ThrowError />
        </AppErrorBoundary>,
      )

      await waitFor(
        () => {
          expect(logErrorMock).toHaveBeenCalledWith(
            'Erro capturado pelo boundary',
            expect.any(Error),
            expect.objectContaining({
              componentStack: expect.any(String),
            }),
          )
        },
        { timeout: 3000 },
      )
    })

    it('should display reload button', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <AppErrorBoundary>
          <ThrowError />
        </AppErrorBoundary>,
      )

      const reloadButton = screen.getByRole('button', { name: /recarregar/i })
      expect(reloadButton).toBeInTheDocument()
    })
  })

  describe('Reload Functionality', () => {
    it('should reload page when reload button is clicked', async () => {
      const user = userEvent.setup()
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <AppErrorBoundary>
          <ThrowError />
        </AppErrorBoundary>,
      )

      const reloadButton = screen.getByRole('button', { name: /recarregar/i })
      await user.click(reloadButton)

      expect(reloadMock).toHaveBeenCalled()
    })

    it('should reset error state when reload is called', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <AppErrorBoundary>
          <ThrowError />
        </AppErrorBoundary>,
      )

      const reloadButton = screen.getByRole('button', { name: /recarregar/i })
      reloadButton.click()

      expect(reloadMock).toHaveBeenCalled()
    })
  })

  describe('Error Boundary State', () => {
    it('should initialize with hasError false', () => {
      const { container } = render(
        <AppErrorBoundary>
          <div>Test</div>
        </AppErrorBoundary>,
      )

      expect(container.querySelector('.MuiPaper-root')).not.toBeInTheDocument()
    })

    it('should set hasError to true when error occurs', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <AppErrorBoundary>
          <ThrowError />
        </AppErrorBoundary>,
      )

      expect(screen.getByText(/algo saiu errado/i)).toBeInTheDocument()
    })
  })

  describe('Layout', () => {
    it('should render error UI in centered layout', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { container } = render(
        <AppErrorBoundary>
          <ThrowError />
        </AppErrorBoundary>,
      )

      const box = container.querySelector('.MuiBox-root')
      expect(box).toBeInTheDocument()
    })

    it('should render error content in Paper component', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { container } = render(
        <AppErrorBoundary>
          <ThrowError />
        </AppErrorBoundary>,
      )

      const paper = container.querySelector('.MuiPaper-root')
      expect(paper).toBeInTheDocument()
    })

    it('should render error content in Stack layout', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { container } = render(
        <AppErrorBoundary>
          <ThrowError />
        </AppErrorBoundary>,
      )

      const stacks = container.querySelectorAll('.MuiStack-root')
      expect(stacks.length).toBeGreaterThan(0)
    })
  })

  describe('Error Information', () => {
    it('should include error message in log', async () => {
      const testError = new Error('Specific test error')
      const ThrowError = () => {
        throw testError
      }

      render(
        <AppErrorBoundary>
          <ThrowError />
        </AppErrorBoundary>,
      )

      await waitFor(
        () => {
          expect(logErrorMock).toHaveBeenCalledWith(
            'Erro capturado pelo boundary',
            testError,
            expect.any(Object),
          )
        },
        { timeout: 3000 },
      )
    })

    it('should include component stack in log', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <AppErrorBoundary>
          <ThrowError />
        </AppErrorBoundary>,
      )

      await waitFor(
        () => {
          expect(logErrorMock).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Error),
            expect.objectContaining({
              componentStack: expect.any(String),
            }),
          )
        },
        { timeout: 3000 },
      )
    })
  })
})
