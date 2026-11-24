import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, extname, join, normalize, resolve, sep } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const here = dirname(fileURLToPath(import.meta.url))
const APP_DIR = join(here, 'app')
const HOST = '127.0.0.1'
const PORT = 17866
const APP_ID = 'travel-quote-se'
const VERSION = '0.1.0'
const STATE_FILE = join(process.env.DSH_PROFILE_DIR || join(homedir(), '.dsh'), 'travel-quote-se-state.json')
let serverPromise = null
let server = null

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
}

function fileFor(pathname) {
  let path = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1))
  path = normalize(path).replace(/^(\.\.(\/|\\|$))+/, '')
  const file = resolve(APP_DIR, path)
  if (file !== APP_DIR && !file.startsWith(APP_DIR + sep)) return null
  return file
}

function startServer() {
  if (serverPromise) return serverPromise
  serverPromise = new Promise((resolvePromise, reject) => {
    const instance = createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '/', `http://${HOST}:${PORT}`)
        if (url.pathname === '/__health') {
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
          res.end(JSON.stringify({ app: APP_ID, version: VERSION }))
          return
        }
        if (url.pathname === '/api/state') {
          if (req.method === 'GET') {
            try {
              const raw = await readFile(STATE_FILE, 'utf8')
              const body = Buffer.from(raw)
              res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-length': body.length, 'cache-control': 'no-store' })
              res.end(body)
            } catch {
              res.writeHead(204, { 'cache-control': 'no-store' })
              res.end()
            }
            return
          }
          if (req.method !== 'PUT' && req.method !== 'POST') {
            res.writeHead(405); res.end('method not allowed'); return
          }
          if (req.headers.origin && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.origin)) {
            res.writeHead(403); res.end('origin not allowed'); return
          }
          let size = 0
          const chunks = []
          for await (const chunk of req) {
            size += chunk.length
            if (size > 5 * 1024 * 1024) { res.writeHead(413); res.end('state too large'); return }
            chunks.push(chunk)
          }
          let value
          try {
            value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            if (!value || !Array.isArray(value.quotes) || !Array.isArray(value.folders)) throw new Error('invalid state')
          } catch {
            res.writeHead(400); res.end('invalid state'); return
          }
          try {
            await mkdir(dirname(STATE_FILE), { recursive: true })
            const tmp = STATE_FILE + '.tmp'
            await writeFile(tmp, JSON.stringify(value), 'utf8')
            await rename(tmp, STATE_FILE)
            res.writeHead(204, { 'cache-control': 'no-store' }); res.end()
          } catch (error) {
            res.writeHead(500); res.end(String(error?.message || error))
          }
          return
        }
        if (url.pathname === '/__theme') {
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
          res.end(JSON.stringify({ primary: '#B76E79' }))
          return
        }
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.writeHead(405); res.end('method not allowed'); return
        }
        const file = fileFor(url.pathname)
        if (!file) { res.writeHead(403); res.end('forbidden'); return }
        let body
        try { body = await readFile(file) } catch {
          if (url.pathname === '/' || url.pathname === '/index.html') {
            res.writeHead(404); res.end('app not built'); return
          }
          res.writeHead(404); res.end('not found'); return
        }
        res.writeHead(200, {
          'content-type': types[extname(file)] || 'application/octet-stream',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        })
        if (req.method === 'HEAD') res.end(); else res.end(body)
      } catch (error) {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
        res.end(`游乐读取失败：${error?.message || error}`)
      }
    })
    instance.once('error', async (error) => {
      if (error?.code === 'EADDRINUSE') {
        try {
          const response = await fetch(`http://${HOST}:${PORT}/__health`)
          const body = await response.json()
          if (body?.app === APP_ID) { server = null; resolvePromise(null); return }
        } catch {}
      }
      serverPromise = null
      reject(error)
    })
    instance.listen(PORT, HOST, () => { server = instance; resolvePromise(instance) })
  })
  return serverPromise
}

async function openApp() {
  await access(APP_DIR)
  await startServer()
  const url = `http://${HOST}:${PORT}/`
  if (process.platform === 'darwin') await run('open', [url])
  else if (process.platform === 'win32') await run('cmd', ['/d', '/s', '/c', 'start', '', url])
  else await run('xdg-open', [url])
}

export const inject = ['commands']

export function apply(ctx) {
  ctx.effect(() => {
    startServer().catch((error) => console.warn('Travel Quote SE server failed', error))
    return () => {
      if (server) { server.close(); server = null; serverPromise = null }
    }
  })
  ctx.effect(() => ctx.commands.register({
    name: 'tqse',
    description: '打开游乐 Svelte 本地报价应用',
    handler: async () => {
      try {
        await openApp()
        return { kind: 'success', text: `已打开游乐 Svelte：http://${HOST}:${PORT}/` }
      } catch (error) {
        return { kind: 'error', text: `无法打开游乐 Svelte：${error?.message || error}` }
      }
    },
  }))
}
