import type {
  CoverageType,
  PatientMatch,
  PayerOption,
  SpecialtyOption,
} from '../../types/intake'

export type IntakeMode = 'cpf' | 'foreign'

export type IntakeStepKey =
  | 'welcome'
  | 'priority'
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
  isPriority: boolean
  cpf: string
  birthDate: string
  lookupFirstName: string
  patientSelection: PatientSelection
  existingPatientId?: string
  patientName: string
  socialName: string
  phone: string
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

export type IntakeSubmissionCpf = {
  intakeMode: 'cpf'
  patientId: string
  cpf: string
  birthDate: string
  coverageType: CoverageType
  convenioId: string | null
  specialtyId: string
  reason: string
  npsScore: number | null
  isPriority: boolean
  patientName?: string
  socialName?: string
  phone?: string
}

export type IntakeSubmissionForeign = {
  intakeMode: 'foreign'
  foreignName: string
  foreignBirthDate: string
  foreignEmail?: string | null
  coverageType: CoverageType
  convenioId: string | null
  specialtyId: string
  reason: string
  npsScore: number | null
  isPriority: boolean
  manualAssistance: true
}

export type IntakeSubmission = IntakeSubmissionCpf | IntakeSubmissionForeign

export type ConfirmationSnapshot = {
  maskedIdentifier: string
  submittedAt: string
  summary: {
    patient: string
    coverage: string
    specialty: string
  }
  surveyUrl?: string
  manualAssistance?: boolean
}

