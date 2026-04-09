# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## What Is Doworkss

Doworkss is a **freelance services marketplace** — a platform where service providers list their skills and clients browse, order, and manage deals (contracts). The platform supports service discovery, real-time chat, deals with deliverables, wallets/payments (Tap gateway), subscription plans, blogs, provider profiles, and push notifications.

**This repository (`doworkss-FE-latest`) is the Nuxt 4 rewrite** of the production Nuxt 2 app at `../doworkss_frontend/`. It is NOT a greenfield project — every feature, page, and API endpoint already exists in the old codebase and must be faithfully migrated.

## Migration Context

| | Old | New |
|---|---|---|
| **Repo** | `../doworkss_frontend/` | this repo |
| **Framework** | Nuxt 2.15.8 | Nuxt 4.4+ |
| **Vue** | Vue 2 (Options API) | Vue 3 (Composition API, `<script setup>`) |
| **UI** | Vuetify 2 | Vuetify 4 (`vuetify-nuxt-module`) |
| **State** | Vuex (22 modules) | Pinia (8 setup stores) |
| **HTTP** | `@nuxtjs/axios` + `$request()` wrapper | `$fetch` + `useApi()` composable |
| **Auth** | `@nuxtjs/auth-next` + custom refresh scheme | `nuxt-auth-utils` sealed sessions + Nitro API routes + `useAuth()` composable |
| **i18n** | `@nuxtjs/i18n` v7 | `@nuxtjs/i18n` v10 |
| **TypeScript** | None (all `.js`) | Full TypeScript (`.ts` only, `<script setup lang="ts">`) |
| **Package manager** | npm | pnpm |
| **Mixins** | 26 global/feature mixins | Composables |

### Sprint Plan (14 Sprints)

- **Sprints 1-4 (Phase A):** Pre-migration cleanup in the old Nuxt 2 repo
- **Sprint 5 (Phase B):** Foundation — install deps, directory structure, nuxt.config, Vuetify theme, assets, types, env, testing, CI
- **Sprint 6:** Auth + API layer + i18n-RTL sync + toast (highest risk — 405 `$auth` refs across 94 files)
- **Sprint 7:** Pinia stores + plugins + composables (from mixins) + middleware
- **Sprints 8-12 (Phase D):** Page migration (layouts → home → auth → services → chat → deals → wallet → profile)
- **Sprint 13:** Testing, performance (Lighthouse), security (`nuxt-security`)
- **Sprint 14:** Staging QA, production cutover, 1-week rollback window

Detailed plans: `docs/MIGRATION_PLAN.md`, `docs/AUTH_ARCHITECTURE.md`, `docs/PLAN_VALIDATION_REPORT.md`, `plans/` directory.

## Commands

```bash
# Install dependencies
pnpm install

# Start dev server at http://localhost:3000
pnpm dev

# Type-check
pnpm nuxt typecheck

# Preview production build locally
pnpm preview

# Static generation
pnpm generate

# Prepare Nuxt types (runs automatically on postinstall)
pnpm nuxt prepare
```

**Do NOT run `pnpm build` unless explicitly asked.**

No test runner is configured yet. When added (Sprint 5.8):
```bash
# Unit tests (vitest)
pnpm test

# E2E tests (Playwright)
pnpm test:e2e
```

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Nuxt 4.4+ | SSR, `app/` source dir, `shared/` for cross-app/server code |
| UI | Vuetify 4 + `vuetify-nuxt-module` | MD3, CSS layers, tree-shaken, RTL via locale |
| State | Pinia 3 + `@pinia/nuxt` + `pinia-plugin-persistedstate` | Setup stores in `app/stores/`, cookie persistence for SSR |
| Auth | `nuxt-auth-utils` | Sealed httpOnly cookies, `useUserSession()` client, `getUserSession()`/`setUserSession()` server |
| HTTP | `$fetch` (Nitro built-in) | No axios. `useApi()` composable wraps `$fetch` with headers + error routing |
| i18n | `@nuxtjs/i18n` v10 | 6 locales (ar, en, tr, fr, es, ur), prefix strategy, RTL for ar/ur |
| Validation | `vee-validate` v4 + `@vee-validate/rules` + `@vee-validate/i18n` | Composition API form validation |
| Icons | `@mdi/font` + `@nuxt/icon` | Material Design Icons |
| Images | `@nuxt/image` | WebP/AVIF, responsive sizes |
| Fonts | `@nuxt/fonts` | Self-hosted, no external requests |
| Scripts | `@nuxt/scripts` | Third-party script management (Tap SDK, Google GSI, Apple Sign-In) |
| Testing | Vitest + `@nuxt/test-utils` + Playwright | Unit + integration + E2E |
| Error tracking | `@sentry/nuxt` (Sprint 7+) | 20% sample prod, 100% dev |
| Real-time | `pusher-js` (Sprint 10+) | Chat presence, deal updates |
| Push | Firebase Cloud Messaging (Sprint 7+) | Web push notifications |
| Payments | Tap payment gateway (Sprint 11+) | Card payments, saved cards |
| Security | `nuxt-security` (Sprint 13+) | CSP, nonce, rate limiting |

## Architecture

### Nuxt 4 Directory Structure

```
doworkss-FE-latest/
├── app/                          # Source directory (Nuxt 4 default)
│   ├── app.vue                   # Root component
│   ├── error.vue                 # Global error page
│   ├── assets/
│   │   ├── scss/                 # Global SCSS (Vuetify 4 variables, overrides)
│   │   └── images/               # App images (consolidated from old repo)
│   ├── components/               # Auto-imported Vue components
│   │   ├── base/                 # Generic reusable (BaseCard, BaseModal, etc.)
│   │   ├── layout/               # Shell components (AppNav, DashboardSidebar, Footer)
│   │   └── feature/              # Feature-grouped (auth/, chat/, deals/, services/, etc.)
│   ├── composables/              # Auto-imported composables (replaces mixins + plugins)
│   ├── layouts/                  # Page layouts (default, auth, dashboard, chat)
│   ├── middleware/               # Route middleware (auth, guest, phone-verified)
│   ├── pages/                    # File-based routing
│   ├── plugins/                  # Nuxt plugins (client/server/universal)
│   ├── stores/                   # Pinia setup stores (MUST be in app/stores/ for auto-import)
│   └── utils/                    # Auto-imported utility functions
├── server/                       # Nitro server (API routes, middleware, utils)
│   ├── api/
│   │   ├── auth/                 # Auth endpoints (login, logout, refresh, register, etc.)
│   │   └── [...].ts              # Catch-all proxy to backend API
│   ├── middleware/               # Server middleware (auth token injection)
│   └── utils/                    # Server utilities (session helpers, JWT decode)
├── shared/                       # Auto-imported in BOTH app/ and server/
│   ├── types/                    # TypeScript interfaces (User, Service, Deal, Chat, etc.)
│   ├── constants/                # App constants (platforms, OTP types, report reasons)
│   └── utils/                    # Pure utility functions (currency, string, phone, date)
├── i18n/
│   └── locales/                  # Translation JSON files (ar, en, tr, fr, es, ur)
├── public/                       # Static assets served as-is
├── docs/                         # Migration plans and architecture docs
├── plans/                        # Sprint step-by-step implementation guides
├── nuxt.config.ts                # Main Nuxt configuration
├── vuetify.config.ts             # Vuetify theme, RTL, defaults (loaded by vuetify-nuxt-module)
└── package.json                  # pnpm, ESM ("type": "module")
```

### Auth Architecture (Sprint 6)

Tokens live ONLY on the server. The client never sees raw JWT tokens.

```
Browser                          Nitro Server                    Backend API
  │                                  │                               │
  │ POST /api/auth/login             │                               │
  │ ─────────────────────────────►   │  POST /login                  │
  │                                  │  ──────────────────────────►   │
  │                                  │  ◄── { token, refresh_token } │
  │                                  │                               │
  │                                  │  setUserSession(event, {      │
  │                                  │    user: { id, name, ... },   │
  │                                  │    secure: { token, refresh } │  ← httpOnly sealed cookie
  │                                  │  })                           │
  │  ◄── Set-Cookie (sealed)         │                               │
  │                                  │                               │
  │ GET /api/services (any request)  │                               │
  │ ─────────────────────────────►   │  getUserSession(event)        │
  │                                  │  inject Authorization header  │
  │                                  │  GET /services ───────────►   │
  │  ◄── { data }                    │  ◄── { data }                 │
```

- **Server routes:** `server/api/auth/login.post.ts`, `logout.post.ts`, `refresh.post.ts`, `register.post.ts`, `user.get.ts`
- **Catch-all proxy:** `server/api/[...].ts` — injects `Authorization`, `private-key`, `content-language`, `currency` headers
- **Client composable:** `useAuth()` wraps `useUserSession()` — exposes `loggedIn`, `user`, `login()`, `logout()`, `refreshToken()`
- **Client composable:** `useApi()` wraps `$fetch` with error routing (403→error, 406→verify-email, 412→verify-phone, 429→toast, etc.)
- **Session type augmentation:** in `shared/types/auth.ts`, extends `nuxt-auth-utils` `UserSession` interface

### State Management

8 Pinia setup stores replace 22 Vuex modules:

| Pinia Store | Replaces (Vuex) | Purpose |
|---|---|---|
| `useGlobalStore` | `global/` | Modals, currencies, timezone, support channels |
| `useAuthStore` | `user/` | Registration flow, social auth, profile updates |
| `useChatStore` | `chat/` | Conversations, messages, unread counts |
| `useDealsStore` | `deals/` | Deal preview, extras, deliveries |
| `useWalletStore` | `wallet/` | Balance, cards, bank accounts |
| `useServiceFormStore` | `update_service/` + `my_services/` | Service create/edit form state |
| `useCategoriesStore` | `all_categories/` | Category tree |
| `useUiStore` | `filter_header/` + `mobile_menu/` + `search_menu/` + `device_width/` | UI state |

Remaining Vuex modules (`ads`, `blog_tags`, `device_id`, `faq`, `login_form`, `registration`, `verify`, `social_media`, `plan`) become local component state or composables.

### API Layer

The old project uses `api/*.js` files that return URL strings, called via `this.$request()`. In the new project:

- **Backend API calls go through Nitro server routes** — the client never calls the backend directly
- `server/api/[...].ts` catch-all proxy handles most requests
- Dedicated server routes for auth (`server/api/auth/`)
- Client uses `useApi()` composable which calls `/api/*` (Nitro routes)
- Domain composables (`useServiceApi()`, `useChatApi()`, etc.) group related endpoints

### i18n & RTL

- 6 locales: `ar` (Arabic, RTL, default), `en`, `tr`, `fr`, `es`, `ur` (Urdu, RTL)
- Strategy: `prefix` — all routes get locale prefix (`/ar/services`, `/en/services`)
- Locale files: `i18n/locales/*.json` (copied from old `locales/` directory)
- RTL sync: Plugin hooks into `i18n:localeSwitched` to toggle Vuetify RTL mode
- Use `useLocalePath()` for locale-aware navigation, never hardcode locale prefixes
- Fallback: `en` for route generation, `ar` for missing translation keys

### Layouts

| Layout | Purpose | Old Equivalent |
|---|---|---|
| `default` | Public pages (home, services, providers, blogs) | `default.vue` |
| `auth` | Login, signup, OTP, password reset | `auth.vue` |
| `dashboard` | Authenticated user pages (my-services, wallet, profile) | `dashboard.vue` |
| `chat` | Real-time chat interface | `chat.vue` |

### Pages (68 routes migrated from old project)

Key route groups:
- **Auth:** login, sign-up, register-otp, verify-email, verify-phone, 2FA, forgot-password, set-new-password
- **Home:** `/` (mapped from `pages/index.vue`)
- **Services:** browse, detail `[slug]`, add, edit, mark, category `[slug]`
- **Providers:** directory, profile `[slug]`
- **Deals:** list, add, detail `[deal_id]`, edit, payment, implementation, deliveries
- **Chat:** conversation list, conversation `[id]`
- **Dashboard:** overview, my-services, my-articles, my-wallet, my-subscription, notifications
- **Profile:** my-profile, account-settings, change-email, change-phone, delete-account
- **Financial:** wallet, top-up, withdraw, payment-methods, payment-by-card
- **Content:** blogs, blog `[slug]`, add-blog, edit-blog
- **Plans:** browse, my-subscription
- **Static:** about-us, faq, privacy-policy, terms-and-conditions

Dynamic route params use `[brackets]` (Nuxt 4), not `_underscore` (Nuxt 2).

## Coding Conventions

### TypeScript

- **All files are TypeScript** — `.ts` for scripts/configs, `<script setup lang="ts">` for Vue SFCs
- **Never create `.js` files** in this repo
- Define interfaces in `shared/types/` for shared data structures
- Use strict typing — avoid `any`, prefer explicit interfaces

### Vue Components

```vue
<script setup lang="ts">
// Composition API only — no Options API, no defineComponent()
// Auto-imports: no need to import ref, computed, watch, composables, stores, or utils
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <!-- Use Vuetify 4 components -->
</template>

<style scoped>
/* Scoped styles, use :deep() instead of ::v-deep */
</style>
```

### Naming

- **Components:** PascalCase (`ServiceCard.vue`), organized by feature in `components/feature/`
- **Pages:** kebab-case directories (`pages/my-services/[type].vue`)
- **Composables:** camelCase with `use` prefix (`useAuth.ts`, `useCurrency.ts`)
- **Stores:** camelCase with `use` prefix + `Store` suffix (`useGlobalStore.ts`)
- **Types:** PascalCase interfaces (`ServiceDetail`, `DealResponse`)
- **Constants:** SCREAMING_SNAKE_CASE for values, camelCase for objects

### Key Nuxt 4 Migration Patterns

| Nuxt 2 (Old) | Nuxt 4 (New) |
|---|---|
| `asyncData()` / `fetch()` | `useAsyncData()` / `useFetch()` |
| `this.$store.dispatch('module/action')` | `const store = useModuleStore(); store.action()` |
| `this.$request({ url, method, data })` | `const api = useApi(); api.request(url, { method, body })` |
| `this.$auth.loggedIn` / `this.$auth.user` | `const { loggedIn, user } = useAuth()` |
| `this.$t('key')` | `const { t } = useI18n(); t('key')` or `$t('key')` in template |
| `this.$router.push(this.localePath('/path'))` | `navigateTo(useLocalePath()('/path'))` |
| `this.$alert({ msg, type })` | `useToast().show(msg, type)` |
| `this.$dir()` | `useDirection()` |
| `process.client` / `process.server` | `import.meta.client` / `import.meta.server` |
| `head()` method | `useHead()` / `useSeoMeta()` |
| `::v-deep .class` | `:deep(.class)` |
| `.native` modifier | Remove (Vue 3 doesn't need it) |
| `_slug` directory | `[slug]` directory |
| Mixins | Composables |
| `nuxtServerInit` | Server middleware or `app:created` hook |

### Error Handling

Backend HTTP error codes and their routing (preserve from old project):

| Status | Action |
|---|---|
| 401 | Auto-handled by auth refresh in catch-all proxy |
| 403 | Redirect to error page |
| 404 | Redirect to 404 error page |
| 406 | Redirect to `/auth/verify-email` |
| 412 | Redirect to `/auth/verify-phone-number` |
| 429 | Toast error (rate limited) |
| 431 | Show upgrade plan modal |
| 302 | Redirect to `/auth/two-factor-authentication` |
| 303 | Show empty wallet modal |
| 500 | Redirect to 500 error page |

### Commits

Follow Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.

## Environment Variables

All env vars use Nuxt's `runtimeConfig` pattern with `NUXT_` prefix:

```env
# App
NUXT_PUBLIC_APP_ENV=development          # production | staging | development
NUXT_PUBLIC_API_BASE=https://api.doworkss.com  # Backend API base URL
NUXT_PUBLIC_HOST_NAME=https://doworkss.com     # Public frontend URL

# Auth (server-only)
NUXT_SESSION_PASSWORD=min-32-char-secret       # Sealed cookie encryption key
NUXT_PRIVATE_KEY=xxx                           # API private key (never exposed to client)

# Payments (Sprint 11+)
NUXT_PUBLIC_TAP_PUBLIC_KEY=pk_test_xxx
NUXT_PUBLIC_TAP_ENVIRONMENT=test               # test | production
NUXT_PUBLIC_TAP_MERCHANT_ID=xxx
NUXT_TAP_SECRET_KEY=sk_test_xxx                # server-only

# Real-time (Sprint 10+)
NUXT_PUBLIC_PUSHER_APP_KEY=xxx
NUXT_PUBLIC_PUSHER_CLUSTER=eu

# Firebase FCM (Sprint 7+)
NUXT_PUBLIC_FIREBASE_API_KEY=xxx
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NUXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NUXT_PUBLIC_FIREBASE_APP_ID=xxx
NUXT_PUBLIC_FIREBASE_FCM_VAPID_KEY=xxx

# Error Tracking (Sprint 7+)
NUXT_PUBLIC_SENTRY_DSN=xxx

# SEO
NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxx
```

`NUXT_PUBLIC_*` → exposed to client via `useRuntimeConfig().public.*`
`NUXT_*` (no PUBLIC) → server-only via `useRuntimeConfig().*`

Copy actual values from the old project's `.env` file, adjusting prefixes.

## Reference: Old Project

The old Nuxt 2 codebase at `../doworkss_frontend/` is the source of truth for:

- **Business logic:** How features work, validation rules, edge cases
- **API endpoints:** `api/*.js` files define all backend URL patterns
- **Translations:** `locales/*.json` (596KB across 6 languages) — copy to `i18n/locales/`
- **Assets:** `assets/` (images, SCSS) — consolidate and copy
- **Constants:** `constants/const.js` and `constants/countries.json`
- **Auth flow:** `schemes/customRefresh.js`, `plugins/axios.js` error handling, `store/index.js` `nuxtServerInit`
- **Vuetify theme colors:** `config/vuetify.options.js` (primary `#407830`, 40+ color tokens)
- **i18n config:** `config/i18n.js` (6 locales, RTL config, prefix strategy)
- **Page behavior:** 68 pages across auth, services, deals, chat, wallet, blog, plans, profile
- **Store modules:** `store/*/` (22 Vuex modules with state/mutations/actions/getters)
- **Plugins:** `plugins/` (25 plugins — review for migration to composables/Nitro)
- **Environment variables:** `.env` file (all actual secret values)

Old project CLAUDE.md: `../doworkss_frontend/CLAUDE.md` (600+ line reference)

## Security Checklist

- **PRIVATE_KEY stays server-only** — never in `publicRuntimeConfig`, never in client bundles
- **Tokens in sealed cookies** — `nuxt-auth-utils` encrypts session with `NUXT_SESSION_PASSWORD`
- **No raw tokens on client** — the `secure` field in session is server-only
- **XSS prevention** — DOMPurify for user-generated HTML (blog content, chat messages)
- **CSRF** — Nitro handles via same-origin cookie + API key validation
- **CSP** — `nuxt-security` module with nonce-based script policy (Sprint 13)
- **Input validation** — `vee-validate` client-side, backend validates server-side
- **Cookie security** — `secure: true` in production, `sameSite: 'lax'`, `httpOnly: true`
- **No secrets in git** — `.env` is gitignored, use `.env.example` as template

## Critical Corrections (from Plan Validation)

These corrections MUST be applied when implementing:

1. **Pinia stores location:** `app/stores/` NOT root `stores/` — Nuxt 4 auto-imports only from `app/stores/`
2. **Auth package:** MUST install `nuxt-auth-utils` — the plan uses `getUserSession()`/`setUserSession()` which require it
3. **i18n version:** Install `@nuxtjs/i18n@10.2.4` (latest stable), NOT v9 with `@next` tag
4. **Vuetify SSR client hints:** Goes in `nuxt.config.ts` under `vuetify.moduleOptions.ssrClientHints`, NOT in `vuetify.config.ts`
5. **Vuetify 4 default theme:** Set `defaultTheme: 'light'` explicitly — v4 defaults to `'system'`
6. **CSP nonce syntax:** Use `'nonce-{{nonce}}'` (double braces) + set `nonce: true` in config
7. **i18n langDir:** `langDir: 'locales'` resolves from `i18n/` directory (v10's `restructureDir`)
