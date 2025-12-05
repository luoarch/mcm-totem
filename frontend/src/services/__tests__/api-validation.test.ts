import { describe, it, expect } from 'vitest'
import {
  mcPatientResponseSchema,
  mcConvenioResponseSchema,
  mcEspecialidadeResponseSchema,
  mcCreatePatientResponseSchema,
  mcAtendimentoResponseSchema,
  queueEntrySchema,
  queueEntriesSchema,
  validateApiResponse,
} from '../api-validation'

describe('api-validation', () => {
  describe('mcPatientResponseSchema', () => {
    it('should validate valid patient response', () => {
      const data = {
        nropaciente: 123,
        nome: 'Maria Silva',
        cpf: '12345678900',
        nasci: '01/01/1990',
        celular: '11999999999',
        email: 'maria@example.com',
        nomesocial: 'Mari',
      }

      const result = mcPatientResponseSchema.parse(data)
      expect(result).toEqual(data)
    })

    it('should validate patient response with minimal fields', () => {
      const data = {
        nropaciente: 123,
      }

      const result = mcPatientResponseSchema.parse(data)
      expect(result).toEqual(data)
    })

    it('should handle null nomesocial', () => {
      const data = {
        nropaciente: 123,
        nomesocial: null,
      }

      const result = mcPatientResponseSchema.parse(data)
      expect(result.nomesocial).toBeNull()
    })

    it('should reject invalid patient response', () => {
      const data = {
        nropaciente: 'invalid',
      }

      expect(() => mcPatientResponseSchema.parse(data)).toThrow()
    })

    it('should reject missing required field', () => {
      const data = {
        nome: 'Maria',
      }

      expect(() => mcPatientResponseSchema.parse(data)).toThrow()
    })
  })

  describe('mcConvenioResponseSchema', () => {
    it('should validate and transform convenio with string id', () => {
      const data = {
        convenio: '123',
        nomefantasia: 'Unimed',
        razaosocial: 'Unimed Brasil',
      }

      const result = mcConvenioResponseSchema.parse(data)
      expect(result.convenio).toBe('123')
      expect(result.nomefantasia).toBe('Unimed')
      expect(result.razaosocial).toBe('Unimed Brasil')
    })

    it('should validate and transform convenio with number id', () => {
      const data = {
        convenio: 456,
        nomefantasia: 'Bradesco',
      }

      const result = mcConvenioResponseSchema.parse(data)
      expect(result.convenio).toBe('456')
      expect(result.nomefantasia).toBe('Bradesco')
    })

    it('should validate convenio with only razaosocial', () => {
      const data = {
        convenio: '789',
        razaosocial: 'Hospital XPTO',
      }

      const result = mcConvenioResponseSchema.parse(data)
      expect(result.convenio).toBe('789')
      expect(result.razaosocial).toBe('Hospital XPTO')
    })

    it('should reject invalid convenio response', () => {
      const data = {
        nomefantasia: 'Test',
      }

      expect(() => mcConvenioResponseSchema.parse(data)).toThrow()
    })
  })

  describe('mcEspecialidadeResponseSchema', () => {
    it('should validate and transform especialidade with string id', () => {
      const data = {
        especialidade: '123',
        descricao: 'Cardiologia',
      }

      const result = mcEspecialidadeResponseSchema.parse(data)
      expect(result.especialidade).toBe('123')
      expect(result.descricao).toBe('Cardiologia')
    })

    it('should validate and transform especialidade with number id', () => {
      const data = {
        especialidade: 456,
        descricao: 'Pediatria',
      }

      const result = mcEspecialidadeResponseSchema.parse(data)
      expect(result.especialidade).toBe('456')
      expect(result.descricao).toBe('Pediatria')
    })

    it('should reject missing descricao', () => {
      const data = {
        especialidade: '123',
      }

      expect(() => mcEspecialidadeResponseSchema.parse(data)).toThrow()
    })

    it('should reject invalid especialidade response', () => {
      const data = {
        descricao: 'Test',
      }

      expect(() => mcEspecialidadeResponseSchema.parse(data)).toThrow()
    })
  })

  describe('mcCreatePatientResponseSchema', () => {
    it('should validate success response with nropac', () => {
      const data = {
        ok: true,
        nropac: 12345,
        message: 'Patient created',
      }

      const result = mcCreatePatientResponseSchema.parse(data)
      expect(result.ok).toBe(true)
      expect(result.nropac).toBe(12345)
      expect(result.message).toBe('Patient created')
    })

    it('should transform msg to message', () => {
      const data = {
        ok: true,
        nropac: 12345,
        msg: 'Patient created',
      }

      const result = mcCreatePatientResponseSchema.parse(data)
      expect(result.message).toBe('Patient created')
    })

    it('should prefer message over msg', () => {
      const data = {
        ok: false,
        message: 'Error message',
        msg: 'Old message',
      }

      const result = mcCreatePatientResponseSchema.parse(data)
      expect(result.message).toBe('Error message')
    })

    it('should handle error response', () => {
      const data = {
        ok: false,
        error: 'Error occurred',
      }

      const result = mcCreatePatientResponseSchema.parse(data)
      expect(result.ok).toBe(false)
      expect(result.error).toBe('Error occurred')
    })

    it('should reject missing ok field', () => {
      const data = {
        nropac: 12345,
      }

      expect(() => mcCreatePatientResponseSchema.parse(data)).toThrow()
    })
  })

  describe('mcAtendimentoResponseSchema', () => {
    it('should validate success response', () => {
      const data = {
        type: 'success',
        ok: true,
        message: 'Atendimento criado',
      }

      const result = mcAtendimentoResponseSchema.parse(data)
      expect(result.type).toBe('success')
      expect(result.ok).toBe(true)
      expect(result.message).toBe('Atendimento criado')
    })

    it('should validate error response', () => {
      const data = {
        type: 'error',
        message: 'Error occurred',
      }

      const result = mcAtendimentoResponseSchema.parse(data)
      expect(result.type).toBe('error')
      expect(result.message).toBe('Error occurred')
    })

    it('should transform msg to message', () => {
      const data = {
        type: 'success',
        msg: 'Success message',
      }

      const result = mcAtendimentoResponseSchema.parse(data)
      expect(result.message).toBe('Success message')
    })

    it('should prefer message over msg', () => {
      const data = {
        type: 'error',
        message: 'Error message',
        msg: 'Old message',
      }

      const result = mcAtendimentoResponseSchema.parse(data)
      expect(result.message).toBe('Error message')
    })

    it('should reject invalid type', () => {
      const data = {
        type: 'invalid',
      }

      expect(() => mcAtendimentoResponseSchema.parse(data)).toThrow()
    })

    it('should reject missing type', () => {
      const data = {
        message: 'Test',
      }

      expect(() => mcAtendimentoResponseSchema.parse(data)).toThrow()
    })
  })

  describe('queueEntrySchema', () => {
    it('should validate complete queue entry', () => {
      const data = {
        id: 'call-100',
        patientLabel: 'Carla ***921',
        specialty: 'Clínico Geral',
        status: 'called',
        calledAt: '2024-01-01T10:00:00Z',
        room: 'Consultório 1',
      }

      const result = queueEntrySchema.parse(data)
      expect(result).toEqual(data)
    })

    it('should validate queue entry with minimal fields', () => {
      const data = {
        id: 'call-101',
        patientLabel: 'João ***552',
        specialty: 'Trauma',
        status: 'waiting',
      }

      const result = queueEntrySchema.parse(data)
      expect(result).toEqual(data)
    })

    it('should validate all status values', () => {
      const statuses = ['waiting', 'called', 'in-progress'] as const
      statuses.forEach((status) => {
        const data = {
          id: 'call-102',
          patientLabel: 'Test',
          specialty: 'Test',
          status,
        }
        expect(() => queueEntrySchema.parse(data)).not.toThrow()
      })
    })

    it('should reject invalid status', () => {
      const data = {
        id: 'call-103',
        patientLabel: 'Test',
        specialty: 'Test',
        status: 'invalid',
      }

      expect(() => queueEntrySchema.parse(data)).toThrow()
    })

    it('should reject empty id', () => {
      const data = {
        id: '',
        patientLabel: 'Test',
        specialty: 'Test',
        status: 'waiting',
      }

      expect(() => queueEntrySchema.parse(data)).toThrow()
    })

    it('should reject empty patientLabel', () => {
      const data = {
        id: 'call-104',
        patientLabel: '',
        specialty: 'Test',
        status: 'waiting',
      }

      expect(() => queueEntrySchema.parse(data)).toThrow()
    })
  })

  describe('queueEntriesSchema', () => {
    it('should validate array of queue entries', () => {
      const data = [
        {
          id: 'call-100',
          patientLabel: 'Carla ***921',
          specialty: 'Clínico Geral',
          status: 'waiting',
        },
        {
          id: 'call-101',
          patientLabel: 'João ***552',
          specialty: 'Trauma',
          status: 'called',
          calledAt: '2024-01-01T10:00:00Z',
        },
      ]

      const result = queueEntriesSchema.parse(data)
      expect(result).toHaveLength(2)
    })

    it('should validate empty array', () => {
      const data: unknown[] = []
      const result = queueEntriesSchema.parse(data)
      expect(result).toEqual([])
    })

    it('should reject invalid entry in array', () => {
      const data = [
        {
          id: 'call-100',
          patientLabel: 'Carla ***921',
          specialty: 'Clínico Geral',
          status: 'waiting',
        },
        {
          id: '',
          patientLabel: 'Invalid',
          specialty: 'Test',
          status: 'waiting',
        },
      ]

      expect(() => queueEntriesSchema.parse(data)).toThrow()
    })
  })

  describe('validateApiResponse', () => {
    it('should return validated data on success', () => {
      const data = {
        nropaciente: 123,
        nome: 'Maria',
      }
      const result = validateApiResponse(data, mcPatientResponseSchema, 'paciente')
      expect(result).toEqual(data)
    })

    it('should throw error with context on validation failure', () => {
      const data = {
        nome: 'Maria',
      }

      expect(() => {
        validateApiResponse(data, mcPatientResponseSchema, 'paciente')
      }).toThrow('Invalid paciente response format')
    })

    it('should include validation issues in error message', () => {
      const data = {
        nome: 'Maria',
      }

      try {
        validateApiResponse(data, mcPatientResponseSchema, 'paciente')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        const errorMessage = (error as Error).message
        expect(errorMessage).toContain('Invalid paciente response format')
        expect(errorMessage).toContain('nropaciente')
      }
    })

    it('should handle nested path errors', () => {
      const data = [
        {
          id: 'call-100',
          patientLabel: 'Test',
          specialty: 'Test',
          status: 'waiting',
        },
        {
          id: '',
          patientLabel: 'Invalid',
          specialty: 'Test',
          status: 'waiting',
        },
      ]

      try {
        validateApiResponse(data, queueEntriesSchema, 'fila')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        const errorMessage = (error as Error).message
        expect(errorMessage).toContain('Invalid fila response format')
      }
    })
  })
})

