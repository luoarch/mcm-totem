import type {
  PatientMatch,
  PayerOption,
  SpecialtyOption,
} from '../types/intake'
import type { IntakeSubmission } from '../features/intake/types'
import { apiClient } from './http'
import { IS_API_CONFIGURED } from '../config/api'

const fallbackConvenios: PayerOption[] = [
  { id: 'particular', name: 'Particular' },
  { id: 'unimed', name: 'Unimed' },
  { id: 'bradesco-saude', name: 'Bradesco Saúde' },
  { id: 'amil', name: 'Amil' },
]

const fallbackSpecialties: SpecialtyOption[] = [
  { id: 'clinico-geral', name: 'Clínico Geral' },
  { id: 'trauma', name: 'Trauma' },
  { id: 'pediatria', name: 'Pediatria' },
  { id: 'ginecologia', name: 'Ginecologia' },
]

export async function lookupPatients(
  cpf: string,
  birthDate: string,
): Promise<PatientMatch[]> {
  const sanitizedCpf = cpf.replace(/\D+/g, '')

  if (IS_API_CONFIGURED) {
    try {
      const { data } = await apiClient.get<PatientMatch[]>('/patients', {
        params: {
          cpf: sanitizedCpf,
          birthDate,
        },
      })
      return data
    } catch (error) {
      console.error('Falha ao consultar pacientes', error)
    }
  }

  // Mock: return a single match when CPF ends with an even number
  if (parseInt(sanitizedCpf.at(-1) ?? '0', 10) % 2 === 0) {
    return [
      {
        id: `patient-${sanitizedCpf}`,
        name: 'Maria Conceição',
        document: sanitizedCpf,
        birthDate,
      },
    ]
  }

  return []
}

export async function listConvenios(): Promise<PayerOption[]> {
  if (IS_API_CONFIGURED) {
    try {
      const { data } = await apiClient.get<PayerOption[]>('/payer-options', {
        params: { audience: 'totem' },
      })
      return data
    } catch (error) {
      console.error('Falha ao carregar convênios', error)
    }
  }

  return fallbackConvenios
}

export async function listSpecialties(): Promise<SpecialtyOption[]> {
  if (IS_API_CONFIGURED) {
    try {
      const { data } = await apiClient.get<SpecialtyOption[]>('/specialties', {
        params: { audience: 'totem' },
      })
      return data
    } catch (error) {
      console.error('Falha ao carregar especialidades', error)
    }
  }

  return fallbackSpecialties
}

export async function submitIntake(payload: IntakeSubmission): Promise<void> {
  if (IS_API_CONFIGURED) {
    const requestPayload = {
      ...payload,
      auditSelectionId: payload.auditSelectionId ?? null,
      cpf: payload.intakeMode === 'cpf' ? payload.cpf : undefined,
      birthDate: payload.intakeMode === 'cpf' ? payload.birthDate : payload.foreignBirthDate,
      foreignName: payload.intakeMode === 'foreign' ? payload.foreignName : undefined,
      foreignBirthDate:
        payload.intakeMode === 'foreign' ? payload.foreignBirthDate : undefined,
      foreignEmail: payload.intakeMode === 'foreign' ? payload.foreignEmail ?? null : null,
    }

    await apiClient.post('/attendances', requestPayload)
    return
  }

  await new Promise((resolve) => {
    setTimeout(resolve, 500)
  })
}

