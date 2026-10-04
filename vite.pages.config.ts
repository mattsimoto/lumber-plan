import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A separate client-only entry lets the existing app run on GitHub Pages.
export default defineConfig({
  root: 'pages-client',
  base: '/lumber-plan/',
  publicDir: '../public',
  plugins: [react()],
  build: {
    outDir: '../dist-pages',
    emptyOutDir: true,
  },
});
