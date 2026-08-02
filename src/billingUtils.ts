import {
  getBillingCountryName,
  isKnownBillingCountryCode,
  normalizeBillingCountryCode,
} from './billingCountries'
import { getLocale } from './i18n'
import { getMessages } from './i18n/messages'
import type { SupportedLocale } from './i18n/types'

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

export function getTaxIdLabel(countryCode: string, locale: SupportedLocale = getLocale()): string {
  const taxId = getMessages(locale).billing.taxId
  return countryCode.trim().toUpperCase() === 'PT' ? taxId.nifLabel : taxId.defaultLabel
}

export function getTaxIdHint(countryCode: string, locale: SupportedLocale = getLocale()): string {
  const taxId = getMessages(locale).billing.taxId
  const code = countryCode.trim().toUpperCase()
  if (code === 'PT') return taxId.nifHint
  if (code === 'GB') return taxId.gbHint
  if (code === 'US') return taxId.usHint
  return taxId.defaultHint
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

export function validateTaxId(
  value: string,
  countryCode: string,
  locale: SupportedLocale = getLocale(),
): string | null {
  const v = getMessages(locale).billing.validation
  const trimmed = value.trim()
  const code = countryCode.trim().toUpperCase()

  if (!trimmed) return code === 'PT' ? v.enterNif : v.enterTaxId
  if (!code) return v.selectCountryFirst

  if (code === 'PT') {
    if (!isValidPortugueseTaxId(trimmed)) return v.invalidPortugueseNif
    return null
  }

  const normalized = normalizeTaxId(trimmed, code)
  if (normalized.length < 3 || normalized.length > 20) {
    return v.invalidTaxIdLength
  }
  if (!/^[A-Z0-9\-./]+$/.test(normalized)) {
    return v.invalidTaxIdFormat
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

export function validatePostalCode(
  value: string,
  countryCode: string,
  locale: SupportedLocale = getLocale(),
): string | null {
  const v = getMessages(locale).billing.validation
  const trimmed = value.trim()
  const code = countryCode.trim().toUpperCase()

  if (!trimmed) return v.enterPostalCode
  if (!code) return v.selectCountryFirst

  if (code === 'PT') {
    const normalized = normalizePostalCode(trimmed, code)
    if (!/^\d{4}-\d{3}$/.test(normalized)) {
      return v.invalidPortuguesePostal
    }
    return null
  }

  if (trimmed.length < 2 || trimmed.length > 16) {
    return v.invalidPostalCode
  }
  if (!/^[A-Za-z0-9\s\-]+$/.test(trimmed)) {
    return v.invalidPostalCode
  }
  return null
}

export function validateBillingAddressParts(
  address: BillingAddress,
  locale: SupportedLocale = getLocale(),
): string | null {
  const v = getMessages(locale).billing.validation
  const street = address.street.trim()
  const city = address.city.trim()
  const countryCode = normalizeBillingCountryCode(address.countryCode)

  if (street.length < 3) return v.enterAddressLine1
  if (city.length < 2) return v.enterCity
  if (!countryCode || !isKnownBillingCountryCode(countryCode)) {
    return v.selectBillingCountry
  }

  const postalError = validatePostalCode(address.postalCode, countryCode, locale)
  if (postalError) return postalError

  if (regionRecommendedForCountry(countryCode) && !address.region?.trim()) {
    return v.enterRegion
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
