import { describe, it, expect } from 'vitest'
import {
  formatPhoneE164,
  isValidBrazilianPhone,
  stripPhone,
  formatPhoneDisplay,
} from '../phone'

describe('Phone Utils', () => {
  describe('stripPhone', () => {
    it('should remove non-digit characters', () => {
      expect(stripPhone('(11) 99999-9999')).toBe('11999999999')
      expect(stripPhone('11 99999 9999')).toBe('11999999999')
      expect(stripPhone('+55 (11) 99999-9999')).toBe('5511999999999')
    })

    it('should return empty string for empty input', () => {
      expect(stripPhone('')).toBe('')
    })
  })

  describe('isValidBrazilianPhone', () => {
    it('should validate correct mobile numbers', () => {
      expect(isValidBrazilianPhone('11999999999')).toBe(true)
      expect(isValidBrazilianPhone('(11) 99999-9999')).toBe(true)
    })

    it('should validate correct landline numbers', () => {
      expect(isValidBrazilianPhone('1133334444')).toBe(true)
      expect(isValidBrazilianPhone('(11) 3333-4444')).toBe(true)
    })

    it('should invalidate numbers with incorrect length', () => {
      expect(isValidBrazilianPhone('119999999')).toBe(false) // missing digit (9 digits)
      expect(isValidBrazilianPhone('119999999999')).toBe(false) // extra digit
    })

    it('should invalidate numbers with invalid DDD', () => {
      expect(isValidBrazilianPhone('00999999999')).toBe(false)
    })

    it('should validate numbers with country code', () => {
      expect(isValidBrazilianPhone('5511999999999')).toBe(true)
      expect(isValidBrazilianPhone('551133334444')).toBe(true)
    })
  })

  describe('formatPhoneE164', () => {
    it('should format valid mobile number to E.164', () => {
      expect(formatPhoneE164('11999999999')).toBe('5511999999999')
      expect(formatPhoneE164('(11) 99999-9999')).toBe('5511999999999')
    })

    it('should return digits unchanged if already has country code', () => {
      expect(formatPhoneE164('5511999999999')).toBe('5511999999999')
    })

    it('should return original string if invalid', () => {
      expect(formatPhoneE164('123')).toBe('123')
    })
  })

  describe('formatPhoneDisplay', () => {
    it('should format 11-digit mobile number', () => {
      expect(formatPhoneDisplay('11999999999')).toBe('(11) 99999-9999')
    })

    it('should format 10-digit landline number', () => {
      expect(formatPhoneDisplay('1133334444')).toBe('(11) 3333-4444')
    })

    it('should handle numbers with country code', () => {
      expect(formatPhoneDisplay('5511999999999')).toBe('(11) 99999-9999')
    })

    it('should return original string if length is invalid', () => {
      expect(formatPhoneDisplay('123')).toBe('123')
    })
  })
})
