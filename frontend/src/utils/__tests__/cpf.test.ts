import { describe, it, expect } from 'vitest'
import { stripCpf, formatCpf, isValidCpf } from '../cpf'

describe('CPF Utils', () => {
  describe('stripCpf', () => {
    it('should remove non-digit characters', () => {
      expect(stripCpf('123.456.789-00')).toBe('12345678900')
      expect(stripCpf('123abc456')).toBe('123456')
    })

    it('should limit to 11 digits', () => {
      expect(stripCpf('123456789012345')).toBe('12345678901')
    })
  })

  describe('formatCpf', () => {
    it('should format valid 11-digit CPF', () => {
      expect(formatCpf('12345678900')).toBe('123.456.789-00')
    })

    it('should format partial CPF (3 digits)', () => {
      expect(formatCpf('123')).toBe('123')
    })

    it('should format partial CPF (6 digits)', () => {
      expect(formatCpf('123456')).toBe('123.456')
    })

    it('should format partial CPF (9 digits)', () => {
      expect(formatCpf('123456789')).toBe('123.456.789')
    })

    it('should handle empty string', () => {
      expect(formatCpf('')).toBe('')
    })
  })

  describe('isValidCpf', () => {
    it('should validate correct CPF', () => {
      expect(isValidCpf('52998224725')).toBe(true) // Valid generated CPF
      expect(isValidCpf('123.456.789-00')).toBe(false) // Invalid check digits
    })

    it('should invalidate CPF with incorrect length', () => {
      expect(isValidCpf('1234567890')).toBe(false)
      expect(isValidCpf('123456789012')).toBe(false)
    })

    it('should invalidate known invalid patterns (all same digits)', () => {
      expect(isValidCpf('11111111111')).toBe(false)
      expect(isValidCpf('99999999999')).toBe(false)
    })

    it('should validate with formatting', () => {
      expect(isValidCpf('529.982.247-25')).toBe(true)
    })
  })
})
