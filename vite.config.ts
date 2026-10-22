import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` matches the GitHub Pages path: https://<user>.github.io/JIzoshRequest/
export default defineConfig({
  base: '/JIzoshRequest/',
  plugins: [react()],
  build: {
    // The unit database is ~1.8 MB of JSON (≈200 kB gzipped); keep it in its own
    // long-cacheable chunk so app updates don't re-download it.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('/src/data/units.json') ? 'units' : undefined),
      },
    },
  },
});
