/** Comma- or semicolon-separated list → unique lowercased emails. */
export function parseEmailList(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[,;]/)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
}

/** BCC header value excluding the primary recipient (avoids duplicate to self). */
export function bccHeaderForRecipient(recipient: string, bccList: string[]): string | undefined {
  const to = recipient.trim().toLowerCase()
  const filtered = bccList.filter((email) => email !== to)
  if (filtered.length === 0) return undefined
  return filtered.join(', ')
}

export const DEFAULT_COACH_NOTIFY_BCC = 'contact@surfstar.app,armindoapp@outlook.com'

export function coachNotifyBccList(): string[] {
  const raw = Deno.env.get('COACH_NOTIFY_BCC') ?? DEFAULT_COACH_NOTIFY_BCC
  return parseEmailList(raw)
}
