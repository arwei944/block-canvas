import { defineConfig } from 'vitest/config';
import path from 'path';

const reactMockPath = path.resolve(__dirname, 'src/__tests__/__mocks__/react.js');
const reactDomMockPath = path.resolve(__dirname, 'src/__tests__/__mocks__/react-dom.js');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@block-canvas/core': path.resolve(__dirname, 'src'),
      'react': reactMockPath,
      'react-dom': reactDomMockPath,
      'react-dom/client': reactDomMockPath,
    },
  },
  optimizeDeps: {
    include: ['zustand'],
    esbuildOptions: {
      plugins: [
        {
          name: 'replace-react',
          setup(build) {
            build.onResolve({ filter: /^react$/ }, () => ({
              path: reactMockPath,
            }));
            build.onResolve({ filter: /^react-dom$/ }, () => ({
              path: reactDomMockPath,
            }));
          },
        },
      ],
    },
  },
});
