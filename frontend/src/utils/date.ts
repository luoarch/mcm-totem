/**
 * Date formatting utilities for MC AutoAtendimento API
 * API requires different formats for search vs creation
 */

/**
 * Format date to DD/MM/AAAA for patient search
 * @param date - Date object or ISO string
 * @returns Date string in DD/MM/AAAA format
 */
export function formatDateForSearch(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const year = dateObj.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Format date to ddmmyyyy for patient creation
 * @param date - Date object or ISO string
 * @returns Date string in ddmmyyyy format
 */
export function formatDateForCreation(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const year = dateObj.getFullYear()

  return `${day}${month}${year}`
}

/**
 * Parse DD/MM/AAAA format to Date object
 * @param dateStr - Date string in DD/MM/AAAA format
 * @returns Date object or Invalid Date if parsing fails
 */
export function parseDateDDMMYYYY(dateStr: string): Date | null {
  const parts = dateStr.split('/')
  if (parts.length !== 3) {
    return null
  }

  const [day, month, year] = parts
  if (!day || !month || !year) {
    return null
  }

  // Month is 0-indexed in JS Date
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))

  // Strict validation: check if components match (handles 31/02 -> 03/03 rollover)
  if (
    date.getFullYear() !== parseInt(year, 10) ||
    date.getMonth() !== parseInt(month, 10) - 1 ||
    date.getDate() !== parseInt(day, 10)
  ) {
    return null
  }

  return date
}

/**
 * Parse ddmmyyyy format to Date object
 * @param dateStr - Date string in ddmmyyyy format
 * @returns Date object or Invalid Date if parsing fails
 */
export function parseDateDDMMYYYY_Compact(dateStr: string): Date | null {
  if (dateStr.length !== 8) {
    return null
  }

  const day = dateStr.slice(0, 2)
  const month = dateStr.slice(2, 4)
  const year = dateStr.slice(4, 8)

  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))

  // Strict validation
  if (
    date.getFullYear() !== parseInt(year, 10) ||
    date.getMonth() !== parseInt(month, 10) - 1 ||
    date.getDate() !== parseInt(day, 10)
  ) {
    return null
  }

  return date
}

/**
 * Validate date string format (DD/MM/AAAA or ddmmyyyy)
 * @param dateStr - Date string to validate
 * @returns true if valid date format and represents a real date
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) {
    return false
  }

  let date: Date | null = null

  // Try DD/MM/AAAA format
  if (dateStr.includes('/')) {
    date = parseDateDDMMYYYY(dateStr)
  }
  // Try ddmmyyyy format
  else if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
    date = parseDateDDMMYYYY_Compact(dateStr)
  } else {
    return false
  }

  return date ? !isNaN(date.getTime()) : false
}

/**
 * Convert ISO date string (from form input) to DD/MM/AAAA format
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns Date in DD/MM/AAAA format
 */
export function isoToSearchFormat(isoDate: string): string {
  if (!isoDate) {
    return ''
  }

  const parts = isoDate.split('-')
  if (parts.length !== 3) {
    return ''
  }

  const [year, month, day] = parts
  return `${day}/${month}/${year}`
}

/**
 * Convert ISO date string (from form input) to ddmmyyyy format
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns Date in ddmmyyyy format
 */
export function isoToCreationFormat(isoDate: string): string {
  if (!isoDate) {
    return ''
  }

  const parts = isoDate.split('-')
  if (parts.length !== 3) {
    return ''
  }

  const [year, month, day] = parts
  return `${day}${month}${year}`
}
