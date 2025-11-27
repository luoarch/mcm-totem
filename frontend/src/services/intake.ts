import type {
  PatientMatch,
  PayerOption,
  SpecialtyOption,
  MCPatientResponse,
  MCConvenioResponse,
  MCEspecialidadeResponse,
  MCCreatePatientResponse,
  MCAtendimentoResponse,
} from '../types/intake'
import type { IntakeSubmission } from '../features/intake/types'
import { apiClient } from './http'
import { IS_API_CONFIGURED } from '../config/api'
import { getCompanyCode } from './auth'
import { stripCpf } from '../utils/cpf'
import { formatPhoneE164 } from '../utils/phone'
import { isoToSearchFormat, isoToCreationFormat } from '../utils/date'
import { extractFirstName } from '../utils/name'

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

/**
 * Search for existing patients
 * @param cpf - Patient CPF (will be normalized to 11 digits)
 * @param birthDate - Birth date in ISO format (YYYY-MM-DD)
 * @param name - Full name (first name will be extracted for search)
 * @param phone - Optional phone number
 */
export async function lookupPatients(
  cpf: string,
  birthDate: string,
  name?: string,
  phone?: string,
): Promise<PatientMatch[]> {
  const sanitizedCpf = stripCpf(cpf)

  if (IS_API_CONFIGURED) {
    try {
      const params: Record<string, string> = {
        cpf: sanitizedCpf,
        nasci: isoToSearchFormat(birthDate), // DD/MM/AAAA format
        integracaowhatsapp: 'S',
        autoagendamento: 'true',
      }

      // Add first name if provided
      if (name) {
        params.nome = extractFirstName(name)
      }

      // Add phone if provided
      if (phone) {
        params.celular = formatPhoneE164(phone)
      }

      const { data } = await apiClient.get<MCPatientResponse[]>('/pacientesautoage', {
        params,
      })

      // Sort by nropaciente desc and map to PatientMatch
      const sorted = [...data].sort((a, b) => b.nropaciente - a.nropaciente)

      return sorted.map((patient) => ({
        id: patient.nropaciente.toString(),
        name: patient.nome ?? '',
        document: patient.cpf ?? sanitizedCpf,
        birthDate: patient.nasci ?? birthDate,
      }))
    } catch (error) {
      console.error('Falha ao consultar pacientes', error)
      throw error
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

/**
 * Create a new patient
 * @param cpf - Patient CPF (11 digits)
 * @param name - Full patient name
 * @param birthDate - Birth date in ISO format (YYYY-MM-DD)
 * @param phone - Phone number (will be formatted to E.164)
 * @param convenioCode - Insurance/payer code
 */
export async function createPatient(
  cpf: string,
  name: string,
  birthDate: string,
  phone: string,
  convenioCode: string,
): Promise<string> {
  const sanitizedCpf = stripCpf(cpf)
  const formattedPhone = formatPhoneE164(phone)
  const formattedBirthDate = isoToCreationFormat(birthDate) // ddmmyyyy format

  if (IS_API_CONFIGURED) {
    try {
      const params = new URLSearchParams()
      params.append('cpf', sanitizedCpf)
      params.append('nome', name)
      params.append('nasci', formattedBirthDate)
      params.append('celular', formattedPhone)
      params.append('convenio', convenioCode)
      params.append('integracaowhatsapp', 'S')

      const { data } = await apiClient.post<MCCreatePatientResponse>(
        '/pacientesautoage',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )

      if (data.ok && data.nropac) {
        return data.nropac.toString()
      }

      throw new Error(
        data.message ?? data.error ?? 'Falha ao criar paciente. Verifique os dados e tente novamente.',
      )
    } catch (error) {
      console.error('Falha ao criar paciente', error)
      throw error
    }
  }

  // Mock: return a fake patient ID
  return `mock-patient-${Date.now()}`
}

/**
 * List available insurance providers (convênios)
 */
export async function listConvenios(): Promise<PayerOption[]> {
  if (IS_API_CONFIGURED) {
    try {
      const { data } = await apiClient.get<MCConvenioResponse[]>('/convenios', {
        params: {
          permiteagweb: 'S',
          integracaowhatsapp: 'S',
          codempresa: getCompanyCode(),
        },
      })

      return data.map((convenio) => ({
        id: convenio.convenio,
        name: convenio.nomefantasia || convenio.razaosocial || convenio.convenio,
      }))
    } catch (error) {
      console.error('Falha ao carregar convênios', error)
      throw error
    }
  }

  return fallbackConvenios
}

/**
 * List available medical specialties
 */
export async function listSpecialties(): Promise<SpecialtyOption[]> {
  if (IS_API_CONFIGURED) {
    try {
      const { data } = await apiClient.get<MCEspecialidadeResponse[]>('/especialidades', {
        params: {
          permiteagweb: 'S',
          integracaowhatsapp: 'S',
          codempresa: getCompanyCode(),
        },
      })

      return data.map((esp) => ({
        id: esp.especialidade,
        name: esp.descricao,
      }))
    } catch (error) {
      console.error('Falha ao carregar especialidades', error)
      throw error
    }
  }

  return fallbackSpecialties
}

/**
 * Submit intake and create attendance (boletim)
 */
export async function submitIntake(payload: IntakeSubmission): Promise<void> {
  if (IS_API_CONFIGURED) {
    try {
      const params = new URLSearchParams()
      params.append('autoagendamento', 'true')
      params.append('especialidade', payload.specialtyId)
      params.append('convenio', payload.convenioId ?? '')
      params.append('nropaciente', payload.patientId ?? '')
      params.append('tipo', 'e')
      params.append('integracaowhatsapp', 'S')

      const { data, status } = await apiClient.post<MCAtendimentoResponse>(
        '/atendimentoboletim',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )

      // Success criteria: HTTP 200 AND type === "success"
      if (status === 200 && data.type === 'success') {
        return
      }

      throw new Error(
        data.message ?? 'Não foi possível gerar o atendimento. Por favor, procure ajuda no balcão.',
      )
    } catch (error) {
      console.error('Falha ao criar atendimento', error)
      throw error
    }
  }

  // Mock: simulate success
  await new Promise((resolve) => {
    setTimeout(resolve, 500)
  })
}
