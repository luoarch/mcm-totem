import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm } from 'react-hook-form'
import { DocumentStep } from '../DocumentStep'
import type { IntakeFormValues } from '../../types'

// Wrapper component to provide react-hook-form context
function TestWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm<IntakeFormValues>({
    defaultValues: {
      lookupFirstName: '',
      cpf: '',
      birthDate: '',
      intakeMode: null,
      patientSelection: 'existing',
      patientName: '',
      phone: '',
      foreignName: '',
      foreignBirthDate: '',
      foreignEmail: '',
      coverageType: 'particular',
      convenioId: '',
      specialtyId: '',
      reason: '',
      npsScore: null,
    },
  })

  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('DocumentStep', () => {
  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      expect(screen.getByLabelText(/primeiro nome/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument()
    })

    it('should render with correct heading', () => {
      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      expect(screen.getByRole('heading', { level: 2, name: /identifique o paciente/i })).toBeInTheDocument()
    })
  })

  describe('First Name Field', () => {
    it('should replace multiple consecutive spaces on change', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)

      await user.type(firstNameInput, 'Maria  Silva')

      // Should replace multiple spaces with single space, but allow leading/trailing
      await waitFor(() => {
        expect(firstNameInput).toHaveValue('Maria Silva')
      })
    })

    it('should extract only first word on blur', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)

      await user.type(firstNameInput, 'Maria Silva Santos')
      await user.tab() // Trigger blur

      await waitFor(() => {
        expect(firstNameInput).toHaveValue('Maria')
      })
    })

    it('should handle multiple words and extract first on blur', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)

      await user.type(firstNameInput, 'João Pedro')
      await user.tab()

      await waitFor(() => {
        expect(firstNameInput).toHaveValue('João')
      })
    })

    it('should respect maxLength of 40 characters', async () => {

      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      const firstNameInput = screen.getByLabelText(/primeiro nome/i) as HTMLInputElement

      expect(firstNameInput.maxLength).toBe(40)
    })
  })

  describe('CPF Field', () => {
    it('should format CPF as user types', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      const cpfInput = screen.getByLabelText(/cpf/i)

      await user.type(cpfInput, '12345678901')

      await waitFor(() => {
        expect(cpfInput).toHaveValue('123.456.789-01')
      })
    })

    it('should strip non-numeric characters from CPF', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      const cpfInput = screen.getByLabelText(/cpf/i)

      await user.type(cpfInput, '123abc456def789')

      await waitFor(() => {
        expect(cpfInput).toHaveValue('123.456.789')
      })
    })

    it('should limit CPF to 14 characters (formatted)', async () => {

      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      const cpfInput = screen.getByLabelText(/cpf/i) as HTMLInputElement

      expect(cpfInput.maxLength).toBe(14)
    })

    it('should have autocomplete disabled', () => {
      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      const cpfInput = screen.getByLabelText(/cpf/i)

      expect(cpfInput).toHaveAttribute('autocomplete', 'off')
    })
  })

  describe('Birth Date Field', () => {
    it('should restrict date to today or earlier', () => {
      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      const birthDateInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
      const today = new Date().toISOString().slice(0, 10)

      expect(birthDateInput.max).toBe(today)
    })

    it('should have date type', () => {
      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)

      expect(birthDateInput).toHaveAttribute('type', 'date')
    })

    it('should accept valid birth date', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)

      await user.type(birthDateInput, '1990-01-01')

      await waitFor(() => {
        expect(birthDateInput).toHaveValue('1990-01-01')
      })
    })
  })

  describe('Error States', () => {
    it('should reserve space for helper text to prevent layout shift', () => {
      render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      // All fields should have helper text (even if empty ' ')
      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      const cpfInput = screen.getByLabelText(/cpf/i)
      const birthDateInput = screen.getByLabelText(/data de nascimento/i)

      // Check that parent elements have helper text elements
      expect(firstNameInput.closest('.MuiFormControl-root')?.querySelector('.MuiFormHelperText-root')).toBeInTheDocument()
      expect(cpfInput.closest('.MuiFormControl-root')?.querySelector('.MuiFormHelperText-root')).toBeInTheDocument()
      expect(birthDateInput.closest('.MuiFormControl-root')?.querySelector('.MuiFormHelperText-root')).toBeInTheDocument()
    })
  })

  describe('Grid Layout', () => {
    it('should render fields in proper grid structure', () => {
      const { container } = render(
        <TestWrapper>
          <DocumentStep />
        </TestWrapper>
      )

      // Should have a Grid container
      const gridContainer = container.querySelector('.MuiGrid-container')
      expect(gridContainer).toBeInTheDocument()

      // Should have Grid items for each field
      const gridItems = container.querySelectorAll('.MuiGrid-root')
      expect(gridItems.length).toBeGreaterThan(0)
    })
  })
})
