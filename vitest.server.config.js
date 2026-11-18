// The Hono server's tests: plain Node, no DOM and no React setup.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.js'],
  },
});
