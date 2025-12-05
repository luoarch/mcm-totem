import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WelcomeStep } from '../WelcomeStep'

describe('WelcomeStep', () => {
  let mockOnStart: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    mockOnStart = vi.fn<() => void>()
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render welcome heading', () => {
      render(<WelcomeStep onStart={mockOnStart} />)

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: /bem-vindo ao autoatendimento/i,
        }),
      ).toBeInTheDocument()
    })

    it('should render instruction text', () => {
      render(<WelcomeStep onStart={mockOnStart} />)

      expect(
        screen.getByText(/toque em qualquer lugar da tela para iniciar/i),
      ).toBeInTheDocument()
    })

    it('should render start button', () => {
      render(<WelcomeStep onStart={mockOnStart} />)

      expect(
        screen.getByRole('button', { name: /iniciar atendimento/i }),
      ).toBeInTheDocument()
    })

    it('should render clickable container with aria-label', () => {
      render(<WelcomeStep onStart={mockOnStart} />)

      const container = screen.getByRole('button', {
        name: /toque para iniciar o atendimento/i,
      })
      expect(container).toBeInTheDocument()
      expect(container).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Click Interactions', () => {
    it('should call onStart when container is clicked', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onStart={mockOnStart} />)

      const container = screen.getByRole('button', {
        name: /toque para iniciar o atendimento/i,
      })
      await user.click(container)

      expect(mockOnStart).toHaveBeenCalledTimes(1)
    })

    it('should call onStart when start button is clicked', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onStart={mockOnStart} />)

      const startButton = screen.getByRole('button', {
        name: /iniciar atendimento/i,
      })
      await user.click(startButton)

      expect(mockOnStart).toHaveBeenCalledTimes(1)
    })

    it('should call onStart when container is touched', async () => {
      render(<WelcomeStep onStart={mockOnStart} />)

      const container = screen.getByRole('button', {
        name: /toque para iniciar o atendimento/i,
      })

      const touchEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
      })
      container.dispatchEvent(touchEvent)

      expect(mockOnStart).toHaveBeenCalledTimes(1)
    })
  })

  describe('Keyboard Interactions', () => {
    it('should call onStart when Enter key is pressed', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onStart={mockOnStart} />)

      const container = screen.getByRole('button', {
        name: /toque para iniciar o atendimento/i,
      })
      container.focus()

      await user.keyboard('{Enter}')

      expect(mockOnStart).toHaveBeenCalledTimes(1)
    })

    it('should call onStart when Space key is pressed', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onStart={mockOnStart} />)

      const container = screen.getByRole('button', {
        name: /toque para iniciar o atendimento/i,
      })
      container.focus()

      await user.keyboard(' ')

      expect(mockOnStart).toHaveBeenCalledTimes(1)
    })

    it('should prevent default behavior when Enter is pressed', () => {
      render(<WelcomeStep onStart={mockOnStart} />)

      const container = screen.getByRole('button', {
        name: /toque para iniciar o atendimento/i,
      })
      container.focus()

      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      })

      const preventDefaultSpy = vi.spyOn(keydownEvent, 'preventDefault')
      container.dispatchEvent(keydownEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should prevent default behavior when Space is pressed', () => {
      render(<WelcomeStep onStart={mockOnStart} />)

      const container = screen.getByRole('button', {
        name: /toque para iniciar o atendimento/i,
      })
      container.focus()

      const keydownEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      })

      const preventDefaultSpy = vi.spyOn(keydownEvent, 'preventDefault')
      container.dispatchEvent(keydownEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should not call onStart when other keys are pressed', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onStart={mockOnStart} />)

      const container = screen.getByRole('button', {
        name: /toque para iniciar o atendimento/i,
      })
      container.focus()

      await user.keyboard('{Escape}')
      await user.keyboard('a')
      await user.keyboard('{Tab}')

      expect(mockOnStart).not.toHaveBeenCalled()
    })
  })

  describe('Multiple Calls', () => {
    it('should handle multiple clicks correctly', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onStart={mockOnStart} />)

      const startButton = screen.getByRole('button', {
        name: /iniciar atendimento/i,
      })

      await user.click(startButton)
      await user.click(startButton)
      await user.click(startButton)

      expect(mockOnStart).toHaveBeenCalledTimes(3)
    })
  })
})
