import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        content: 'src/content/main.jsx',
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
      },
    },
  },
});
