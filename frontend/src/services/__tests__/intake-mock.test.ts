import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lookupPatients, createPatient, listConvenios, listSpecialties, submitIntake } from '../intake'
import type { IntakeSubmission } from '../../features/intake/types'

// Mock config to force mock usage (no API)
vi.mock('../../config/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../config/api')>()
  return {
    ...actual,
    IS_API_CONFIGURED: false,
  }
})

describe('Intake Service (Mock Mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('lookupPatients (Mock)', () => {
    it('should return mock data when CPF ends with even number', async () => {
      const result = await lookupPatients('12345678900', '2023-01-01')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Maria Conceição')
    })

    it('should return empty array when CPF ends with odd number', async () => {
      const result = await lookupPatients('12345678901', '2023-01-01')
      expect(result).toHaveLength(0)
    })
  })

  describe('createPatient (Mock)', () => {
    it('should return mock patient ID', async () => {
      const id = await createPatient('123', 'Maria', '2023', '11999999999', 'conv1')
      expect(id).toContain('mock-patient-')
    })
  })

  describe('listConvenios (Mock)', () => {
    it('should return fallback convenios', async () => {
      const result = await listConvenios()
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
    })
  })

  describe('listSpecialties (Mock)', () => {
    it('should return fallback specialties', async () => {
      const result = await listSpecialties()
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
    })
  })

  describe('submitIntake (Mock)', () => {
    it('should simulate success', async () => {
      await expect(submitIntake({
        specialtyId: 'spec1',
        convenioId: null,
        patientId: 'pat1',
        intakeMode: 'cpf',
        cpf: '123',
        birthDate: '2023',
        reason: 'Test reason',
      } as IntakeSubmission)).resolves.toBeUndefined()
    })
  })
})
