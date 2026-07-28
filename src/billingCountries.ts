/** ISO 3166-1 alpha-2 billing countries (English names). */
export type BillingCountry = {
  code: string
  name: string
}

/** Shown first — common SurfStar markets. */
export const POPULAR_BILLING_COUNTRY_CODES = [
  'PT',
  'ES',
  'FR',
  'GB',
  'US',
  'BR',
  'DE',
  'NL',
  'IE',
  'AU',
  'NZ',
  'ZA',
  'MA',
  'IT',
  'CH',
] as const

export const BILLING_COUNTRIES: BillingCountry[] = [
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'BR', name: 'Brazil' },
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IE', name: 'Ireland' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'MA', name: 'Morocco' },
  { code: 'IT', name: 'Italy' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HR', name: 'Croatia' },
  { code: 'HU', name: 'Hungary' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IL', name: 'Israel' },
  { code: 'IN', name: 'India' },
  { code: 'IS', name: 'Iceland' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'LV', name: 'Latvia' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MT', name: 'Malta' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NO', name: 'Norway' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'RO', name: 'Romania' },
  { code: 'SE', name: 'Sweden' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'VN', name: 'Vietnam' },
].sort((a, b) => a.name.localeCompare(b.name, 'en'))

const countryByCode = new Map(BILLING_COUNTRIES.map((country) => [country.code, country]))

export function getBillingCountryName(code: string): string {
  const normalized = code.trim().toUpperCase()
  return countryByCode.get(normalized)?.name ?? code.trim()
}

export function isKnownBillingCountryCode(code: string): boolean {
  return countryByCode.has(code.trim().toUpperCase())
}

export function getPopularBillingCountries(): BillingCountry[] {
  return POPULAR_BILLING_COUNTRY_CODES.map((code) => countryByCode.get(code)).filter(
    (country): country is BillingCountry => Boolean(country),
  )
}

export function getOtherBillingCountries(): BillingCountry[] {
  const popular = new Set<string>(POPULAR_BILLING_COUNTRY_CODES)
  return BILLING_COUNTRIES.filter((country) => !popular.has(country.code))
}

/** Legacy rows may store full country names instead of ISO codes. */
export function normalizeBillingCountryCode(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const upper = trimmed.toUpperCase()
  if (countryByCode.has(upper)) return upper
  const match = BILLING_COUNTRIES.find((country) => country.name.toLowerCase() === trimmed.toLowerCase())
  return match?.code ?? upper.slice(0, 2)
}
