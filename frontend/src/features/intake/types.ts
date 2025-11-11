import type {
  CoverageType,
  PatientMatch,
  PayerOption,
  SpecialtyOption,
} from '../../types/intake'

export type IntakeMode = 'cpf' | 'foreign'

export type IntakeStepKey =
  | 'mode'
  | 'document'
  | 'foreign'
  | 'patient'
  | 'coverage'
  | 'specialty'
  | 'reason'
  | 'review'
  | 'confirmation'

export type PatientSelection = 'existing' | 'new'

export type IntakeFormValues = {
  intakeMode: IntakeMode | null
  cpf: string
  birthDate: string
  patientSelection: PatientSelection
  existingPatientId?: string
  patientName: string
  foreignName: string
  foreignBirthDate: string
  foreignEmail?: string
  coverageType: CoverageType
  convenioId?: string
  specialtyId?: string
  reason: string
  npsScore: number | null
}

export type IntakeStepDefinition = {
  key: IntakeStepKey
  label: string
}

export type IntakeResourceState = {
  matches: PatientMatch[]
  convenios: PayerOption[]
  specialties: SpecialtyOption[]
}

export type IntakeSubmission = {
  intakeMode: IntakeMode
  patientId?: string
  patientName?: string
  auditSelectionId?: string | null
  cpf: string
  birthDate: string
  foreignName?: string
  foreignBirthDate?: string
  foreignEmail?: string | null
  coverageType: CoverageType
  convenioId?: string | null
  specialtyId: string
  reason: string
  npsScore?: number | null
}

export type ConfirmationSnapshot = {
  maskedIdentifier: string
  submittedAt: string
  summary: {
    patient: string
    coverage: string
    specialty: string
  }
  surveyUrl?: string
}

