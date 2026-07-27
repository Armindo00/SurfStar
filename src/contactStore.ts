import type { ContactMessage } from './types'

const KEY = 'surfstar-contact-v1'

type Stored = {
  messages: ContactMessage[]
}

function load(): Stored {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { messages: [] }
    const parsed = JSON.parse(raw) as Stored
    return { messages: parsed.messages ?? [] }
  } catch {
    return { messages: [] }
  }
}

function save(data: Stored) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export const contactStore = {
  list(): ContactMessage[] {
    return load().messages.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  },
  save(message: ContactMessage): ContactMessage {
    const data = load()
    data.messages.unshift(message)
    save(data)
    return message
  },
  updateStatus(messageId: string, status: ContactMessage['status']) {
    const data = load()
    data.messages = data.messages.map((m) => (m.id === messageId ? { ...m, status } : m))
    save(data)
  },
}
