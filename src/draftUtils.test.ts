import { describe, expect, it } from 'vitest'
import type { CustomTrainingTemplate } from './types'
import { resolveDraftSpotId, resolveDraftTemplateId } from './draftUtils'

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
