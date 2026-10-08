function slugifyName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'athlete'
}

export function athleteReportPdfFilename(athleteName: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `surfstar-${slugifyName(athleteName)}-${date}.pdf`
}

/** ~A4 content width at 96dpi — same layout on phone and desktop PDFs */
export const ATHLETE_REPORT_PDF_WIDTH_PX = 794

const PDF_LAYOUT_CLASS = 'athlete-report--pdf-layout'
const PDF_CAPTURE_BACKDROP_CLASS = 'athlete-report-backdrop--pdf-capture'

function applyPdfCaptureLayout(element: HTMLElement): () => void {
  const root = element.closest('.athlete-report-print-root') as HTMLElement | null
  const backdrop = element.closest('.athlete-report-backdrop') as HTMLElement | null
  element.classList.add(PDF_LAYOUT_CLASS)
  root?.classList.add(PDF_LAYOUT_CLASS)
  backdrop?.classList.add(PDF_CAPTURE_BACKDROP_CLASS)
  if (backdrop) backdrop.scrollTop = 0
  element.scrollIntoView({ block: 'start' })
  void element.offsetHeight
  return () => {
    element.classList.remove(PDF_LAYOUT_CLASS)
    root?.classList.remove(PDF_LAYOUT_CLASS)
    backdrop?.classList.remove(PDF_CAPTURE_BACKDROP_CLASS)
  }
}

function waitForLayoutPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

export async function generateAthleteReportPdfBlob(element: HTMLElement): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const restoreLayout = applyPdfCaptureLayout(element)
  await waitForLayoutPaint()

  let canvas
  try {
    const captureWidth = element.scrollWidth
    const captureHeight = element.scrollHeight
    const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1))

    canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: captureWidth,
      height: captureHeight,
      windowWidth: captureWidth,
      windowHeight: captureHeight,
      scrollX: 0,
      scrollY: -window.scrollY,
    })
  } finally {
    restoreLayout()
  }

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  return pdf.output('blob')
}

export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function canSharePdfFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share) return false
  if (typeof navigator.canShare !== 'function') return true
  const probe = new File([new Uint8Array([0])], 'probe.pdf', { type: 'application/pdf' })
  return navigator.canShare({ files: [probe] })
}

export async function sharePdfBlob(blob: Blob, filename: string, title: string): Promise<'shared' | 'unavailable'> {
  if (!canSharePdfFiles()) return 'unavailable'

  const file = new File([blob], filename, { type: 'application/pdf' })
  await navigator.share({ title, files: [file] })
  return 'shared'
}
