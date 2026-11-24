import { describe, expect, it } from 'vitest'
import { drawOpenVsCloseChart, type ChartLayout } from './athleteReportPdfDraw'
import { jsPDF } from 'jspdf'

describe('drawOpenVsCloseChart', () => {
  it('renders without throwing when both values exist', () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    let y = 20
    const layout: ChartLayout = {
      doc,
      margin: 14,
      contentW: 182,
      pageH: 297,
      getY: () => y,
      setY: (next) => {
        y = next
      },
      ensureSpace: () => undefined,
    }

    expect(() =>
      drawOpenVsCloseChart(layout, 'Open vs close', 'Open', 'Close', 6.5, 5.1),
    ).not.toThrow()
    expect(y).toBeGreaterThan(20)
  })

  it('skips drawing when both values are null', () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    let y = 20
    const layout: ChartLayout = {
      doc,
      margin: 14,
      contentW: 182,
      pageH: 297,
      getY: () => y,
      setY: (next) => {
        y = next
      },
      ensureSpace: () => undefined,
    }

    drawOpenVsCloseChart(layout, 'Open vs close', 'Open', 'Close', null, null)
    expect(y).toBe(20)
  })
})
