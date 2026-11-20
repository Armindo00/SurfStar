/**
 * Probe athlete report sheet scroll at desktop + mobile widths.
 * Fails if nested table wraps trap vertical wheel or cookie covers footer.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const css = fs.readFileSync(path.join(root, 'src/App.css'), 'utf8')

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<style>${css}
body { margin: 0; font-family: system-ui, sans-serif; background: #0b1220; }
.cookie-consent { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10000; padding: 1rem; background: #000; color: #fff; }
</style>
</head>
<body>
  <div class="cookie-consent">Cookie banner</div>
  <div class="athlete-report-backdrop" id="backdrop">
    <div class="athlete-report-print-root athlete-report-sheet" id="sheet" role="dialog">
      <header class="athlete-report-sheet__header">
        <button type="button" class="btn btn--ghost btn--small">Close</button>
        <div class="athlete-report-sheet__heading">
          <p class="athlete-report-sheet__eyebrow">PDF report</p>
          <h2>Athlete Name</h2>
        </div>
      </header>
      <div class="athlete-report-sheet__body" id="body">
        <p class="athlete-report-sheet__preview-label">Preview</p>
        <article class="athlete-report" id="preview">
          <p id="plain">Plain lead-in for wheel target</p>
          ${Array.from({ length: 6 }, (_, i) => `<p>Spacer ${i}</p>`).join('')}
          <figure class="athlete-report__chart" id="chart">
            <figcaption class="athlete-report__chart-title">Chart</figcaption>
            <svg viewBox="0 0 400 160" width="400" height="160"><rect width="400" height="160" fill="#e2e8f0"/></svg>
          </figure>
          <div class="table-wrap athlete-report__table-wrap" id="wrap">
            <table class="data-table athlete-report__table">
              <thead><tr><th>Date</th><th>Mode</th><th>Spot</th><th>Summary</th></tr></thead>
              <tbody>
                ${Array.from({ length: 30 }, (_, i) => `<tr id="row-${i}"><td>2026-01-${String((i % 28) + 1).padStart(2, '0')}</td><td>Technical</td><td>Supertubos</td><td>Long summary ${i} XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
          ${Array.from({ length: 12 }, (_, i) => `<p>After ${i}</p>`).join('')}
        </article>
      </div>
      <footer class="athlete-report-sheet__footer" id="footer">
        <button type="button" class="btn btn--gold btn--block">Download PDF</button>
      </footer>
    </div>
  </div>
  <script>
    const root = document.getElementById('body');
    root.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      const target = event.target;
      if (!(target instanceof Element) || !root.contains(target) || target === root) return;
      let node = target;
      while (node && node !== root) {
        const style = getComputedStyle(node);
        const oy = style.overflowY;
        if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1) return;
        node = node.parentElement;
      }
      root.scrollTop += event.deltaY;
      event.preventDefault();
    }, { passive: false, capture: true });
  </script>
</body>
</html>`

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(html)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const { port } = server.address()

const executablePath = fs.existsSync('/usr/local/bin/google-chrome')
  ? '/usr/local/bin/google-chrome'
  : '/usr/bin/google-chrome'

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

async function wheelDelta(page, selector, dy = 300) {
  await page.evaluate((sel) => {
    const body = document.getElementById('body')
    const el = document.querySelector(sel)
    el.scrollIntoView({ block: 'center' })
    // leave headroom so wheel can move
    body.scrollTop = Math.max(0, body.scrollTop - 120)
  }, selector)
  const before = await page.evaluate(() => document.getElementById('body').scrollTop)
  const handle = await page.$(selector)
  const box = await handle.boundingBox()
  if (!box || box.y < 0 || box.y > 900) {
    return { before, after: before, delta: 0, skipped: true }
  }
  await page.mouse.move(box.x + Math.min(24, box.width / 2), box.y + Math.min(12, box.height / 2))
  await page.mouse.wheel({ deltaY: dy })
  await new Promise((r) => setTimeout(r, 60))
  const after = await page.evaluate(() => document.getElementById('body').scrollTop)
  return { before, after, delta: after - before, skipped: false }
}

async function probe(label, viewport) {
  const page = await browser.newPage()
  await page.setViewport(viewport)
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0' })

  const metrics = await page.evaluate(() => {
    const body = document.getElementById('body')
    const wrap = document.getElementById('wrap')
    const footer = document.getElementById('footer')
    const cookie = document.querySelector('.cookie-consent')
    const backdrop = document.getElementById('backdrop')
    const fb = footer.getBoundingClientRect()
    const cb = cookie.getBoundingClientRect()
    const overlap = !(fb.bottom <= cb.top || fb.top >= cb.bottom || fb.right <= cb.left || fb.left >= cb.right)
    const wrapCs = getComputedStyle(wrap)
    return {
      canScroll: body.scrollHeight > body.clientHeight + 2,
      wrapOverflowX: wrapCs.overflowX,
      wrapOverflowY: wrapCs.overflowY,
      zSheet: getComputedStyle(backdrop).zIndex,
      zCookie: getComputedStyle(cookie).zIndex,
      footerCoveredByCookie:
        overlap && Number(getComputedStyle(cookie).zIndex) > Number(getComputedStyle(backdrop).zIndex),
      footerVisible: fb.bottom <= window.innerHeight + 1,
    }
  })

  const overPlain = await wheelDelta(page, '#plain')
  const overRow = await wheelDelta(page, '#row-2')
  const overChart = await wheelDelta(page, '#chart')

  console.log(`\n=== ${label} (${viewport.width}x${viewport.height}) ===`)
  console.log(JSON.stringify({ metrics, overPlain, overRow, overChart }, null, 2))
  await page.close()
  return { metrics, overPlain, overRow, overChart }
}

const desktop = await probe('desktop', { width: 1280, height: 800 })
const mobile = await probe('mobile', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})

await browser.close()
server.close()

const problems = []
for (const [name, r] of [
  ['desktop', desktop],
  ['mobile', mobile],
]) {
  if (!r.metrics.canScroll) problems.push(`${name}: body cannot scroll`)
  if (r.metrics.wrapOverflowX !== 'visible' || r.metrics.wrapOverflowY !== 'visible') {
    problems.push(`${name}: table wrap overflow is ${r.metrics.wrapOverflowX}/${r.metrics.wrapOverflowY}`)
  }
  if (r.metrics.footerCoveredByCookie) problems.push(`${name}: cookie covers footer`)
  if (Number(r.metrics.zSheet) <= Number(r.metrics.zCookie)) {
    problems.push(`${name}: sheet z-index not above cookie`)
  }
  for (const [label, hit] of [
    ['plain', r.overPlain],
    ['row', r.overRow],
    ['chart', r.overChart],
  ]) {
    if (!hit.skipped && hit.delta < 50) problems.push(`${name}: wheel over ${label} trapped (delta=${hit.delta})`)
  }
}

if (problems.length) {
  console.log('\nPROBLEMS:')
  for (const p of problems) console.log(' -', p)
  process.exitCode = 1
} else {
  console.log('\nOK: scroll probes passed')
}
