import { defineConfig } from 'vite' // <--- Asta lipsea probabil
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Aici este setarea importantă pentru calea relativă
})