/**
 * Name utilities for MC AutoAtendimento API
 * API requires first name only for search, full name for creation
 */

/**
 * Extract first name from full name
 * @param fullName - Complete name
 * @returns First name only
 */
export function extractFirstName(fullName: string): string {
  if (!fullName) {
    return ''
  }

  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/)

  return parts[0] ?? ''
}

/**
 * Validate that a name contains at least first and last name
 * @param name - Name to validate
 * @returns true if name has at least 2 words
 */
export function isValidFullName(name: string): boolean {
  if (!name) {
    return false
  }

  const trimmed = name.trim()
  const parts = trimmed.split(/\s+/).filter((part) => part.length > 0)

  // Must have at least 2 parts (first + last name)
  return parts.length >= 2
}

/**
 * Normalize name by removing extra spaces and titlecasing
 * @param name - Name to normalize
 * @returns Normalized name
 */
export function normalizeName(name: string): string {
  if (!name) {
    return ''
  }

  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      // Keep common prepositions/connectors lowercase
      const lowercase = ['de', 'da', 'do', 'dos', 'das', 'e']
      if (lowercase.includes(word.toLowerCase())) {
        return word.toLowerCase()
      }

      // Title case for other words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
