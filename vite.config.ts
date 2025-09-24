import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimization for production builds
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          react: ['react', 'react-dom'],
          // Separate service chunks for code splitting
          services: [
            './src/services/DataService.ts',
            './src/services/StateService.ts',
            './src/services/LoggingService.ts'
          ],
          utils: [
            './src/utils/PerformanceMonitor.ts',
            './src/utils/FormatUtils.ts',
            './src/utils/NotificationUtils.ts'
          ]
        }
      }
    },
    // Optimize for performance
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for performance monitoring
        drop_debugger: true,
        pure_funcs: ['console.debug']
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    // Force optimization of large dependencies
    force: true
  }
});