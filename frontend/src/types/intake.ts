/**
 * MC AutoAtendimento API Response Types
 */

export type CoverageType = 'particular' | 'convenio'

export type PayerOption = {
  id: string
  name: string
  requiresCard?: boolean
}

export type SpecialtyOption = {
  id: string
  name: string
  description?: string
}

export type PatientMatch = {
  id: string
  name: string
  document: string
  birthDate: string
  socialName?: string
}

/**
 * MC API specific response types
 */

export type MCPatientResponse = {
  nropaciente: number
  nome?: string
  cpf?: string
  nasci?: string
  celular?: string
  email?: string
  nomesocial?: string | null
}

export type MCConvenioResponse = {
  convenio: string
  nomefantasia?: string
  razaosocial?: string
}

export type MCEspecialidadeResponse = {
  especialidade: string
  descricao: string
}

export type MCCreatePatientResponse = {
  ok: boolean
  nropac?: number
  error?: string
  message?: string
}

export type MCAtendimentoResponse = {
  type: 'success' | 'error'
  ok?: boolean
  message?: string
}
