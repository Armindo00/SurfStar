import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CustomTrainingTemplate } from './types'
import {
  loadLastSpotId,
  resolveDraftSpotId,
  resolveDraftTemplateId,
  saveLastSpotId,
} from './draftUtils'

const storage = new Map<string, string>()

describe('resolveDraftSpotId', () => {
  const spots = [
    { id: 'guincho', name: 'Guincho' },
    { id: 'praia-grande', name: 'Praia Grande' },
  ]

  it('keeps a valid selected spot', () => {
    expect(resolveDraftSpotId('praia-grande', spots)).toBe('praia-grande')
  })

  it('falls back to the first spot when the selection is missing', () => {
    expect(resolveDraftSpotId('', spots)).toBe('guincho')
  })

  it('falls back to the first spot when the selection no longer exists', () => {
    expect(resolveDraftSpotId('deleted-spot', spots)).toBe('guincho')
  })
})

describe('resolveDraftTemplateId', () => {
  const templates = [
    { id: 'template-a' },
    { id: 'template-b' },
  ] as CustomTrainingTemplate[]

  it('keeps a valid selected template', () => {
    expect(resolveDraftTemplateId('template-b', templates)).toBe('template-b')
  })

  it('falls back to the first template when the selection is missing', () => {
    expect(resolveDraftTemplateId('', templates)).toBe('template-a')
  })
})

describe('last spot persistence', () => {
  const spots = [
    { id: 'guincho', name: 'Guincho' },
    { id: 'praia-grande', name: 'Praia Grande' },
  ]

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
      clear: () => {
        storage.clear()
      },
    })
  })

  it('remembers the last selected spot per organization', () => {
    saveLastSpotId('org-1', 'praia-grande')
    expect(loadLastSpotId('org-1', spots)).toBe('praia-grande')
    expect(loadLastSpotId('org-2', spots)).toBe('guincho')
  })

  it('falls back when the saved spot no longer exists', () => {
    saveLastSpotId('org-1', 'deleted-spot')
    expect(loadLastSpotId('org-1', spots)).toBe('guincho')
  })
})
