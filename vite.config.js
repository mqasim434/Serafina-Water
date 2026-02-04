import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import crypto from 'crypto'

function uuidV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Vite plugin: in dev, handle GET /api/imagekit-auth so JSON is returned instead of serving the .js file. */
function imageKitAuthPlugin() {
  return {
    name: 'imagekit-auth',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      const raw = (env.IMAGEKIT_PRIVATE_KEY || process.env.IMAGEKIT_PRIVATE_KEY || '').trim()
      const privateKey = raw ? (() => { try { return decodeURIComponent(raw) } catch { return raw } })() : ''
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' || req.url?.split('?')[0] !== '/api/imagekit-auth') return next()
        if (!privateKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'ImageKit not configured' }))
          return
        }
        const url = new URL(req.url || '', 'http://localhost')
        const token = url.searchParams.get('token') || uuidV4()
        const expire = Number(url.searchParams.get('expire')) || Math.floor(Date.now() / 1000) + 3600
        const signature = crypto.createHmac('sha1', privateKey).update(String(token) + expire).digest('hex')
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify({ token, signature, expire }))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), imageKitAuthPlugin()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    commonjsOptions: {
      include: [/firebase/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
        },
      },
    },
    target: 'esnext',
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
  define: {
    'process.env': {},
  },
})
