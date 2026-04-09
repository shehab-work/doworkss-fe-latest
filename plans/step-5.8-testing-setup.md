# Step 5.8: Testing Setup

## Todos

- [ ] Create `vitest.config.ts` using `@nuxt/test-utils/config`
- [ ] Create `playwright.config.ts`
- [ ] Create `tests/setup.ts`
- [ ] Create example unit test to verify setup
- [ ] Create example e2e test to verify setup
- [ ] Add test scripts to `package.json`
- [ ] Run `pnpm test` to verify vitest works
- [ ] Run `npx playwright install` to install browsers

## vitest.config.ts

```typescript
// vitest.config.ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
    globals: true,
    include: [
      'tests/**/*.{test,spec}.ts',
      'app/**/*.{test,spec}.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'app/composables/**/*.ts',
        'app/stores/**/*.ts',
        'shared/utils/**/*.ts',
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
      },
    },
  },
})
```

## playwright.config.ts

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

## tests/setup.ts

```typescript
// tests/setup.ts
// Global test setup — runs before all tests
```

## Example Unit Test

```typescript
// tests/unit/utils/string.spec.ts
import { describe, it, expect } from 'vitest'

describe('shared/utils sanity check', () => {
  it('vitest is working', () => {
    expect(1 + 1).toBe(2)
  })
})
```

## Example E2E Test

```typescript
// e2e/home.spec.ts
import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/doworkss/i)
})
```

## package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed"
  }
}
```
