/**
 * Phone number utilities for Brazilian phone numbers in E.164 format
 */

const BRAZIL_COUNTRY_CODE = '55'
const MIN_PHONE_DIGITS = 10 // DDD + 8 digits
const MAX_PHONE_DIGITS = 11 // DDD + 9 digits (mobile)

/**
 * Remove all non-digit characters from phone number
 */
export function stripPhone(value: string): string {
  return value.replace(/\D+/g, '')
}

/**
 * Format phone number to E.164 international format (55DDDNUMBER)
 * @param value - Phone number in any format
 * @returns Phone in E.164 format or empty string if invalid
 */
export function formatPhoneE164(value: string): string {
  const digits = stripPhone(value)

  // Already has country code
  if (digits.startsWith(BRAZIL_COUNTRY_CODE)) {
    return digits
  }

  // Add Brazil country code
  if (digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS) {
    return `${BRAZIL_COUNTRY_CODE}${digits}`
  }

  return digits
}

/**
 * Validate Brazilian phone number
 * Accepts formats with or without country code
 */
export function isValidBrazilianPhone(value: string): boolean {
  const digits = stripPhone(value)

  // Check DDD (first 2 digits)
  const ddd = parseInt(digits.slice(digits.startsWith(BRAZIL_COUNTRY_CODE) ? 2 : 0, digits.startsWith(BRAZIL_COUNTRY_CODE) ? 4 : 2))
  if (ddd < 11 || ddd > 99) {
    return false
  }

  // With country code: 55 + DDD (2) + number (8-9)
  if (digits.startsWith(BRAZIL_COUNTRY_CODE)) {
    const withoutCountry = digits.slice(2)
    return (
      withoutCountry.length >= MIN_PHONE_DIGITS &&
      withoutCountry.length <= MAX_PHONE_DIGITS
    )
  }

  // Without country code: DDD (2) + number (8-9)
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS
}

/**
 * Format phone for display (mask)
 * @example formatPhoneDisplay("5511999998888") => "+55 (11) 99999-8888"
 */
export function formatPhoneDisplay(value: string): string {
  const digits = stripPhone(value)

  let phone = digits
  if (digits.startsWith(BRAZIL_COUNTRY_CODE)) {
    phone = digits.slice(2)
  }

  if (phone.length === 10) {
    // Landline: (DD) DDDD-DDDD
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`
  }

  if (phone.length === 11) {
    // Mobile: (DD) DDDDD-DDDD
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`
  }

  return value
}
