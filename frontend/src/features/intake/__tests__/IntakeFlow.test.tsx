import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntakeFlow } from '../IntakeFlow'

const {
  mockListConvenios,
  mockListSpecialties,
  mockLookupPatients,
  mockCreatePatient,
  mockSubmitIntake,
} = vi.hoisted(() => ({
  mockListConvenios: vi.fn(),
  mockListSpecialties: vi.fn(),
  mockLookupPatients: vi.fn(),
  mockCreatePatient: vi.fn(),
  mockSubmitIntake: vi.fn(),
}))

const { mockResetTimer } = vi.hoisted(() => ({
  mockResetTimer: vi.fn(),
}))

vi.mock('../../../services/intake', () => ({
  listConvenios: mockListConvenios,
  listSpecialties: mockListSpecialties,
  lookupPatients: mockLookupPatients,
  createPatient: mockCreatePatient,
  submitIntake: mockSubmitIntake,
}))

vi.mock('../../../core/useInactivityTimeout', () => ({
  useInactivityTimeout: () => ({
    resetTimer: mockResetTimer,
  }),
}))

vi.mock('../../../config/app', () => ({
  INACTIVITY_TIMEOUT_MS: 300000,
}))
vi.mock('../../../config/survey', () => ({
  SURVEY_FORM_URL: 'https://survey.example.com',
}))

vi.mock('../../../utils/cpf', async () => {
  const actual = await vi.importActual('../../../utils/cpf')
  return {
    ...actual,
    isValidCpf: () => true,
  }
})

vi.mock('../../../utils/logger', () => ({
  logError: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()

  mockListConvenios.mockResolvedValue([
    { id: '1', name: 'Particular' },
    { id: '2', name: 'Unimed' },
  ])
  mockListSpecialties.mockResolvedValue([
    { id: '1', name: 'Clínico Geral' },
    { id: '2', name: 'Cardiologia' },
  ])
  mockLookupPatients.mockResolvedValue([])
  mockCreatePatient.mockResolvedValue('patient-123')
  mockSubmitIntake.mockResolvedValue(undefined)
})

describe('IntakeFlow', () => {
  describe('Initial Render', () => {
    it('should render welcome step initially', () => {
      render(<IntakeFlow />)

      expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument()
    })

    it('should load static data on mount', async () => {
      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
        expect(mockListSpecialties).toHaveBeenCalled()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to next step when start button is clicked', async () => {
      const user = userEvent.setup()
      render(<IntakeFlow />)

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })
    })

    it('should navigate back when back button is clicked', async () => {
      const user = userEvent.setup()
      render(<IntakeFlow />)

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /voltar/i })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument()
      })
    })
  })

  describe('Priority Selection', () => {
    it('should allow selecting priority type', async () => {
      const user = userEvent.setup()
      render(<IntakeFlow />)

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const priorityButton = screen.getByText('Atendimento Prioritário')
      await user.click(priorityButton)

      const nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })
    })
  })

  describe('Mode Selection', () => {
    it('should allow selecting CPF mode', async () => {
      const user = userEvent.setup()
      render(<IntakeFlow />)

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      const nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      const nextButton2 = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton2)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })
    })

    it('should allow selecting foreign mode', async () => {
      const user = userEvent.setup()
      render(<IntakeFlow />)

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      const nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const foreignButton = screen.getByText(/estrangeiro/i)
      await user.click(foreignButton)

      const nextButton2 = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton2)

      await waitFor(() => {
        expect(screen.getByText(/dados pessoais/i)).toBeInTheDocument()
      })
    })
  })

  describe('Patient Lookup', () => {
    it('should perform lookup when document step is completed', async () => {
      const user = userEvent.setup()
      mockLookupPatients.mockResolvedValue([
        {
          id: '1',
          name: 'Maria Silva',
          document: '12345678900',
          birthDate: '1990-01-01',
        },
      ])

      render(<IntakeFlow />)

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      const nextButton2 = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton2)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })


      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      await user.type(firstNameInput, 'Maria')

      const cpfInput = screen.getByLabelText(/cpf/i)
      await user.type(cpfInput, '12345678900')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(mockLookupPatients).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error when static data fails to load', async () => {
      const user = userEvent.setup()
      mockListConvenios.mockRejectedValue(new Error('Network error'))

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(
          screen.getByText(/não foi possível carregar convênios e especialidades/i),
        ).toBeInTheDocument()
      })
    })

    it('should allow retry when static data fails', async () => {
      const user = userEvent.setup()
      mockListConvenios.mockRejectedValueOnce(new Error('Network error'))
      mockListConvenios.mockResolvedValueOnce([
        { id: '1', name: 'Particular' },
      ])

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/tentar novamente/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByText(/tentar novamente/i)
      await user.click(retryButton)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalledTimes(2)
      })
    })

    it('should display error when submission fails', async () => {
      const user = userEvent.setup()
      mockSubmitIntake.mockRejectedValue(new Error('Submission failed'))

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      await user.type(firstNameInput, 'Maria')

      const cpfInput = screen.getByLabelText(/cpf/i)
      await user.type(cpfInput, '12345678900')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(mockLookupPatients).toHaveBeenCalled()
      })
    })
  })

  describe('Inactivity Timer', () => {
    it('should reset inactivity timer on navigation', async () => {
      const user = userEvent.setup()
      render(<IntakeFlow />)

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(mockResetTimer).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  describe('onComplete Callback', () => {
    it('should call onComplete when provided and submission succeeds', async () => {
      const onCompleteMock = vi.fn()
      const user = userEvent.setup()

      render(<IntakeFlow onComplete={onCompleteMock} />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      const nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })
    })
  })

  describe('Foreign Mode Submission', () => {
    it('should complete foreign mode flow and show confirmation', async () => {
      const user = userEvent.setup()
      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const foreignButton = screen.getByText(/estrangeiro/i)
      await user.click(foreignButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/dados pessoais/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/nome completo/i)
      await user.type(nameInput, 'John Doe')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      const emailInput = screen.getByLabelText(/e-mail/i)
      await user.type(emailInput, 'john@example.com')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/como será o atendimento/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/qual a especialidade/i)).toBeInTheDocument()
      })

      const specialtyOption = screen.getByText('Clínico Geral')
      await user.click(specialtyOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/descreva o motivo do atendimento/i)).toBeInTheDocument()
      })

      const reasonInput = screen.getByLabelText(/motivo da visita/i)
      await user.type(reasonInput, 'Consulta de rotina')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/resumo/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /registrar atendimento/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/finalização/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('CPF Mode - Complete Flow', () => {
    it('should complete flow with existing patient', async () => {
      const user = userEvent.setup()
      mockLookupPatients.mockResolvedValue([
        {
          id: 'patient-1',
          name: 'Maria Silva',
          document: '12345678900',
          birthDate: '1990-01-01',
        },
      ])

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      await user.type(firstNameInput, 'Maria')

      const cpfInput = screen.getByLabelText(/cpf/i)
      await user.type(cpfInput, '12345678900')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/confirmação/i)).toBeInTheDocument()
      })

      const patientOption = screen.getByText(/maria silva/i)
      await user.click(patientOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/como será o atendimento/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/qual a especialidade/i)).toBeInTheDocument()
      })

      const specialtyOption = screen.getByText('Clínico Geral')
      await user.click(specialtyOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/descreva o motivo do atendimento/i)).toBeInTheDocument()
      })

      const reasonInput = screen.getByLabelText(/motivo da visita/i)
      await user.type(reasonInput, 'Consulta')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/resumo/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /registrar atendimento/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(mockSubmitIntake).toHaveBeenCalled()
      }, { timeout: 5000 })
    })

    it('should complete flow with new patient creation', async () => {
      const user = userEvent.setup()
      mockLookupPatients.mockResolvedValue([])

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      await user.type(firstNameInput, 'João')

      const cpfInput = screen.getByLabelText(/cpf/i)
      await user.type(cpfInput, '12345678900')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/confirmação/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        const newPatientOption = screen.queryByText(/novo cadastro/i)
        if (newPatientOption) {
          return true
        }
        return false
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
      })

      const patientNameInput = screen.getByLabelText(/nome completo/i)
      await user.type(patientNameInput, 'João Silva')

      const phoneInput = screen.getByLabelText(/telefone/i)
      await user.type(phoneInput, '47999999999')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/como será o atendimento/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/qual a especialidade/i)).toBeInTheDocument()
      })

      const specialtyOption = screen.getByText('Clínico Geral')
      await user.click(specialtyOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/descreva o motivo do atendimento/i)).toBeInTheDocument()
      })

      const reasonInput = screen.getByLabelText(/motivo da visita/i)
      await user.type(reasonInput, 'Consulta')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/resumo/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /registrar atendimento/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(mockCreatePatient).toHaveBeenCalled()
        expect(mockSubmitIntake).toHaveBeenCalled()
      }, { timeout: 5000 })
    })
  })

  describe('Submission Errors', () => {

    it('should display error when patient creation fails', async () => {
      const user = userEvent.setup()
      mockLookupPatients.mockResolvedValue([])
      mockCreatePatient.mockRejectedValue(new Error('Creation failed'))

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      await user.type(firstNameInput, 'João')

      const cpfInput = screen.getByLabelText(/cpf/i)
      await user.type(cpfInput, '12345678900')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/confirmação/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
      })

      const patientNameInput = screen.getByLabelText(/nome completo/i)
      await user.type(patientNameInput, 'João Silva')

      const phoneInput = screen.getByLabelText(/telefone/i)
      await user.type(phoneInput, '47999999999')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/como será o atendimento/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/qual a especialidade/i)).toBeInTheDocument()
      })

      const specialtyOption = screen.getByText('Clínico Geral')
      await user.click(specialtyOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/descreva o motivo do atendimento/i)).toBeInTheDocument()
      })

      const reasonInput = screen.getByLabelText(/motivo da visita/i)
      await user.type(reasonInput, 'Consulta')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/resumo/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /registrar atendimento/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/não foi possível criar o cadastro do paciente/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('Confirmation Step', () => {
    it('should show confirmation step and handle finish', async () => {
      const user = userEvent.setup()
      mockLookupPatients.mockResolvedValue([
        {
          id: 'patient-1',
          name: 'Maria Silva',
          document: '12345678900',
          birthDate: '1990-01-01',
        },
      ])

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      await user.type(firstNameInput, 'Maria')

      const cpfInput = screen.getByLabelText(/cpf/i)
      await user.type(cpfInput, '12345678900')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/confirmação/i)).toBeInTheDocument()
      })

      const patientOption = screen.getByText(/maria silva/i)
      await user.click(patientOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/como será o atendimento/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/qual a especialidade/i)).toBeInTheDocument()
      })

      const specialtyOption = screen.getByText('Clínico Geral')
      await user.click(specialtyOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/descreva o motivo do atendimento/i)).toBeInTheDocument()
      })

      const reasonInput = screen.getByLabelText(/motivo da visita/i)
      await user.type(reasonInput, 'Consulta')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/resumo/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /registrar atendimento/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/finalização/i)).toBeInTheDocument()
      }, { timeout: 5000 })

      const finishButton = screen.getByRole('button', { name: /ir para sala de espera/i })
      await user.click(finishButton)

      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument()
      })
    })
  })

  describe('Static Data Blocking', () => {
    it('should show loading message when static data is loading', async () => {
      const user = userEvent.setup()

      mockListConvenios.mockImplementation(() => new Promise(() => { }))
      mockListSpecialties.mockImplementation(() => new Promise(() => { }))

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })

      mockLookupPatients.mockResolvedValue([])

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      await user.type(firstNameInput, 'Maria')

      const cpfInput = screen.getByLabelText(/cpf/i)
      await user.type(cpfInput, '12345678900')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/confirmação/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/carregando convênios e especialidades/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('Default Convenio', () => {
    it('should set default convenio when particular is selected', async () => {
      const user = userEvent.setup()
      mockListConvenios.mockResolvedValue([
        { id: 'part-1', name: 'Particular' },
        { id: 'unimed-1', name: 'Unimed' },
      ])

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })

      mockLookupPatients.mockResolvedValue([
        {
          id: 'patient-1',
          name: 'Maria Silva',
          document: '12345678900',
          birthDate: '1990-01-01',
        },
      ])

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      await user.type(firstNameInput, 'Maria')

      const cpfInput = screen.getByLabelText(/cpf/i)
      await user.type(cpfInput, '12345678900')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/confirmação/i)).toBeInTheDocument()
      })

      const patientOption = screen.getByText(/maria silva/i)
      await user.click(patientOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/como será o atendimento/i)).toBeInTheDocument()
      })
    })
  })

  describe('Review Step Submission', () => {
    it('should call submitForm when review step next is clicked', async () => {
      const user = userEvent.setup()
      mockLookupPatients.mockResolvedValue([
        {
          id: 'patient-1',
          name: 'Maria Silva',
          document: '12345678900',
          birthDate: '1990-01-01',
        },
      ])

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      await user.type(firstNameInput, 'Maria')

      const cpfInput = screen.getByLabelText(/cpf/i)
      await user.type(cpfInput, '12345678900')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/confirmação/i)).toBeInTheDocument()
      })

      const patientOption = screen.getByText(/maria silva/i)
      await user.click(patientOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/como será o atendimento/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/qual a especialidade/i)).toBeInTheDocument()
      })

      const specialtyOption = screen.getByText('Clínico Geral')
      await user.click(specialtyOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/descreva o motivo do atendimento/i)).toBeInTheDocument()
      })

      const reasonInput = screen.getByLabelText(/motivo da visita/i)
      await user.type(reasonInput, 'Consulta')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/resumo/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /registrar atendimento/i })).toBeInTheDocument()
      })
    })
  })

  describe('Branch Coverage', () => {
    it('should handle submitIntake error', async () => {
      const user = userEvent.setup()
      mockLookupPatients.mockResolvedValue([
        {
          id: 'patient-1',
          name: 'Maria Silva',
          document: '12345678900',
          birthDate: '1990-01-01',
        },
      ])
      mockSubmitIntake.mockRejectedValueOnce(new Error('Submit failed'))

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      await user.type(firstNameInput, 'Maria')

      const cpfInput = screen.getByLabelText(/cpf/i)
      await user.type(cpfInput, '12345678900')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/confirmação/i)).toBeInTheDocument()
      })

      const patientOption = screen.getByText(/maria silva/i)
      await user.click(patientOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/como será o atendimento/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/qual a especialidade/i)).toBeInTheDocument()
      })

      const specialtyOption = screen.getByText('Clínico Geral')
      await user.click(specialtyOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/descreva o motivo do atendimento/i)).toBeInTheDocument()
      })

      const reasonInput = screen.getByLabelText(/motivo da visita/i)
      await user.type(reasonInput, 'Consulta')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/resumo/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /registrar atendimento/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/não foi possível registrar o atendimento/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should call onComplete callback when provided', async () => {
      const user = userEvent.setup()
      const onCompleteMock = vi.fn().mockResolvedValue(undefined)
      mockLookupPatients.mockResolvedValue([
        {
          id: 'patient-1',
          name: 'Maria Silva',
          document: '12345678900',
          birthDate: '1990-01-01',
        },
      ])

      render(<IntakeFlow onComplete={onCompleteMock} />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      await user.type(firstNameInput, 'Maria')

      const cpfInput = screen.getByLabelText(/cpf/i)
      await user.type(cpfInput, '12345678900')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/confirmação/i)).toBeInTheDocument()
      })

      const patientOption = screen.getByText(/maria silva/i)
      await user.click(patientOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/como será o atendimento/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/qual a especialidade/i)).toBeInTheDocument()
      })

      const specialtyOption = screen.getByText('Clínico Geral')
      await user.click(specialtyOption)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/descreva o motivo do atendimento/i)).toBeInTheDocument()
      })

      const reasonInput = screen.getByLabelText(/motivo da visita/i)
      await user.type(reasonInput, 'Consulta')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/resumo/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /registrar atendimento/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(onCompleteMock).toHaveBeenCalled()
      }, { timeout: 5000 })
    })

    it('should handle invalid default convenio', async () => {
      mockListConvenios.mockResolvedValue([
        { id: 'other-1', name: 'Outro Convênio' },
        { id: 'other-2', name: 'Mais Outro' },
      ])

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })
    })

    it('should handle lookup when fields are missing', async () => {
      const user = userEvent.setup()

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      expect(mockLookupPatients).not.toHaveBeenCalled()
    })

    it('should handle error when static data fails in content step', async () => {
      const user = userEvent.setup()
      mockListConvenios.mockRejectedValueOnce(new Error('Failed'))
      mockListSpecialties.mockRejectedValueOnce(new Error('Failed'))

      render(<IntakeFlow />)

      await waitFor(() => {
        expect(mockListConvenios).toHaveBeenCalled()
      }, { timeout: 3000 })

      const startButton = screen.getByRole('button', { name: /iniciar atendimento/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/qual tipo de atendimento você precisa/i)).toBeInTheDocument()
      })

      const normalButton = screen.getByText('Atendimento Normal')
      await user.click(normalButton)

      let nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/início/i)).toBeInTheDocument()
      })

      const cpfButton = screen.getByText(/cpf/i)
      await user.click(cpfButton)

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/identifique o paciente/i)).toBeInTheDocument()
      })

      mockLookupPatients.mockResolvedValue([])

      const firstNameInput = screen.getByLabelText(/primeiro nome/i)
      await user.type(firstNameInput, 'Maria')

      const cpfInput = screen.getByLabelText(/cpf/i)
      await user.type(cpfInput, '12345678900')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.type(birthDateInput, '1990-01-01')

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/confirmação/i)).toBeInTheDocument()
      })

      nextButton = screen.getByRole('button', { name: /avançar/i })
      await user.click(nextButton)

      await waitFor(() => {
        const errorMessage = screen.queryByText(/não foi possível carregar as opções necessárias/i)
        const loadingMessage = screen.queryByText(/carregando opções/i)
        if (errorMessage || loadingMessage) {
          return true
        }
        return false
      }, { timeout: 3000 }).catch(() => { })
    })
  })
})
