import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { IntakeSubmission } from '../../features/intake/types'

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()

vi.mock('../http', () => ({
  apiClient: {
    get: mockApiGet,
    post: mockApiPost,
  },
}))

vi.mock('../auth', () => ({
  getCompanyCode: vi.fn(() => '123'),
}))

const importService = () => import('../intake')

describe('Intake Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.doMock('../../config/api', () => ({
      IS_API_CONFIGURED: true,
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('lookupPatients', () => {
    it('should call API with correct parameters', async () => {
      const mockResponse = {
        data: [
          { nropaciente: 10, nome: 'Maria', cpf: '123', nasci: '2023-01-01' },
          { nropaciente: 5, nome: 'Joao', cpf: '456', nasci: '2023-01-01' },
        ],
      }
      mockApiGet.mockResolvedValue(mockResponse)

      const { lookupPatients } = await importService()
      const result = await lookupPatients('123.456.789-00', '2023-01-01', 'Maria Silva', '11999999999')

      expect(mockApiGet).toHaveBeenCalledWith('/pacientesautoage', {
        params: {
          cpf: '12345678900',
          nasci: '01/01/2023',
          integracaowhatsapp: 'S',
          autoagendamento: 'true',
          nome: 'Maria',
          celular: '5511999999999',
        },
      })

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('10') // Sorted desc
    })

    it('should handle API errors', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))
      const { lookupPatients } = await importService()
      await expect(lookupPatients('123', '2023-01-01')).rejects.toThrow('Network error')
    })

    it('returns fallback patient when API disabled and CPF even', async () => {
      vi.doMock('../../config/api', () => ({ IS_API_CONFIGURED: false }))
      const { lookupPatients } = await importService()
      const result = await lookupPatients('123.456.789-02', '2024-05-05')

      expect(result).toEqual([
        {
          id: 'patient-12345678902',
          name: 'Maria Conceição',
          document: '12345678902',
          birthDate: '2024-05-05',
        },
      ])
      expect(mockApiGet).not.toHaveBeenCalled()
    })

    it('returns empty list when API disabled and CPF odd', async () => {
      vi.doMock('../../config/api', () => ({ IS_API_CONFIGURED: false }))
      const { lookupPatients } = await importService()
      const result = await lookupPatients('12345678901', '2024-05-05')

      expect(result).toEqual([])
    })
  })

  describe('createPatient', () => {
    it('should call API and return patient ID on success', async () => {
      mockApiPost.mockResolvedValue({
        data: { ok: true, nropac: 12345 },
      })

      const { createPatient } = await importService()
      const id = await createPatient('12345678900', 'Maria', '2023-01-01', '11999999999', 'conv1')

      expect(mockApiPost).toHaveBeenCalledWith(
        '/pacientesautoage',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      )
      expect(id).toBe('12345')

      const params = mockApiPost.mock.calls[0][1] as URLSearchParams
      expect(Object.fromEntries(params)).toEqual({
        cpf: '12345678900',
        nome: 'Maria',
        nasci: '01012023',
        celular: '5511999999999',
        convenio: 'conv1',
        integracaowhatsapp: 'S',
      })
    })

    it('should throw error on failure', async () => {
      mockApiPost.mockResolvedValue({
        data: { ok: false, message: 'Error' },
      })

      const { createPatient } = await importService()
      await expect(createPatient('123', 'Maria', '2023', '11', 'c')).rejects.toThrow('Error')
    })

    it('returns mock id and skips API when disabled', async () => {
      vi.doMock('../../config/api', () => ({ IS_API_CONFIGURED: false }))
      vi.spyOn(Date, 'now').mockReturnValue(1700000000000)

      const { createPatient } = await importService()
      const id = await createPatient('12345678900', 'Maria', '2023-01-01', '11999999999', 'conv1')

      expect(id).toBe('mock-patient-1700000000000')
      expect(mockApiPost).not.toHaveBeenCalled()
    })
  })

  describe('listConvenios', () => {
    it('should fetch and map convenios', async () => {
      mockApiGet.mockResolvedValue({
        data: [{ convenio: '1', nomefantasia: 'Unimed', razaosocial: 'Unimed Brasil' }],
      })

      const { listConvenios } = await importService()
      const result = await listConvenios()
      expect(result).toEqual([{ id: '1', name: 'Unimed' }])
      expect(mockApiGet).toHaveBeenCalledWith('/convenios', expect.any(Object))
    })

    it('falls back to razaosocial or id for missing fantasy name', async () => {
      mockApiGet.mockResolvedValue({
        data: [{ convenio: '2', razaosocial: 'Hospital XPTO' }],
      })

      const { listConvenios } = await importService()
      const result = await listConvenios()

      expect(result).toEqual([{ id: '2', name: 'Hospital XPTO' }])
    })

    it('should handle API errors', async () => {
      mockApiGet.mockRejectedValue(new Error('API error'))
      const { listConvenios } = await importService()
      await expect(listConvenios()).rejects.toThrow('API error')
    })

    it('returns fallback convenios when API disabled', async () => {
      vi.doMock('../../config/api', () => ({ IS_API_CONFIGURED: false }))
      const { listConvenios } = await importService()
      const convenios = await listConvenios()

      expect(convenios).toHaveLength(4)
      expect(convenios[0]).toEqual({ id: 'particular', name: 'Particular' })
      expect(mockApiGet).not.toHaveBeenCalled()
    })
  })

  describe('listSpecialties', () => {
    it('should fetch and map specialties', async () => {
      mockApiGet.mockResolvedValue({
        data: [{ especialidade: '1', descricao: 'Cardiologia' }],
      })

      const { listSpecialties } = await importService()
      const result = await listSpecialties()
      expect(result).toEqual([{ id: '1', name: 'Cardiologia' }])
      expect(mockApiGet).toHaveBeenCalledWith('/especialidades', expect.any(Object))
    })

    it('should handle API errors', async () => {
      mockApiGet.mockRejectedValue(new Error('API error'))
      const { listSpecialties } = await importService()
      await expect(listSpecialties()).rejects.toThrow('API error')
    })

    it('returns fallback specialties when API disabled', async () => {
      vi.doMock('../../config/api', () => ({ IS_API_CONFIGURED: false }))
      const { listSpecialties } = await importService()

      const specialties = await listSpecialties()
      expect(specialties).toEqual([
        { id: 'clinico-geral', name: 'Clínico Geral' },
        { id: 'trauma', name: 'Trauma' },
        { id: 'pediatria', name: 'Pediatria' },
        { id: 'ginecologia', name: 'Ginecologia' },
      ])
      expect(mockApiGet).not.toHaveBeenCalled()
    })
  })

  describe('submitIntake', () => {
    it('should post attendance data', async () => {
      mockApiPost.mockResolvedValue({
        status: 200,
        data: { type: 'success' },
      })

      const { submitIntake } = await importService()
      await submitIntake({
        specialtyId: 'spec1',
        convenioId: 'conv1',
        patientId: 'pat1',
        intakeMode: 'cpf',
        cpf: '123',
        birthDate: '2023',
        reason: 'reason',
      } as IntakeSubmission)

      expect(mockApiPost).toHaveBeenCalledWith(
        '/atendimentoboletim',
        expect.any(URLSearchParams),
        expect.any(Object),
      )

      const params = mockApiPost.mock.calls[0][1] as URLSearchParams
      expect(Object.fromEntries(params)).toEqual({
        autoagendamento: 'true',
        especialidade: 'spec1',
        convenio: 'conv1',
        nropaciente: 'pat1',
        tipo: 'e',
        integracaowhatsapp: 'S',
      })
    })

    it('should throw if status is not 200 or type not success', async () => {
      mockApiPost.mockResolvedValue({
        status: 200,
        data: { type: 'error', message: 'Fail' },
      })

      const { submitIntake } = await importService()
      await expect(submitIntake({} as IntakeSubmission)).rejects.toThrow('Fail')
    })

    it('throws when request fails before response', async () => {
      mockApiPost.mockRejectedValue(new Error('timeout'))
      const { submitIntake } = await importService()

      await expect(submitIntake({} as IntakeSubmission)).rejects.toThrow('timeout')
    })

    it('throws when status is not 200', async () => {
      mockApiPost.mockResolvedValue({
        status: 500,
        data: { type: 'success', message: '??' },
      })

      const { submitIntake } = await importService()
      await expect(submitIntake({} as IntakeSubmission)).rejects.toThrow('??')
    })

    it('resolves via mock path when API disabled', async () => {
      vi.doMock('../../config/api', () => ({ IS_API_CONFIGURED: false }))
      vi.useFakeTimers()
      const { submitIntake } = await importService()

      const promise = submitIntake({} as IntakeSubmission)
      await vi.advanceTimersByTimeAsync(500)
      await expect(promise).resolves.toBeUndefined()
      expect(mockApiPost).not.toHaveBeenCalled()
    })

    it('serializes empty optional params as blank strings', async () => {
      mockApiPost.mockResolvedValue({
        status: 200,
        data: { type: 'success' },
      })
      const { submitIntake } = await importService()

      await submitIntake({
        specialtyId: 'spec',
        convenioId: undefined,
        patientId: undefined,
      } as IntakeSubmission)

      const params = mockApiPost.mock.calls[0][1] as URLSearchParams
      expect(params.get('convenio')).toBe('')
      expect(params.get('nropaciente')).toBe('')
    })
  })
})
