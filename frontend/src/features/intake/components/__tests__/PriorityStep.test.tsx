import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form'
import { PriorityStep } from '../PriorityStep'
import type { IntakeFormValues } from '../../types'

function TestWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm<IntakeFormValues>({
    defaultValues: {
      isPriority: undefined,
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

describe('PriorityStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render heading', () => {
      render(
        <TestWrapper>
          <PriorityStep />
        </TestWrapper>,
      )

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: /qual tipo de atendimento você precisa/i,
        }),
      ).toBeInTheDocument()
    })

    it('should render both priority options', () => {
      render(
        <TestWrapper>
          <PriorityStep />
        </TestWrapper>,
      )

      expect(screen.getByText('Atendimento Normal')).toBeInTheDocument()
      expect(screen.getByText('Atendimento Prioritário')).toBeInTheDocument()
    })

    it('should render options as buttons', () => {
      render(
        <TestWrapper>
          <PriorityStep />
        </TestWrapper>,
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Selection', () => {
    it('should select normal priority when clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <PriorityStep />
        </TestWrapper>,
      )

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      expect(normalButton).toBeInTheDocument()
    })

    it('should select priority when clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <PriorityStep />
        </TestWrapper>,
      )

      const priorityButton = screen.getByText('Atendimento Prioritário')
      await user.click(priorityButton)

      expect(priorityButton).toBeInTheDocument()
    })

    it('should update form value when normal option is selected', async () => {
      const user = userEvent.setup()
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithValues({ children }: { children: React.ReactNode }) {
        const methods = useForm<IntakeFormValues>({
          defaultValues: {
            isPriority: undefined,
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
          <PriorityStep />
        </TestWrapperWithValues>,
      )

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(formMethodsRef.current?.getValues('isPriority')).toBe(false)
    })

    it('should update form value when priority option is selected', async () => {
      const user = userEvent.setup()
      const formMethodsRef: { current: UseFormReturn<IntakeFormValues> | null } = { current: null }

      function TestWrapperWithValues({ children }: { children: React.ReactNode }) {
        const methods = useForm<IntakeFormValues>({
          defaultValues: {
            isPriority: undefined,
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
          <PriorityStep />
        </TestWrapperWithValues>,
      )

      const priorityButton = screen.getByText('Atendimento Prioritário')
      await user.click(priorityButton)

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(formMethodsRef.current?.getValues('isPriority')).toBe(true)
    })
  })

  describe('Error Display', () => {
    it('should display error message when field has error', () => {
      function TestWrapperWithError({ children }: { children: React.ReactNode }) {
        const methods = useForm<IntakeFormValues>({
          defaultValues: {
            isPriority: undefined,
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

        useEffect(() => {
          methods.setError('isPriority', {
            type: 'required',
            message: 'Selecione o tipo de atendimento',
          })
        }, [methods])

        return <FormProvider {...methods}>{children}</FormProvider>
      }

      render(
        <TestWrapperWithError>
          <PriorityStep />
        </TestWrapperWithError>,
      )

      expect(screen.getByText('Selecione o tipo de atendimento')).toBeInTheDocument()
    })

    it('should not display error when field is valid', () => {
      render(
        <TestWrapper>
          <PriorityStep />
        </TestWrapper>,
      )

      const errorText = screen.queryByText(/selecione o tipo de atendimento/i)
      expect(errorText).not.toBeInTheDocument()
    })
  })

  describe('Layout', () => {
    it('should render in centered layout', () => {
      const { container } = render(
        <TestWrapper>
          <PriorityStep />
        </TestWrapper>,
      )

      const box = container.querySelector('.MuiBox-root')
      expect(box).toBeInTheDocument()
    })

    it('should render options in stack layout', () => {
      const { container } = render(
        <TestWrapper>
          <PriorityStep />
        </TestWrapper>,
      )

      const stacks = container.querySelectorAll('.MuiStack-root')
      expect(stacks.length).toBeGreaterThan(0)
    })
  })
})
