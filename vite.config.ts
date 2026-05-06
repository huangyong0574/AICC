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
    proxy: {
      // 代理通义万相 API 请求，解决 CORS 跨域问题
      '/api/v1': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
