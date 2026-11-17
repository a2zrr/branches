import { defineConfig, devices } from '@playwright/test';

const PORT_PROD = 4173;
const PORT_DEV = 5173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    trace: 'retain-on-failure',
    // Chrome système (Chromium) : le téléchargement du navigateur groupé est bloqué ici. Surcharge : PW_CHANNEL.
    channel: process.env.PW_CHANNEL ?? 'chrome',
  },
  projects: [
    // Build de production : les routes /dev/* n'existent pas.
    {
      name: 'prod',
      testIgnore: '**/dev/**',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${PORT_PROD}`,
        viewport: { width: 1440, height: 900 },
      },
    },
    // Serveur de développement : routes /dev/* disponibles.
    {
      name: 'dev',
      testMatch: '**/dev/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${PORT_DEV}`,
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      command: `npm run build && npx vite preview --port ${PORT_PROD} --strictPort`,
      url: `http://127.0.0.1:${PORT_PROD}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${PORT_DEV} --strictPort`,
      url: `http://127.0.0.1:${PORT_DEV}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
