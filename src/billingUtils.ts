/** Strip spaces and optional PT prefix from a Portuguese tax ID (NIF). */
export function normalizeTaxId(value: string): string {
  return value.replace(/\s+/g, '').replace(/^PT/i, '').trim()
}

/** Basic Portuguese NIF validation (9 digits + check digit). */
export function isValidPortugueseTaxId(value: string): boolean {
  const nif = normalizeTaxId(value)
  if (!/^\d{9}$/.test(nif)) return false

  const checkDigit = Number(nif[8])
  let sum = 0
  for (let i = 0; i < 8; i += 1) {
    sum += Number(nif[i]) * (9 - i)
  }
  const mod = sum % 11
  const expected = mod < 2 ? 0 : 11 - mod
  return checkDigit === expected
}

export function validateTaxId(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Enter your NIF (tax ID).'
  if (!isValidPortugueseTaxId(trimmed)) return 'Enter a valid 9-digit NIF.'
  return null
}

export function validateBillingAddress(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length < 10) return 'Enter your full billing address (street, postal code, city).'
  return null
}
