# Step 5.8: Testing Setup (Simplified for Sprint 5)

Keep it minimal — just verify vitest runs. Playwright and coverage thresholds deferred to Sprint 13.

## Todos

- [ ] Create `vitest.config.ts` using `@nuxt/test-utils/config`
- [ ] Create example unit test to verify setup
- [ ] Add `test` and `test:run` scripts to `package.json`
- [ ] Run `pnpm test:run` to verify vitest works

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
  },
})
```

## Example Unit Test

```typescript
// tests/unit/smoke.spec.ts
import { describe, it, expect } from 'vitest'

describe('smoke test', () => {
  it('vitest is working', () => {
    expect(1 + 1).toBe(2)
  })
})
```

## package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

## Deferred to Sprint 13

- Playwright E2E setup + browser install
- Coverage thresholds (v8 provider)
- Multi-browser/device projects
- CI-specific reporter config
