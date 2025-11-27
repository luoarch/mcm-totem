import type { FieldPath } from 'react-hook-form'
import { stripCpf } from '../../utils/cpf'
import type {
  IntakeFormValues,
  IntakeMode,
  IntakeStepDefinition,
  IntakeStepKey,
} from './types'

const MODE_STEP: IntakeStepDefinition = { key: 'mode', label: 'Início' }
const CPF_IDENTIFICATION_STEP: IntakeStepDefinition = {
  key: 'document',
  label: 'Identificação',
}
const FOREIGN_STEP: IntakeStepDefinition = { key: 'foreign', label: 'Dados pessoais' }
const PATIENT_STEP: IntakeStepDefinition = { key: 'patient', label: 'Confirmação' }
const COVERAGE_STEP: IntakeStepDefinition = { key: 'coverage', label: 'Cobertura' }
const SPECIALTY_STEP: IntakeStepDefinition = {
  key: 'specialty',
  label: 'Especialidade',
}
const REASON_STEP: IntakeStepDefinition = { key: 'reason', label: 'Motivo' }
const REVIEW_STEP: IntakeStepDefinition = { key: 'review', label: 'Resumo' }
const CONFIRMATION_STEP: IntakeStepDefinition = {
  key: 'confirmation',
  label: 'Finalização',
}

export const getIntakeSteps = (mode: IntakeMode | null): IntakeStepDefinition[] => {
  if (mode === 'foreign') {
    return [
      MODE_STEP,
      FOREIGN_STEP,
      COVERAGE_STEP,
      SPECIALTY_STEP,
      REASON_STEP,
      REVIEW_STEP,
      CONFIRMATION_STEP,
    ]
  }

  return [
    MODE_STEP,
    CPF_IDENTIFICATION_STEP,
    PATIENT_STEP,
    COVERAGE_STEP,
    SPECIALTY_STEP,
    REASON_STEP,
    REVIEW_STEP,
    CONFIRMATION_STEP,
  ]
}

export const STEP_FIELD_MAP: Record<IntakeStepKey, FieldPath<IntakeFormValues>[]> = {
  mode: ['intakeMode'],
  document: ['cpf', 'birthDate'],
  foreign: ['foreignName', 'foreignBirthDate', 'foreignEmail'],
  patient: ['patientSelection', 'existingPatientId', 'patientName', 'phone'],
  coverage: ['coverageType', 'convenioId'],
  specialty: ['specialtyId'],
  reason: ['reason'],
  review: [],
  confirmation: [],
}

export const DEFAULT_FORM_VALUES: IntakeFormValues = {
  intakeMode: null,
  cpf: '',
  birthDate: '',
  patientSelection: 'existing',
  existingPatientId: undefined,
  patientName: '',
  phone: '',
  foreignName: '',
  foreignBirthDate: '',
  foreignEmail: '',
  coverageType: 'particular',
  convenioId: undefined,
  specialtyId: undefined,
  reason: '',
  npsScore: null,
}

export const REASON_MAX_LENGTH = 280

export const normalizeCpf = (value: string) => stripCpf(value)

