import { defineConfig, devices } from '@playwright/test'

/**
 * Pruebas E2E de la UI con Playwright.
 * Levanta su propio Vite en el puerto 5174 y fuerza localStorage (VITE_DATA_SOURCE=local),
 * así no dependen de la API ni de tu .env.local, y no chocan con `npm run dev` (5173).
 * Para la demo: `$env:SLOWMO=500; npm run test:e2e:headed` corre más lento y con el navegador visible.
 */
const PORT = 5174

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: { slowMo: Number(process.env.SLOWMO ?? 0) },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    env: { VITE_DATA_SOURCE: 'local' },
  },
})
