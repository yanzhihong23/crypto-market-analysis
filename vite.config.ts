import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    // The dev-side half of the `/okx` rewrite that `vercel.json` sets up for
    // production. Only rubik/ needs it; the rest of the API is fetched direct.
    proxy: {
      '/okx': {
        target: 'https://www.okx.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/okx/, '/api/v5'),
      },
    },
  },
})
