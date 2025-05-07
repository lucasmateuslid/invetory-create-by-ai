import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // opcional, mas útil
    },
  },
  build: {
    outDir: 'dist',
  },
  // ESSENCIAL para preview funcionar corretamente com rotas SPA
  preview: {
    // isso garante que todas as rotas usem index.html
    fallback: true,
  },
});
