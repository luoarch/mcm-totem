import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form'
import { CoverageStep } from '../CoverageStep'
import type { IntakeFormValues } from '../../types'
import type { PayerOption } from '../../../../types/intake'

const mockConvenios: PayerOption[] = [
  { id: 'conv-1', name: 'Convênio A' },
  { id: 'conv-2', name: 'Convênio B' },
  { id: 'conv-3', name: 'Convênio C' },
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
    },
    mode: 'onChange',
  })

  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('CoverageStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render heading', () => {
      render(
        <TestWrapper>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapper>,
      )

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: /como será o atendimento\?/i,
        }),
      ).toBeInTheDocument()
    })

    it('should render both coverage type options', () => {
      render(
        <TestWrapper>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapper>,
      )

      expect(screen.getByText('Particular')).toBeInTheDocument()
      expect(screen.getByText('Convênio')).toBeInTheDocument()
    })

    it('should render options as buttons', () => {
      render(
        <TestWrapper>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapper>,
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Coverage Type Selection', () => {
    it('should select particular when clicked', async () => {
      const user = userEvent.setup()
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithValues({ children }: { children: React.ReactNode }) {
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
            coverageType: 'convenio',
            convenioId: 'conv-1',
            specialtyId: '',
            reason: '',
            npsScore: null,
          },
          mode: 'onChange',
        })

        formMethodsRef.current = methods

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithValues>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapperWithValues>,
      )

      const particularButton = screen.getByText('Particular')
      await user.click(particularButton)

      await waitFor(() => {
        expect(formMethodsRef.current?.getValues('coverageType')).toBe('particular')
      })
    })

    it('should select convenio when clicked', async () => {
      const user = userEvent.setup()
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithValues({ children }: { children: React.ReactNode }) {
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
            convenioId: undefined,
            specialtyId: '',
            reason: '',
            npsScore: null,
          },
          mode: 'onChange',
        })

        formMethodsRef.current = methods

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithValues>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapperWithValues>,
      )

      const convenioButton = screen.getByText('Convênio')
      await user.click(convenioButton)

      await waitFor(() => {
        expect(formMethodsRef.current?.getValues('coverageType')).toBe('convenio')
      })
    })

    it('should clear convenioId when particular is selected', async () => {
      const user = userEvent.setup()
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithValues({ children }: { children: React.ReactNode }) {
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
            coverageType: 'convenio',
            convenioId: 'conv-2',
            specialtyId: '',
            reason: '',
            npsScore: null,
          },
          mode: 'onChange',
        })

        formMethodsRef.current = methods

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithValues>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapperWithValues>,
      )

      expect(formMethodsRef.current?.getValues('convenioId')).toBe('conv-2')

      const particularButton = screen.getByText('Particular')
      await user.click(particularButton)

      await waitFor(() => {
        expect(formMethodsRef.current?.getValues('convenioId')).toBeUndefined()
      })
    })
  })

  describe('Conditional Select Rendering', () => {
    it('should show Select when coverageType is convenio', () => {
      function TestWrapperWithConvenio({ children }: { children: React.ReactNode }) {
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
            coverageType: 'convenio',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
          },
          mode: 'onChange',
        })

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithConvenio>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapperWithConvenio>,
      )

      expect(screen.getByLabelText(/convênio/i)).toBeInTheDocument()
    })

    it('should not show Select when coverageType is particular', () => {
      render(
        <TestWrapper>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapper>,
      )

      const select = screen.queryByLabelText(/convênio/i)
      expect(select).not.toBeInTheDocument()
    })

    it('should render all convenio options in Select', async () => {
      function TestWrapperWithConvenio({ children }: { children: React.ReactNode }) {
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
            coverageType: 'convenio',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
          },
          mode: 'onChange',
        })

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithConvenio>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapperWithConvenio>,
      )

      const select = screen.getByLabelText(/convênio/i)
      await userEvent.click(select)

      await waitFor(() => {
        expect(screen.getByText('Convênio A')).toBeInTheDocument()
        expect(screen.getByText('Convênio B')).toBeInTheDocument()
        expect(screen.getByText('Convênio C')).toBeInTheDocument()
      })
    })
  })

  describe('Convenio Selection', () => {
    it('should update convenioId when a convenio is selected', async () => {
      const user = userEvent.setup()
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithConvenio({ children }: { children: React.ReactNode }) {
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
            coverageType: 'convenio',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
          },
          mode: 'onChange',
        })

        formMethodsRef.current = methods

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithConvenio>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapperWithConvenio>,
      )

      const select = screen.getByLabelText(/convênio/i)
      await user.click(select)

      await waitFor(() => {
        expect(screen.getByText('Convênio B')).toBeInTheDocument()
      })

      const convenioB = screen.getByText('Convênio B')
      await user.click(convenioB)

      await waitFor(() => {
        expect(formMethodsRef.current?.getValues('convenioId')).toBe('conv-2')
      })
    })

    it('should display selected convenio name', async () => {
      function TestWrapperWithSelectedConvenio({ children }: { children: React.ReactNode }) {
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
            coverageType: 'convenio',
            convenioId: 'conv-1',
            specialtyId: '',
            reason: '',
            npsScore: null,
          },
          mode: 'onChange',
        })

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithSelectedConvenio>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapperWithSelectedConvenio>,
      )

      const select = screen.getByLabelText(/convênio/i) as HTMLInputElement
      expect(select).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when convenioId has error', () => {
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
            coverageType: 'convenio',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
          },
          mode: 'onChange',
        })

        useEffect(() => {
          methods.setError('convenioId', {
            type: 'required',
            message: 'Selecione um convênio',
          })
        }, [methods])

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithError>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapperWithError>,
      )

      expect(screen.getByText('Selecione um convênio')).toBeInTheDocument()
    })

    it('should render Select with error state when convenioId has error', () => {
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
            coverageType: 'convenio',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
          },
          mode: 'onChange',
        })

        useEffect(() => {
          methods.setError('convenioId', {
            type: 'required',
            message: 'Selecione um convênio',
          })
        }, [methods])

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithError>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapperWithError>,
      )

      expect(screen.getByLabelText(/convênio/i)).toBeInTheDocument()
      expect(screen.getByText('Selecione um convênio')).toBeInTheDocument()
    })

    it('should reserve space for helper text even without error', () => {
      function TestWrapperWithConvenio({ children }: { children: React.ReactNode }) {
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
            coverageType: 'convenio',
            convenioId: '',
            specialtyId: '',
            reason: '',
            npsScore: null,
          },
          mode: 'onChange',
        })

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithConvenio>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapperWithConvenio>,
      )

      const select = screen.getByLabelText(/convênio/i)
      const helperText = select
        .closest('.MuiFormControl-root')
        ?.querySelector('.MuiFormHelperText-root')
      expect(helperText).toBeInTheDocument()
    })
  })

  describe('Form Integration', () => {
    it('should sync with form values when coverageType changes', async () => {
      const user = userEvent.setup()
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithValues({ children }: { children: React.ReactNode }) {
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
          },
          mode: 'onChange',
        })

        formMethodsRef.current = methods

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithValues>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapperWithValues>,
      )

      const convenioButton = screen.getByText('Convênio')
      await user.click(convenioButton)

      await waitFor(() => {
        expect(formMethodsRef.current?.getValues('coverageType')).toBe('convenio')
      })

      await waitFor(() => {
        expect(screen.getByLabelText(/convênio/i)).toBeInTheDocument()
      })
    })

    it('should preserve form values correctly', async () => {
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithValues({ children }: { children: React.ReactNode }) {
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
          },
          mode: 'onChange',
        })

        formMethodsRef.current = methods

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithValues>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapperWithValues>,
      )

      expect(formMethodsRef.current?.getValues('coverageType')).toBe('particular')
      expect(formMethodsRef.current?.getValues('convenioId')).toBe('')
    })
  })

  describe('Layout', () => {
    it('should render in centered stack layout', () => {
      const { container } = render(
        <TestWrapper>
          <CoverageStep convenios={mockConvenios} />
        </TestWrapper>,
      )

      const stacks = container.querySelectorAll('.MuiStack-root')
      expect(stacks.length).toBeGreaterThan(0)
    })
  })
})
