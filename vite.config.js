import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_URL = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        },
        '/socket.io': {
          target: API_URL,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000, // Increase size limit to 1000kb
      rollupOptions: {
        output: {
          manualChunks: {
            // Group React dependencies together
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Group Ant Design dependencies
            'antd-vendor': ['antd'],
            // Group other UI dependencies
            'ui-vendor': ['bootstrap', 'react-bootstrap'],
            // Socket.io chunk
            'socket-vendor': ['socket.io-client'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['socket.io-client'],
    },
  }
})




