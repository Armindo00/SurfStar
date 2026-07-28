import {
  getBillingCountryName,
  isKnownBillingCountryCode,
  normalizeBillingCountryCode,
} from './billingCountries'

/** Structured billing address for international invoicing. */
export type BillingAddress = {
  street: string
  addressLine2?: string
  city: string
  region?: string
  postalCode: string
  countryCode: string
}

const REGION_RECOMMENDED_CODES = new Set(['US', 'CA', 'AU', 'BR', 'MX', 'IN'])

export function regionRecommendedForCountry(countryCode: string): boolean {
  return REGION_RECOMMENDED_CODES.has(countryCode.trim().toUpperCase())
}

export function getTaxIdLabel(countryCode: string): string {
  return countryCode.trim().toUpperCase() === 'PT' ? 'NIF (Portuguese tax ID)' : 'Tax ID / VAT number'
}

export function getTaxIdHint(countryCode: string): string {
  const code = countryCode.trim().toUpperCase()
  if (code === 'PT') return '9-digit Portuguese NIF used on invoices.'
  if (code === 'GB') return 'Company or personal tax reference (e.g. VAT number).'
  if (code === 'US') return 'EIN or other tax identifier if applicable.'
  return 'Local tax ID or VAT number for your invoice.'
}

/** Normalize tax ID for storage (uppercase, no spaces). */
export function normalizeTaxId(value: string, countryCode = ''): string {
  const compact = value.replace(/\s+/g, '').toUpperCase()
  if (countryCode.trim().toUpperCase() === 'PT') {
    return compact.replace(/^PT/i, '')
  }
  return compact
}

export function isValidPortugueseTaxId(value: string): boolean {
  const nif = normalizeTaxId(value, 'PT')
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

export function validateTaxId(value: string, countryCode: string): string | null {
  const trimmed = value.trim()
  const code = countryCode.trim().toUpperCase()

  if (!trimmed) return `Enter your ${code === 'PT' ? 'NIF' : 'tax ID or VAT number'}.`
  if (!code) return 'Select your billing country first.'

  if (code === 'PT') {
    if (!isValidPortugueseTaxId(trimmed)) return 'Enter a valid Portuguese NIF (9 digits).'
    return null
  }

  const normalized = normalizeTaxId(trimmed, code)
  if (normalized.length < 3 || normalized.length > 20) {
    return 'Enter a valid tax ID or VAT number (3–20 characters).'
  }
  if (!/^[A-Z0-9\-./]+$/.test(normalized)) {
    return 'Enter a valid tax ID or VAT number.'
  }
  return null
}

export function normalizePostalCode(value: string, countryCode: string): string {
  const trimmed = value.trim()
  const code = countryCode.trim().toUpperCase()
  if (code === 'PT') {
    const compact = trimmed.replace(/\s+/g, '')
    if (/^\d{7}$/.test(compact)) {
      return `${compact.slice(0, 4)}-${compact.slice(4)}`
    }
  }
  return trimmed.toUpperCase()
}

export function validatePostalCode(value: string, countryCode: string): string | null {
  const trimmed = value.trim()
  const code = countryCode.trim().toUpperCase()

  if (!trimmed) return 'Enter your postal or ZIP code.'
  if (!code) return 'Select your billing country first.'

  if (code === 'PT') {
    const normalized = normalizePostalCode(trimmed, code)
    if (!/^\d{4}-\d{3}$/.test(normalized)) {
      return 'Enter a valid Portuguese postal code (e.g. 1200-001).'
    }
    return null
  }

  if (trimmed.length < 2 || trimmed.length > 16) {
    return 'Enter a valid postal or ZIP code.'
  }
  if (!/^[A-Za-z0-9\s\-]+$/.test(trimmed)) {
    return 'Enter a valid postal or ZIP code.'
  }
  return null
}

export function validateBillingAddressParts(address: BillingAddress): string | null {
  const street = address.street.trim()
  const city = address.city.trim()
  const countryCode = normalizeBillingCountryCode(address.countryCode)

  if (street.length < 3) return 'Enter address line 1.'
  if (city.length < 2) return 'Enter your city.'
  if (!countryCode || !isKnownBillingCountryCode(countryCode)) {
    return 'Select your billing country.'
  }

  const postalError = validatePostalCode(address.postalCode, countryCode)
  if (postalError) return postalError

  if (regionRecommendedForCountry(countryCode) && !address.region?.trim()) {
    return 'Enter your state, province, or region.'
  }

  return null
}

export function normalizeBillingAddress(address: BillingAddress): BillingAddress {
  const countryCode = normalizeBillingCountryCode(address.countryCode)
  return {
    street: address.street.trim(),
    addressLine2: address.addressLine2?.trim() || undefined,
    city: address.city.trim(),
    region: address.region?.trim() || undefined,
    postalCode: normalizePostalCode(address.postalCode, countryCode),
    countryCode,
  }
}

export function formatBillingAddress(address: BillingAddress): string {
  const normalized = normalizeBillingAddress(address)
  const countryName = getBillingCountryName(normalized.countryCode)
  const locality = [normalized.postalCode, normalized.city].filter(Boolean).join(' ')
  const regionPart = normalized.region ? `, ${normalized.region}` : ''
  const line2 = normalized.addressLine2 ? `, ${normalized.addressLine2}` : ''

  return `${normalized.street}${line2}, ${locality}${regionPart}, ${countryName} (${normalized.countryCode})`
}

export function hasCompleteBillingAddress(address?: BillingAddress | null): boolean {
  if (!address) return false
  return validateBillingAddressParts(address) === null
}

export function billingAddressFromLegacy(value: string | null | undefined): BillingAddress | undefined {
  if (!value?.trim()) return undefined
  return {
    street: value.trim(),
    city: '',
    postalCode: '',
    countryCode: '',
  }
}

export function billingAddressFromRow(row: {
  billing_street?: string | null
  billing_address_line2?: string | null
  billing_postal_code?: string | null
  billing_city?: string | null
  billing_region?: string | null
  billing_country?: string | null
  billing_address?: string | null
}): BillingAddress | undefined {
  if (row.billing_street?.trim()) {
    return normalizeBillingAddress({
      street: row.billing_street,
      addressLine2: row.billing_address_line2 ?? undefined,
      postalCode: row.billing_postal_code ?? '',
      city: row.billing_city ?? '',
      region: row.billing_region ?? undefined,
      countryCode: row.billing_country ?? '',
    })
  }
  return billingAddressFromLegacy(row.billing_address)
}

export function emptyBillingAddress(): BillingAddress {
  return {
    street: '',
    addressLine2: '',
    city: '',
    region: '',
    postalCode: '',
    countryCode: '',
  }
}
