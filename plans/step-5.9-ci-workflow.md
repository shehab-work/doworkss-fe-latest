# Step 5.9: CI/CD Workflow

## Todos

- [ ] Create `.github/workflows/ci.yml`
- [ ] Configure lint, type-check, test, and build steps
- [ ] Add environment variables for CI
- [ ] Verify workflow runs on push/PR

## .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, feat/nuxt4]
  pull_request:
    branches: [main, feat/nuxt4]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm nuxt prepare
      - run: pnpm eslint .
      - run: pnpm nuxi typecheck

  test:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm nuxt prepare
      - run: pnpm test:run
      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          NUXT_PUBLIC_APP_ENV: production
          NUXT_PUBLIC_API_BASE: ${{ secrets.API_BASE }}
          NUXT_PUBLIC_HOST_NAME: ${{ secrets.HOST_NAME }}
          NUXT_PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
          NUXT_SESSION_PASSWORD: ${{ secrets.SESSION_PASSWORD }}

  e2e:
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install --with-deps chromium
      - run: pnpm test:e2e
        env:
          NUXT_PUBLIC_APP_ENV: test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## Notes

- E2E tests only run on push to main (not on PRs) to save CI time
- Build step uses secrets for env vars — set these in GitHub repo settings
- Node 22 is used (LTS) — matches the i18n v10 requirement of Node >= 20.11.1
- `pnpm nuxt prepare` generates `.nuxt/` types needed for typecheck
