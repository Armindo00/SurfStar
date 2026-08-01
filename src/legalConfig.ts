import { getContactEmail } from './config'

function envString(key: string): string | null {
  const value = import.meta.env[key]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Registered business or trading name shown on legal pages. */
export function getLegalEntityName(): string {
  return envString('VITE_LEGAL_ENTITY_NAME') ?? 'SurfStar'
}

/** Company tax ID (NIF) for invoices and legal notices. */
export function getLegalTaxId(): string | null {
  return envString('VITE_LEGAL_NIF')
}

/** Registered business address for legal notices. */
export function getLegalAddress(): string | null {
  return envString('VITE_LEGAL_ADDRESS')
}

/** Official electronic complaints book (Portugal). */
export function getComplaintsBookUrl(): string {
  return envString('VITE_COMPLAINTS_BOOK_URL') ?? 'https://www.livroreclamacoes.pt/inicio'
}

export function getLegalEntitySummary(): string {
  const name = getLegalEntityName()
  const nif = getLegalTaxId()
  const address = getLegalAddress()
  const contact = getContactEmail()
  const parts = [name]
  if (nif) parts.push(`NIF ${nif}`)
  if (address) parts.push(address)
  parts.push(contact)
  return parts.join(' · ')
}
