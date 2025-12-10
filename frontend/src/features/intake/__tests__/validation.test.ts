import { describe, it, expect } from 'vitest'
import { intakeSchema } from '../validation'
import { ValidationError } from 'yup'

describe('Intake Validation', () => {
  const validBase = {
    intakeMode: 'cpf',
    isPriority: false,
    cpf: '52998224725', // Valid generated CPF
    birthDate: '1990-01-01',
    lookupFirstName: 'Maria',
    patientSelection: 'existing',
    existingPatientId: '123',
    patientName: 'Maria Silva',
    socialName: '',
    phone: '11999999999',
    coverageType: 'particular',
    specialtyId: 'clinico-geral',
    reason: 'Consulta de rotina',
    npsScore: null,
    foreignName: '',
    foreignBirthDate: '',
    foreignEmail: '',
    convenioId: null,
  }

  it('should validate a correct existing patient form', async () => {
    await expect(intakeSchema.validate(validBase)).resolves.toBeDefined()
  })

  it('should validate a correct new patient form', async () => {
    const newPatient = {
      ...validBase,
      patientSelection: 'new',
      existingPatientId: null,
      patientName: 'João da Silva',
      phone: '11999999999',
    }
    await expect(intakeSchema.validate(newPatient)).resolves.toBeDefined()
  })

  it('should fail if CPF is missing in cpf mode', async () => {
    const invalid = { ...validBase, cpf: '' }
    await expect(intakeSchema.validate(invalid)).rejects.toThrow(ValidationError)
  })

  it('should fail if first name is missing in cpf mode', async () => {
    const invalid = { ...validBase, lookupFirstName: '' }
    await expect(intakeSchema.validate(invalid)).rejects.toThrow(/Informe o primeiro nome/)
  })

  it('should fail if phone is missing for new patient', async () => {
    const invalid = {
      ...validBase,
      patientSelection: 'new',
      phone: '',
    }
    await expect(intakeSchema.validate(invalid)).rejects.toThrow('Informe o telefone celular')
  })

  it('should fail if name is missing for new patient', async () => {
    const invalid = {
      ...validBase,
      patientSelection: 'new',
      patientName: '',
    }
    await expect(intakeSchema.validate(invalid)).rejects.toThrow('Informe o nome completo')
  })

  it('should validate foreign mode correctly', async () => {
    const foreign = {
      ...validBase,
      intakeMode: 'foreign',
      cpf: '',
      birthDate: '',
      foreignName: 'John Doe',
      foreignBirthDate: '1990-01-01',
      foreignEmail: 'john@example.com',
    }
    await expect(intakeSchema.validate(foreign)).resolves.toBeDefined()
  })

  it('should fail if foreign name is missing in foreign mode', async () => {
    const foreign = {
      ...validBase,
      intakeMode: 'foreign',
      foreignBirthDate: '1990-01-01',
      foreignName: '',
    }
    await expect(intakeSchema.validate(foreign)).rejects.toThrow('Informe o nome completo')
  })

  it('should require convenioId if coverageType is convenio', async () => {
    const invalid = {
      ...validBase,
      coverageType: 'convenio',
      convenioId: null,
    }
    await expect(intakeSchema.validate(invalid)).rejects.toThrow('Selecione o convênio')
  })

  it('should validate reason length', async () => {
    const short = { ...validBase, reason: 'short' }
    await expect(intakeSchema.validate(short)).rejects.toThrow('Forneça detalhes suficientes')
  })
})
