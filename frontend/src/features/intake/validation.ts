import * as yup from 'yup'
import { isValidCpf, stripCpf } from '../../utils/cpf'
import type { IntakeFormValues } from './types'
import { REASON_MAX_LENGTH } from './constants'

const today = new Date()

const baseDateSchema = yup
  .string()
  .matches(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.')
  .test('min-age', 'Data de nascimento inválida.', (value) => {
    if (!value) return false
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return false
    return date <= today
  })

const intakeModeSchema = yup
  .mixed<IntakeFormValues['intakeMode']>()
  .oneOf(['cpf', 'foreign'], 'Selecione uma opção para continuar.')
  .required('Escolha uma opção de identificação.')

const cpfSchema = yup
  .string()
  .transform((value) => stripCpf(value ?? ''))
  .when('intakeMode', ([mode], schema) =>
    mode === 'cpf'
      ? schema
          .required('Informe o CPF do paciente.')
          .length(11, 'CPF deve ter 11 dígitos.')
          .test('cpf-valid', 'CPF inválido.', (value) => (value ? isValidCpf(value) : false))
      : schema.strip(true).optional(),
  )

const birthDateSchema = yup
  .string()
  .when('intakeMode', ([mode], schema) =>
    mode === 'cpf'
      ? schema
          .required('Informe a data de nascimento.')
          .concat(baseDateSchema)
      : schema.strip(true).optional(),
  )

const foreignBirthDateSchema = yup
  .string()
  .when('intakeMode', ([mode], schema) =>
    mode === 'foreign'
      ? schema
          .required('Informe a data de nascimento.')
          .concat(baseDateSchema)
      : schema.strip(true).optional(),
  )

const patientSelectionSchema = yup
  .mixed<IntakeFormValues['patientSelection']>()
  .oneOf(['existing', 'new'])
  .required()

export const intakeSchema: yup.ObjectSchema<IntakeFormValues> = yup
  .object({
    intakeMode: intakeModeSchema,
    cpf: cpfSchema,
    birthDate: birthDateSchema,
    patientSelection: patientSelectionSchema,
    existingPatientId: yup
      .string()
      .nullable()
      .when(['patientSelection', 'intakeMode'], ([selection, mode], schema) =>
        selection === 'existing' && mode === 'cpf'
          ? schema.required('Selecione o paciente correto.')
          : schema.notRequired().nullable(),
      ),
    patientName: yup
      .string()
      .transform((value) => value?.trim() ?? '')
      .max(120, 'Nome muito longo.')
      .when(['patientSelection', 'intakeMode'], ([selection, mode], schema) => {
        if (mode === 'foreign') {
          return schema.strip(true).optional()
        }
        return selection === 'new'
          ? schema.required('Informe o nome completo.')
          : schema.notRequired()
      }),
    foreignName: yup
      .string()
      .transform((value) => value?.trim() ?? '')
      .max(120, 'Nome muito longo.')
      .when('intakeMode', ([mode], schema) =>
        mode === 'foreign' ? schema.required('Informe o nome completo.') : schema.strip(true),
      ),
    foreignBirthDate: foreignBirthDateSchema,
    foreignEmail: yup
      .string()
      .transform((value) => value?.trim() ?? '')
      .when('intakeMode', ([mode], schema) =>
        mode === 'foreign'
          ? schema
              .optional()
              .nullable()
              .email('E-mail inválido.')
          : schema.strip(true).optional(),
      ),
    coverageType: yup.mixed<'particular' | 'convenio'>().oneOf(['particular', 'convenio']).required(),
    convenioId: yup
      .string()
      .nullable()
      .when('coverageType', ([coverageType], schema) =>
        coverageType === 'convenio'
          ? schema.required('Selecione o convênio.')
          : schema.notRequired().nullable(),
      ),
    specialtyId: yup.string().required('Selecione a especialidade.'),
    reason: yup
      .string()
      .transform((value) => value?.trim() ?? '')
      .required('Descreva o motivo da visita.')
      .min(8, 'Forneça detalhes suficientes.')
      .max(REASON_MAX_LENGTH, `Limite de ${REASON_MAX_LENGTH} caracteres.`),
    npsScore: yup
      .number()
      .nullable()
      .transform((value) => (Number.isNaN(value) ? null : value))
      .min(1, 'Selecione uma nota de 1 a 5.')
      .max(5, 'Selecione uma nota de 1 a 5.')
      .optional(),
  })
  .required()

