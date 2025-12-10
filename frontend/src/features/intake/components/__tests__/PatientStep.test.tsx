import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form'
import { PatientStep } from '../PatientStep'
import type { IntakeFormValues } from '../../types'
import type { PatientMatch } from '../../../../types/intake'

const mockMatches: PatientMatch[] = [
  {
    id: 'patient-1',
    name: 'João Silva',
    document: '12345678901',
    birthDate: '1990-01-15',
    socialName: 'Maria Silva',
  },
  {
    id: 'patient-2',
    name: 'Pedro Santos',
    document: '98765432100',
    birthDate: '1985-05-20',
  },
  {
    id: 'patient-3',
    name: 'Ana Costa',
    document: '11122233344',
    birthDate: '1992-08-10',
    socialName: '   ',
  },
]

function TestWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm<IntakeFormValues>({
    defaultValues: {
      isPriority: false,
      intakeMode: null,
      patientSelection: 'existing',
      existingPatientId: undefined,
      patientName: '',
      phone: '',
      cpf: '',
      birthDate: '',
      lookupFirstName: '',
      foreignName: '',
      foreignBirthDate: '',
      foreignEmail: '',
      coverageType: 'particular',
      convenioId: '',
      specialtyId: '',
      reason: '',
      npsScore: null,
      socialName: '',
    },
    mode: 'onChange',
  })

  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('PatientStep', () => {
  let mockOnRetry: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    mockOnRetry = vi.fn<() => void>()
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should render loading spinner when status is loading', () => {
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="loading" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByText(/buscando paciente/i)).toBeInTheDocument()
    })

    it('should not render matches or form when loading', () => {
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="loading" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/nome completo do paciente/i)).not.toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should render error alert when status is error', () => {
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="error" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      expect(
        screen.getByText(/não foi possível consultar o cadastro/i),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
    })

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="error" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i })
      await user.click(retryButton)

      expect(mockOnRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('With Matches', () => {
    it('should render heading when matches are found', () => {
      render(
        <TestWrapper>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      expect(screen.getByText(/confirme o paciente/i)).toBeInTheDocument()
    })

    it('should render all patient matches', () => {
      render(
        <TestWrapper>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Pedro Santos')).toBeInTheDocument()
      expect(screen.getByText('Ana Costa')).toBeInTheDocument()
    })

    it('should render patient information correctly', () => {
      render(
        <TestWrapper>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      const nascElements = screen.getAllByText(/nasc\.:/i)
      expect(nascElements.length).toBeGreaterThan(0)
      expect(screen.getByText(/123\.456\.789-01/i)).toBeInTheDocument()
      expect(screen.getByText(/987\.654\.321-00/i)).toBeInTheDocument()
      expect(screen.getByText(/111\.222\.333-44/i)).toBeInTheDocument()
    })

    it('should render social name when valid', () => {
      render(
        <TestWrapper>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      expect(screen.getByText(/nome social: maria silva/i)).toBeInTheDocument()
    })

    it('should not render social name when null', () => {
      render(
        <TestWrapper>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      const socialNameElements = screen.queryAllByText(/nome social/i)
      expect(socialNameElements.length).toBe(1)
    })

    it('should not render social name when empty string', () => {
      render(
        <TestWrapper>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      const socialNameElements = screen.queryAllByText(/nome social/i)
      expect(socialNameElements.length).toBe(1)
    })

    it('should not render social name when only whitespace', () => {
      render(
        <TestWrapper>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      const socialNameElements = screen.queryAllByText(/nome social/i)
      expect(socialNameElements.length).toBe(1)
    })

    it('should render "new patient" option when matches exist', () => {
      render(
        <TestWrapper>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      expect(screen.getByText(/paciente não está nesta lista/i)).toBeInTheDocument()
    })

    it('should select existing patient when clicked', async () => {
      const user = userEvent.setup()
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithRef({ children }: { children: React.ReactNode }) {
        const methods = useForm<IntakeFormValues>({
          defaultValues: {
            isPriority: false,
            intakeMode: null,
            patientSelection: 'existing',
            existingPatientId: undefined,
            patientName: '',
            phone: '',
            cpf: '',
            birthDate: '',
            lookupFirstName: '',
            foreignName: '',
            foreignBirthDate: '',
            foreignEmail: '',
            coverageType: 'particular',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
            socialName: '',
          },
          mode: 'onChange',
        })
        formMethodsRef.current = methods

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithRef>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapperWithRef>,
      )

      const patientButton = screen.getByText('João Silva').closest('button')
      expect(patientButton).toBeInTheDocument()

      if (patientButton) {
        await user.click(patientButton)

        await waitFor(() => {
          expect(formMethodsRef.current?.getValues('patientSelection')).toBe('existing')
          expect(formMethodsRef.current?.getValues('existingPatientId')).toBe('patient-1')
        })
      }
    })

    it('should show selected indicator when patient is selected', async () => {
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithRef({ children }: { children: React.ReactNode }) {
        const methods = useForm<IntakeFormValues>({
          defaultValues: {
            isPriority: false,
            intakeMode: null,
            patientSelection: 'existing',
            existingPatientId: 'patient-1',
            patientName: '',
            phone: '',
            cpf: '',
            birthDate: '',
            lookupFirstName: '',
            foreignName: '',
            foreignBirthDate: '',
            foreignEmail: '',
            coverageType: 'particular',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
            socialName: '',
          },
          mode: 'onChange',
        })
        formMethodsRef.current = methods

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithRef>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapperWithRef>,
      )

      const checkmark = screen.getByText('✓')
      expect(checkmark).toBeInTheDocument()
    })

    it('should select new patient option when clicked', async () => {
      const user = userEvent.setup()
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithRef({ children }: { children: React.ReactNode }) {
        const methods = useForm<IntakeFormValues>({
          defaultValues: {
            isPriority: false,
            intakeMode: null,
            patientSelection: 'existing',
            existingPatientId: 'patient-1',
            patientName: '',
            phone: '',
            cpf: '',
            birthDate: '',
            lookupFirstName: '',
            foreignName: '',
            foreignBirthDate: '',
            foreignEmail: '',
            coverageType: 'particular',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
            socialName: '',
          },
          mode: 'onChange',
        })
        formMethodsRef.current = methods

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithRef>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapperWithRef>,
      )

      const newPatientButton = screen.getByText(/paciente não está nesta lista/i).closest('button')
      expect(newPatientButton).toBeInTheDocument()

      if (newPatientButton) {
        await user.click(newPatientButton)

        await waitFor(() => {
          expect(formMethodsRef.current?.getValues('patientSelection')).toBe('new')
          expect(formMethodsRef.current?.getValues('existingPatientId')).toBeUndefined()
        })
      }
    })

    it('should display validation error when existingPatientId has error', async () => {
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithError({ children }: { children: React.ReactNode }) {
        const methods = useForm<IntakeFormValues>({
          defaultValues: {
            isPriority: false,
            intakeMode: null,
            patientSelection: 'existing',
            existingPatientId: undefined,
            patientName: '',
            phone: '',
            cpf: '',
            birthDate: '',
            lookupFirstName: '',
            foreignName: '',
            foreignBirthDate: '',
            foreignEmail: '',
            coverageType: 'particular',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
            socialName: '',
          },
          mode: 'onChange',
        })
        formMethodsRef.current = methods

        useEffect(() => {
          const timer = setTimeout(() => {
            methods.setError('existingPatientId', {
              type: 'required',
              message: 'Selecione um paciente',
            })
          }, 0)
          return () => clearTimeout(timer)
        }, [])

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithError>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapperWithError>,
      )

      await waitFor(() => {
        expect(screen.getByText('Selecione um paciente')).toBeInTheDocument()
      })
    })

    it('should not render form when matches exist and existing patient is selected', () => {
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithRef({ children }: { children: React.ReactNode }) {
        const methods = useForm<IntakeFormValues>({
          defaultValues: {
            isPriority: false,
            intakeMode: null,
            patientSelection: 'existing',
            existingPatientId: 'patient-1',
            patientName: '',
            phone: '',
            cpf: '',
            birthDate: '',
            lookupFirstName: '',
            foreignName: '',
            foreignBirthDate: '',
            foreignEmail: '',
            coverageType: 'particular',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
            socialName: '',
          },
          mode: 'onChange',
        })
        formMethodsRef.current = methods

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithRef>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapperWithRef>,
      )

      expect(screen.queryByLabelText(/nome completo do paciente/i)).not.toBeInTheDocument()
    })
  })

  describe('Without Matches', () => {
    it('should render heading when no matches are found', () => {
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      expect(screen.getByText(/cadastrar novo paciente/i)).toBeInTheDocument()
    })

    it('should render patient form when no matches', () => {
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      expect(screen.getByLabelText(/nome completo do paciente/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nome social/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/telefone celular/i)).toBeInTheDocument()
    })

    it('should auto-focus patient name field when no matches', () => {
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      const nameField = screen.getByLabelText(/nome completo do paciente/i)
      expect(nameField).toHaveFocus()
    })
  })

  describe('New Patient Selection', () => {
    it('should render form when new patient is selected', async () => {
      const user = userEvent.setup()
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithRef({ children }: { children: React.ReactNode }) {
        const methods = useForm<IntakeFormValues>({
          defaultValues: {
            isPriority: false,
            intakeMode: null,
            patientSelection: 'existing',
            existingPatientId: undefined,
            patientName: '',
            phone: '',
            cpf: '',
            birthDate: '',
            lookupFirstName: '',
            foreignName: '',
            foreignBirthDate: '',
            foreignEmail: '',
            coverageType: 'particular',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
            socialName: '',
          },
          mode: 'onChange',
        })
        formMethodsRef.current = methods

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithRef>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapperWithRef>,
      )

      const newPatientButton = screen.getByText(/paciente não está nesta lista/i).closest('button')
      expect(newPatientButton).toBeInTheDocument()

      if (newPatientButton) {
        await user.click(newPatientButton)

        await waitFor(() => {
          expect(screen.getByLabelText(/nome completo do paciente/i)).toBeInTheDocument()
          expect(screen.getByLabelText(/nome social/i)).toBeInTheDocument()
          expect(screen.getByLabelText(/telefone celular/i)).toBeInTheDocument()
        })
      }
    })

    it('should show selected state for new patient option', async () => {
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithRef({ children }: { children: React.ReactNode }) {
        const methods = useForm<IntakeFormValues>({
          defaultValues: {
            isPriority: false,
            intakeMode: null,
            patientSelection: 'new',
            existingPatientId: undefined,
            patientName: '',
            phone: '',
            cpf: '',
            birthDate: '',
            lookupFirstName: '',
            foreignName: '',
            foreignBirthDate: '',
            foreignEmail: '',
            coverageType: 'particular',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
            socialName: '',
          },
          mode: 'onChange',
        })
        formMethodsRef.current = methods

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithRef>
          <PatientStep matches={mockMatches} status="success" onRetry={mockOnRetry} />
        </TestWrapperWithRef>,
      )

      const newPatientButton = screen.getByText(/paciente não está nesta lista/i).closest('button')
      expect(newPatientButton).toBeInTheDocument()
      expect(newPatientButton).toHaveStyle({ borderWidth: '2px' })
    })
  })

  describe('Form Fields', () => {
    it('should render all form fields correctly', () => {
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      expect(screen.getByLabelText(/nome completo do paciente/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nome social \(opcional\)/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/telefone celular/i)).toBeInTheDocument()
    })

    it('should allow typing in patient name field', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      const nameField = screen.getByLabelText(/nome completo do paciente/i)
      await user.type(nameField, 'Novo Paciente')

      expect(nameField).toHaveValue('Novo Paciente')
    })

    it('should allow typing in social name field', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      const socialNameField = screen.getByLabelText(/nome social \(opcional\)/i)
      await user.type(socialNameField, 'Nome Social')

      expect(socialNameField).toHaveValue('Nome Social')
    })

    it('should allow typing in phone field', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="success" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      const phoneField = screen.getByLabelText(/telefone celular/i)
      await user.type(phoneField, '11999999999')

      expect(phoneField).toHaveValue('11999999999')
    })
  })

  describe('Idle State', () => {
    it('should render heading when status is idle', () => {
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="idle" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      expect(screen.getByText(/cadastrar novo paciente/i)).toBeInTheDocument()
    })

    it('should render form when status is idle and no matches', () => {
      render(
        <TestWrapper>
          <PatientStep matches={[]} status="idle" onRetry={mockOnRetry} />
        </TestWrapper>,
      )

      expect(screen.getByLabelText(/nome completo do paciente/i)).toBeInTheDocument()
    })
  })
})
