import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 550,
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 0,
          groups: [
            {
              name: 'three-vendor',
              test: /node_modules\/three/,
            },
          ],
        },
      },
    },
  },
});
