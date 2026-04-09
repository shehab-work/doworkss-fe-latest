# Sprint 5: Foundation Setup — Overview

> All versions verified against npm registry on 2026-04-09.
> All APIs verified against official documentation via Context7.

## Decision: Vuetify 4

**Decided 2026-04-09:** Use **Vuetify 4 (4.0.5)** with `vuetify-nuxt-module@0.19.5`.

| Fact | Detail |
|------|--------|
| Version | 4.0.5 (`latest` on npm) |
| GA since | 2026-02-23 (5 patch releases in 6 weeks) |
| vuetify-nuxt-module | 0.19.5 — supports `^3.7.0 \|\| ^4.0.0-0` |
| Install | `pnpm add vuetify@latest vuetify-nuxt-module@0.19.5 @mdi/font` |

**Why v4 over v3:** We're rewriting every component from scratch (Vue 2 Options API → Vue 3 Composition API). The v3→v4 breaking changes (CSS layers, MD3 typography, grid overhaul) don't add migration cost since nothing is being migrated FROM v3. Picking v3 would require a v3→v4 migration later on code we just wrote.

**Key v4 differences to be aware of:**
- Default theme is `system` (not `light`) — we set `defaultTheme: 'light'` explicitly
- CSS uses `@layer` instead of `!important` — cleaner overrides
- Typography and elevation aligned to Material Design 3
- CSS reset reduced (no forced `overflow-y`)

---

## Sprint 5 Steps

| Step | File | What |
|---|---|---|
| 5.1 | `step-5.1-dependencies.md` | Install all dependencies with exact verified versions |
| 5.2 | `step-5.2-directory-structure.md` | Create full directory tree |
| 5.3 | `step-5.3-nuxt-config.md` | Full nuxt.config.ts (corrected for all findings) |
| 5.4 | `step-5.4-vuetify-config.md` | vuetify.config.ts with theme, RTL, SSR, defaults |
| 5.5 | `step-5.5-assets-locales.md` | Copy assets, locales, static files |
| 5.6 | `step-5.6-typescript-types.md` | shared/types/ definitions + auth type augmentation |
| 5.7 | `step-5.7-env-config.md` | .env.example with all variables |
| 5.8 | `step-5.8-testing-setup.md` | vitest.config.ts + playwright.config.ts |
| 5.9 | `step-5.9-ci-workflow.md` | GitHub Actions CI workflow |
| 5.10 | `step-5.10-verification.md` | Verification checklist |

## Key Corrections from Research

| # | Finding | Impact |
|---|---|---|
| 1 | i18n v10: locale files must be in `i18n/locales/` (not `locales/` at root) | Directory structure change |
| 2 | i18n v10: `lazy` option removed (always lazy) | Remove from config |
| 3 | i18n v10: `onBeforeLanguageSwitch` removed — use `i18n:beforeLocaleSwitch` hook | Plugin rewrite |
| 4 | Vuetify 4.0.5 is GA — decided to use v4 | Resolved |
| 5 | `pinia-plugin-persistedstate` registers as `'pinia-plugin-persistedstate/nuxt'` module | Config change |
| 6 | `@sentry/nuxt` registers as `'@sentry/nuxt/module'` + needs root config files | Config change |
| 7 | `ssrClientHints` goes in `moduleOptions` (not vuetify.config.ts) | Config location |
| 8 | `vue-toastification` needs `@2.0.0-rc.5` tag for Vue 3 | Install command |
| 9 | `nuxt-auth-utils` has `secure` session field (server-only data) | Auth architecture |
| 10 | vitest uses `defineVitestConfig` from `@nuxt/test-utils/config` | Config change |
