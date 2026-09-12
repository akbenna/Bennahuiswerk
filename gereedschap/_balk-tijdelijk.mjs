import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
const server = http.createServer((req, res) => {
  let p = 'dist' + req.url.split('?')[0]
  if (p.endsWith('/')) p += 'index.html'
  if (!existsSync(p)) { res.writeHead(404); res.end(); return }
  const t = p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css'
    : p.endsWith('.svg') ? 'image/svg+xml' : p.endsWith('.png') ? 'image/png' : 'text/html'
  res.writeHead(200, { 'content-type': t }); res.end(readFileSync(p))
}).listen(0)
const poort = server.address().port
const b = await chromium.launch({ executablePath: process.env.CHROOM })
for (const [naam, schema] of [['licht','light'],['donker','dark']]) {
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 4, colorScheme: schema })
  await ctx.addInitScript(`localStorage.setItem('kalibratie.sessie', JSON.stringify({token:'proef',account:'abdelkader'}))`)
  const p = await ctx.newPage()
  await p.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await p.goto(`http://localhost:${poort}/health/`)
  await p.waitForSelector('nav.tabs', { timeout: 8000 })
  await p.waitForTimeout(600)
  await p.locator('nav.tabs').screenshot({ path: `/tmp/claude-0/balk-${naam}.png` })
  await ctx.close()
}
await b.close(); server.close()
