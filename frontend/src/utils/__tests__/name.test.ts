import { describe, it, expect } from 'vitest'
import { extractFirstName, isValidFullName, normalizeName } from '../name'

describe('Name Utils', () => {
  describe('extractFirstName', () => {
    it('should return the first word of a name', () => {
      expect(extractFirstName('Maria Silva')).toBe('Maria')
      expect(extractFirstName('João')).toBe('João')
    })

    it('should handle extra spaces', () => {
      expect(extractFirstName('  Ana  Maria  ')).toBe('Ana')
    })

    it('should return empty string for empty input', () => {
      expect(extractFirstName('')).toBe('')
    })
  })

  describe('isValidFullName', () => {
    it('should return true for names with at least two words', () => {
      expect(isValidFullName('Maria Silva')).toBe(true)
      expect(isValidFullName('João da Silva')).toBe(true)
    })

    it('should return false for single words', () => {
      expect(isValidFullName('Maria')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidFullName('')).toBe(false)
    })
  })

  describe('normalizeName', () => {
    it('should title case names', () => {
      expect(normalizeName('MARIA SILVA')).toBe('Maria Silva')
      expect(normalizeName('joão da silva')).toBe('João da Silva')
    })

    it('should remove extra spaces', () => {
      expect(normalizeName('  maria   silva  ')).toBe('Maria Silva')
    })

    it('should return empty string for empty input', () => {
      expect(normalizeName('')).toBe('')
    })
  })
})
