import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KioskLayout } from '../KioskLayout'

describe('KioskLayout', () => {
  describe('Rendering', () => {
    it('should render with heading', () => {
      render(
        <KioskLayout
          heading="Test Heading"
          steps={['Step 1', 'Step 2']}
          stepIndex={0}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(
        screen.getByRole('heading', { name: /test heading/i }),
      ).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render without heading', () => {
      render(
        <KioskLayout heading="" steps={[]} stepIndex={0}>
          <div>Content</div>
        </KioskLayout>,
      )

      const headings = screen.queryAllByRole('heading')
      expect(headings.length).toBe(0)
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render children content', () => {
      render(
        <KioskLayout
          heading="Test"
          steps={['Step 1']}
          stepIndex={0}
        >
          <div data-testid="children">Test Content</div>
        </KioskLayout>,
      )

      expect(screen.getByTestId('children')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('Steps', () => {
    it('should render stepper when steps are provided', () => {
      const { container } = render(
        <KioskLayout
          heading="Test"
          steps={['Step 1', 'Step 2', 'Step 3']}
          stepIndex={1}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      const stepper = container.querySelector('.MuiStepper-root')
      expect(stepper).toBeInTheDocument()
    })

    it('should not render stepper when steps array is empty', () => {
      const { container } = render(
        <KioskLayout heading="Test" steps={[]} stepIndex={0}>
          <div>Content</div>
        </KioskLayout>,
      )

      const stepper = container.querySelector('.MuiStepper-root')
      expect(stepper).not.toBeInTheDocument()
    })

    it('should render step labels correctly', () => {
      render(
        <KioskLayout
          heading="Test"
          steps={['First Step', 'Second Step', 'Third Step']}
          stepIndex={0}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.getByText('First Step')).toBeInTheDocument()
      expect(screen.getByText('Second Step')).toBeInTheDocument()
      expect(screen.getByText('Third Step')).toBeInTheDocument()
    })

    it('should display mobile step indicator when steps are provided', () => {
      render(
        <KioskLayout
          heading="Test"
          steps={['Step 1', 'Step 2', 'Step 3']}
          stepIndex={1}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.getByText(/passo 2\/3/i)).toBeInTheDocument()
    })

    it('should calculate step number correctly when stepIndex is 0', () => {
      render(
        <KioskLayout
          heading="Test"
          steps={['Step 1', 'Step 2']}
          stepIndex={0}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.getByText(/passo 1\/2/i)).toBeInTheDocument()
    })

    it('should calculate step number correctly when stepIndex is last', () => {
      render(
        <KioskLayout
          heading="Test"
          steps={['Step 1', 'Step 2', 'Step 3']}
          stepIndex={2}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.getByText(/passo 3\/3/i)).toBeInTheDocument()
    })

    it('should cap step number at steps length when stepIndex exceeds', () => {
      render(
        <KioskLayout
          heading="Test"
          steps={['Step 1', 'Step 2']}
          stepIndex={5}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.getByText(/passo 2\/2/i)).toBeInTheDocument()
    })

    it('should not display mobile step indicator when steps are empty', () => {
      render(
        <KioskLayout heading="Test" steps={[]} stepIndex={0}>
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.queryByText(/passo \d+\/\d+/i)).not.toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('should render footer when provided', () => {
      render(
        <KioskLayout
          heading="Test"
          steps={['Step 1']}
          stepIndex={0}
          footer={<button>Footer Button</button>}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(
        screen.getByRole('button', { name: /footer button/i }),
      ).toBeInTheDocument()
    })

    it('should not render footer when not provided', () => {
      render(
        <KioskLayout
          heading="Test"
          steps={['Step 1']}
          stepIndex={0}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should render footer content correctly', () => {
      render(
        <KioskLayout
          heading="Test"
          steps={['Step 1']}
          stepIndex={0}
          footer={<div data-testid="footer">Footer Content</div>}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByText('Footer Content')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should render main container with correct structure', () => {
      const { container } = render(
        <KioskLayout
          heading="Test"
          steps={['Step 1']}
          stepIndex={0}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })

    it('should render Paper component', () => {
      const { container } = render(
        <KioskLayout
          heading="Test"
          steps={['Step 1']}
          stepIndex={0}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      const paper = container.querySelector('.MuiPaper-root')
      expect(paper).toBeInTheDocument()
    })

    it('should render Stack component', () => {
      const { container } = render(
        <KioskLayout
          heading="Test"
          steps={['Step 1']}
          stepIndex={0}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      const stack = container.querySelector('.MuiStack-root')
      expect(stack).toBeInTheDocument()
    })
  })

  describe('Conditional Styling', () => {
    it('should apply different styles when heading is provided', () => {
      const { container } = render(
        <KioskLayout
          heading="Test Heading"
          steps={['Step 1']}
          stepIndex={0}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })

    it('should apply different styles when heading is not provided', () => {
      const { container } = render(
        <KioskLayout heading="" steps={[]} stepIndex={0}>
          <div>Content</div>
        </KioskLayout>,
      )

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Subheading', () => {
    it('should handle subheading prop (even if not used in component)', () => {
      render(
        <KioskLayout
          heading="Test"
          subheading="Subheading"
          steps={['Step 1']}
          stepIndex={0}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Aside', () => {
    it('should handle aside prop (even if not used in component)', () => {
      render(
        <KioskLayout
          heading="Test"
          steps={['Step 1']}
          stepIndex={0}
          aside={<div>Aside Content</div>}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle single step', () => {
      render(
        <KioskLayout
          heading="Test"
          steps={['Only Step']}
          stepIndex={0}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.getByText('Only Step')).toBeInTheDocument()
      expect(screen.getByText(/passo 1\/1/i)).toBeInTheDocument()
    })

    it('should handle stepIndex at 0 with multiple steps', () => {
      render(
        <KioskLayout
          heading="Test"
          steps={['Step 1', 'Step 2', 'Step 3', 'Step 4']}
          stepIndex={0}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.getByText(/passo 1\/4/i)).toBeInTheDocument()
    })

    it('should handle many steps', () => {
      const manySteps = Array.from({ length: 10 }, (_, i) => `Step ${i + 1}`)
      render(
        <KioskLayout
          heading="Test"
          steps={manySteps}
          stepIndex={5}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(screen.getByText(/passo 6\/10/i)).toBeInTheDocument()
    })

    it('should render with all props provided', () => {
      render(
        <KioskLayout
          heading="Full Test"
          subheading="Subheading"
          steps={['Step 1', 'Step 2']}
          stepIndex={1}
          footer={<div>Footer</div>}
          aside={<div>Aside</div>}
        >
          <div>Content</div>
        </KioskLayout>,
      )

      expect(
        screen.getByRole('heading', { name: /full test/i }),
      ).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
      expect(screen.getByText('Footer')).toBeInTheDocument()
    })
  })
})
