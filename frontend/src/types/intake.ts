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
}

