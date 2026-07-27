import type { ContactMessageKind } from './types'

export const CONTACT_KINDS: { id: ContactMessageKind; label: string; hint: string }[] = [
  { id: 'feedback', label: 'Product feedback', hint: 'Ideas to improve SurfStar' },
  { id: 'support', label: 'Help & support', hint: 'Account, pairing, or how-to questions' },
  { id: 'bug', label: 'Bug report', hint: 'Something is broken or unexpected' },
  { id: 'billing', label: 'Billing', hint: 'Plans, payments, or subscription issues' },
  { id: 'other', label: 'Other', hint: 'Anything else' },
]

export function contactKindLabel(kind: ContactMessageKind): string {
  return CONTACT_KINDS.find((item) => item.id === kind)?.label ?? kind
}
