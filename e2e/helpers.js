// ESM-compatible JavaScript version of helpers.ts
// This file exists so that `import from './helpers'` resolves in Node.js ESM mode.
// Playwright's TypeScript transform will prefer helpers.ts when running tests.
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const screenshotDir = join(__dirname, 'screenshots')

export async function captureScreenshot(page, name) {
  await page.screenshot({ path: join(screenshotDir, `${name}.png`), fullPage: true })
}

export async function assertNoConsoleErrors(page) {
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await page.waitForTimeout(500)
  return errors
}

export function monitorPage(page) {
  const errors = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({ type: 'console', message: msg.text() })
    }
  })

  page.on('pageerror', (err) => {
    errors.push({ type: 'uncaught', message: err.message || String(err) })
  })

  page.on('response', (response) => {
    const status = response.status()
    if (status >= 400) {
      errors.push({
        type: 'network',
        message: `HTTP ${status} on ${response.url()}`,
        url: response.url(),
        statusCode: status,
      })
    }
  })

  return {
    errors,
    assertClean(message) {
      if (errors.length > 0) {
        const summary = errors.map(e => `  [${e.type}] ${e.message}`).join('\n')
        throw new Error(`${message || 'Page health check failed'} — ${errors.length} error(s):\n${summary}`)
      }
    },
    clear() {
      errors.length = 0
    },
  }
}
