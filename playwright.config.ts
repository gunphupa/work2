import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    launchOptions: { executablePath },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run start -- --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      FIXFLOW_DATA_DIR: '/tmp/fixflow-e2e-feedback',
      FIXFLOW_AI_KEY: '',
      OPENAI_API_KEY: '',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
