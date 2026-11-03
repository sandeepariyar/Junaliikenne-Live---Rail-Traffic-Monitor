import { defineConfig } from '@playwright/test';

const BASE = '/Junaliikenne-Live---Rail-Traffic-Monitor/';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:4173${BASE}`,
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort --host 127.0.0.1',
    url: `http://127.0.0.1:4173${BASE}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
