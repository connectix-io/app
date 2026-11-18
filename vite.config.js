import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// Dev HTTPS: WebRTC getUserMedia (the softphone mic) only works in a SECURE
// context — HTTPS or localhost. Accessed via a LAN/public IP over plain http the
// browser blocks the mic and calls fail ("Media devices not available in insecure
// contexts"). If a self-signed dev cert exists (certs/, openssl-generated), serve
// over HTTPS so the phone can dial from any host.
const DEV_KEY = resolve(__dirname, 'certs/dev-key.pem')
const DEV_CRT = resolve(__dirname, 'certs/dev-cert.pem')
const devHttps = fs.existsSync(DEV_KEY) && fs.existsSync(DEV_CRT)
  ? { key: fs.readFileSync(DEV_KEY), cert: fs.readFileSync(DEV_CRT) }
  : undefined

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    // When this build was made, shown small at the bottom of the inbox sidebar.
    define: { 'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()) },
    // In development Vite passes /api and /auth to the Hono server (npm run server,
    // :3000), which passes them to voipappz-api: the same path as production.
    server: {
      host: '0.0.0.0',
      port: 4200,
      https: devHttps,
    proxy: {
      '/api':  { target: process.env.SERVER_URL || 'http://localhost:3000', changeOrigin: true },
      '/auth': { target: process.env.SERVER_URL || 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: {
    sourcemap: false, // Disable sourcemap in production to reduce size
    rollupOptions: {
      output: {
        // Simpler chunking strategy to avoid React compatibility issues
        manualChunks: {
          // Keep React and related libraries in one chunk to prevent compatibility issues
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            'scheduler'
          ],
          // UI components - all MUI together
          'mui': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled'
          ]
        }
      }
    },
    // Increase the warning limit to avoid warning for moderately sized chunks
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
  }
})
