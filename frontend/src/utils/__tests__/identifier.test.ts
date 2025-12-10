import { describe, it, expect } from 'vitest'
import { createMaskedIdentifier } from '../identifier'

describe('createMaskedIdentifier', () => {
  describe('name prefix creation', () => {
    it('should return "Paciente" when name is empty string', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: '',
        cpf: '12345678901',
      })

      expect(result).toBe('Paciente ***901')
    })

    it('should return "Paciente" when name is only whitespace', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: '   ',
        cpf: '12345678901',
      })

      expect(result).toBe('Paciente ***901')
    })

    it('should return first name when name has single word', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: 'João',
        cpf: '12345678901',
      })

      expect(result).toBe('João ***901')
    })

    it('should return first name and second initial when name has multiple words', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: 'João Silva',
        cpf: '12345678901',
      })

      expect(result).toBe('João S. ***901')
    })

    it('should handle name with multiple spaces between words', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: 'João   Silva   Santos',
        cpf: '12345678901',
      })

      expect(result).toBe('João S. ***901')
    })

    it('should handle name with leading and trailing spaces', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: '  João Silva  ',
        cpf: '12345678901',
      })

      expect(result).toBe('João S. ***901')
    })
  })

  describe('CPF mode', () => {
    it('should mask CPF with last 3 digits', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: 'João Silva',
        cpf: '12345678901',
      })

      expect(result).toBe('João S. ***901')
    })

    it('should handle CPF with formatting characters', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: 'Maria Santos',
        cpf: '123.456.789-01',
      })

      expect(result).toBe('Maria S. ***901')
    })

    it('should use "000" when CPF is empty', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: 'João Silva',
        cpf: '',
      })

      expect(result).toBe('João S. ***000')
    })

    it('should use "000" when CPF is undefined', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: 'João Silva',
      })

      expect(result).toBe('João S. ***000')
    })

    it('should use available digits when CPF has less than 3 digits', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: 'João Silva',
        cpf: '12',
      })

      expect(result).toBe('João S. ***12')
    })

    it('should extract last 3 digits from CPF (limited to 11 digits by stripCpf)', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: 'João Silva',
        cpf: '123456789012345',
      })

      expect(result).toBe('João S. ***901')
    })
  })

  describe('foreign mode', () => {
    it('should mask birth date with last 4 digits', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'foreign',
        name: 'João Silva',
        birthDate: '01/01/1990',
      })

      expect(result).toBe('João S. ***1990')
    })

    it('should handle birth date with different formats', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'foreign',
        name: 'Maria Santos',
        birthDate: '1990-01-01',
      })

      expect(result).toBe('Maria S. ***0101')
    })

    it('should extract only digits from birth date', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'foreign',
        name: 'João Silva',
        birthDate: '01/01/1990',
      })

      expect(result).toBe('João S. ***1990')
    })

    it('should use "EXT" when birth date is empty', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'foreign',
        name: 'João Silva',
        birthDate: '',
      })

      expect(result).toBe('João S. ***EXT')
    })

    it('should use "EXT" when birth date is undefined', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'foreign',
        name: 'João Silva',
      })

      expect(result).toBe('João S. ***EXT')
    })

    it('should use available digits when birth date has less than 4 digits', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'foreign',
        name: 'João Silva',
        birthDate: '199',
      })

      expect(result).toBe('João S. ***199')
    })

    it('should extract last 4 digits from longer date string', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'foreign',
        name: 'João Silva',
        birthDate: '01/01/19901234',
      })

      expect(result).toBe('João S. ***1234')
    })
  })

  describe('edge cases', () => {
    it('should handle empty name with CPF mode', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: '',
        cpf: '12345678901',
      })

      expect(result).toBe('Paciente ***901')
    })

    it('should handle empty name with birth date mode', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'foreign',
        name: '',
        birthDate: '01/01/1990',
      })

      expect(result).toBe('Paciente ***1990')
    })

    it('should handle whitespace-only name with CPF mode', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: '   ',
        cpf: '12345678901',
      })

      expect(result).toBe('Paciente ***901')
    })

    it('should handle whitespace-only name with birth date mode', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'foreign',
        name: '   ',
        birthDate: '01/01/1990',
      })

      expect(result).toBe('Paciente ***1990')
    })

    it('should handle very long name', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: 'João Silva Santos Oliveira Pereira',
        cpf: '12345678901',
      })

      expect(result).toBe('João S. ***901')
    })

    it('should handle name with special characters', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: "José O'Connor",
        cpf: '12345678901',
      })

      expect(result).toBe('José O. ***901')
    })

    it('should handle name with numbers', () => {
      const result = createMaskedIdentifier({
        intakeMode: 'cpf',
        name: 'João Silva 123',
        cpf: '12345678901',
      })

      expect(result).toBe('João S. ***901')
    })
  })
})
