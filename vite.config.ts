import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5180,
    strictPort: true,
    // 开发期把 /api 代理到本地 Gateway（node server/gateway.mjs，默认 8787），
    // 使前端调 /api/llm 与 dist 模式一致；key 始终只在 Gateway 端。
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
})
