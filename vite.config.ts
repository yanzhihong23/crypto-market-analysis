import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteEslint from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/crypto-market-analysis/',
  plugins: [
    react(),
    viteEslint({
      failOnError: false,
    }),
  ],
})
