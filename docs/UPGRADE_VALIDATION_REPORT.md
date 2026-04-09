# Upgrade Plan Validation Report

> **Date:** 2026-04-09
> **Validated Against:** Nuxt 4.4.2, Vue 3.5.32, Vue Router 5.0.4, Vite 7.3.2, TypeScript 6.0.2, Nitro 2.13.3 (h3 1.15.11)
> **Source Plan:** `doworkss_frontend/docs/UPGRADE_PART_ONE.md` (2,082 lines)

---

## Summary

- **4 CRITICAL issues** that must be fixed before execution
- **4 IMPORTANT issues** that should be fixed
- **3 MINOR issues** (nice to fix)
- **23 out of 30 plan elements validated as CORRECT**
- **Vue Router 5 has NO breaking changes** for this project (biggest positive finding)

---

## CRITICAL Issues

### 1. `stores/` directory is in the WRONG location

| | Detail |
|---|---|
| **Plan (line 1013)** | `stores/` at project root (sibling to `app/`) |
| **Correct** | `app/stores/` inside the app directory |
| **Why** | `@pinia/nuxt` auto-imports from `app/stores/` by default. Root-level `stores/` won't be discovered |
| **Affected lines** | 1013, 1276, 1369-1396, 1632, 1687 |
| **Fix** | Replace all `stores/` references with `app/stores/` |

### 2. `useAsyncData` / `useFetch` breaking behavior changes NOT documented

The plan references these APIs (lines 849, 1541-1542, 1912) but does NOT document these Nuxt 4 breaking changes:

| Change | Nuxt 3 (Old) | Nuxt 4 (New) | Impact |
|--------|-------------|-------------|--------|
| Default value of `data` and `error` | `null` | `undefined` | **All `=== null` checks will break** |
| `data` ref type | `ref` (deep reactive) | `shallowRef` (shallow) | **Nested property mutations won't trigger reactivity** |
| Stale data on refetch | Preserved during refetch | Cleared to `undefined` | UI flashes loading states where it previously showed stale data |
| Same-key behavior | Independent per call | Shared `data`/`error`/`status` refs | Keys must be unique per distinct data source |
| `getCachedData` signature | N/A | Receives context object with request cause | New parameter |

**Required team conventions:**
- Use `!data.value` instead of `data.value === null`
- Use `{ deep: true }` option when mutating nested properties, or replace entire objects with spread
- Use `getCachedData` callback to preserve stale data during refetch if desired
- Ensure every `useAsyncData`/`useFetch` call has a unique key

### 3. `@nuxtjs/i18n` version target is outdated

| | Detail |
|---|---|
| **Plan (lines 57, 863)** | Targets `@nuxtjs/i18n ^9+` |
| **Correct** | Target `@nuxtjs/i18n ^10` (current stable: v10.2.4) |
| **Why** | v10 is the current stable release for Nuxt 4. v9 was transitional |
| **API change** | `localePath()` is replaced by `useLocalePath()` composable (auto-imported). Same functionality, different surface |
| **Also** | `$t()` still works in templates. In `<script setup>`, use `const { t } = useI18n()` |
| **Confirmed** | `onBeforeLanguageSwitch` callback does NOT exist in v10 - plan's plugin replacement (5.2.2) is correct |

### 4. Auth approach: cookie-based, NOT session-based

| | Detail |
|---|---|
| **Plan (lines 1150, 1564-1580)** | Uses `getUserSession` / `replaceUserSession` / sealed sessions |
| **Correct** | Use direct cookie-based auth with h3 `setCookie`/`getCookie` on server, `useCookie` on client for non-sensitive data |
| **Why** | Project currently uses cookie-based auth. Sealed sessions add unnecessary complexity for a token-based flow |
| **Security note** | `useCookie` with `httpOnly: true` leaks values in `__NUXT_DATA__` SSR payload. Auth tokens must be managed exclusively server-side with h3 `setCookie`/`getCookie`. Client gets user profile data only (not tokens) via `useState` hydrated from SSR |

**Cookie-based auth architecture:**
```
Login:    Browser -> POST /api/auth/login -> Nitro -> Backend API
          Nitro sets httpOnly cookies (access_token, refresh_token) via h3 setCookie
          Returns user data only (no tokens to client)

SSR:      Nitro server middleware reads cookies from request headers
          Validates/refreshes token -> sets event.context.auth
          useAuth composable reads from event.context on server, useState on client

API:      Browser -> /api/* proxy -> Nitro reads token from cookies -> Backend
          PRIVATE_KEY added server-side only

Logout:   Browser -> POST /api/auth/logout -> Nitro clears cookies
```

---

## IMPORTANT Issues

### 5. Vuetify Nuxt module - must pick ONE path

| | Detail |
|---|---|
| **Plan (line 842)** | Lists both `vuetify-nuxt-module` and `vite-plugin-vuetify` as options |
| **Issue** | Cannot use both - `vuetify-nuxt-module` throws an error if `vite-plugin-vuetify` is also installed |
| **Recommended** | Use `vuetify-nuxt-module` (official, `github.com/vuetifyjs/nuxt-module`). v1.0.0-beta.2 targets Nuxt 4 |
| **Fallback** | If beta is unstable, use `vite-plugin-vuetify` directly WITHOUT the Nuxt module wrapper |
| **Also needed** | Install `sass-embedded` for modern SASS compilation (Vuetify 3 requirement) |

### 6. `tsconfig.json` example doesn't match Nuxt 4 reality

| | Detail |
|---|---|
| **Plan (lines 1350-1358)** | Shows `"extends": "./.nuxt/tsconfig.json"` |
| **Actual scaffolded project** | Uses multi-reference structure (see below) |

**Actual `tsconfig.json` in Nuxt 4.4.2:**
```json
{
  "files": [],
  "references": [
    { "path": "./.nuxt/tsconfig.app.json" },
    { "path": "./.nuxt/tsconfig.server.json" },
    { "path": "./.nuxt/tsconfig.shared.json" },
    { "path": "./.nuxt/tsconfig.node.json" }
  ]
}
```

Custom compiler options should go in `nuxt.config.ts` under `typescript` key, not directly in tsconfig.

### 7. `@nuxt/fonts` default weight limitation

| | Detail |
|---|---|
| **Plan claim** | "Self-hosted fonts, zero external requests" (correct) |
| **Missing info** | Only `normal/400` weight loads by default |
| **Impact** | Arabic font (Tajawal) needs multiple weights. Without explicit config, only weight 400 is available |
| **Fix** | Add explicit font weight configuration in `nuxt.config.ts` fonts options |

### 8. Pinia 3 `defineStore` signature change

| | Detail |
|---|---|
| **Status** | Pinia 3.0.4 is released and compatible |
| **Breaking** | `defineStore({ id: 'name', ... })` object signature is REMOVED in Pinia 3 |
| **Only valid** | `defineStore('name', { ... })` (options) or `defineStore('name', () => { ... })` (setup) |
| **Plan's examples** | Already use correct syntax, but team should be warned |

---

## MINOR Issues

### 9. `@sentry/nuxt` Nuxt 4 status

| | Detail |
|---|---|
| **Officially supports** | Nuxt 3.7.0+ (3.14.0+ recommended) |
| **Nuxt 4 status** | Not explicitly confirmed but should work (maintains module hook compatibility) |
| **Recommendation** | Test early in Sprint 5/6. Fallback: direct `@sentry/vue` + `@sentry/node` via plugins |

### 10. Pinia Colada - defer adoption

| | Detail |
|---|---|
| **Status** | Production-ready, `@pinia/colada-nuxt` available |
| **Plan (line 1453)** | Mentions it for async data fetching |
| **Recommendation** | For a migration this large, defer. Use built-in `useFetch`/`useAsyncData` first. Adopt Pinia Colada post-migration for specific complex caching needs |

### 11. Vite cold start claim is understated

| | Detail |
|---|---|
| **Plan (line 1465)** | Claims "<5s cold start" |
| **Reality** | Vite 7.3.2 cold start is ~1.4s on modern hardware (45% faster than Vite 6) |
| **Fix** | Update to "~1-2s" - the claim is accurate but very conservative |

---

## Validated as CORRECT (No Changes Needed)

| Plan Element | Status | Notes |
|---|---|---|
| `app/` directory convention | CORRECT | Scaffolded project already uses `app/app.vue` |
| `compatibilityDate: '2025-07-15'` | CORRECT | Default for Nuxt 4 stable |
| Vue Router 5 impact | **NO BREAKING CHANGES** | Router 5 is transparent - no changes needed |
| `defineNuxtConfig` API | UNCHANGED | Same API as Nuxt 3 |
| `useState` | AVAILABLE | Same API |
| `useCookie` | AVAILABLE | Same API (with httpOnly caveat noted above) |
| `definePageMeta` | UNCHANGED | Same compiler-macro behavior |
| Route middleware syntax | UNCHANGED | `defineNuxtRouteMiddleware` works identically |
| Plugin system | UNCHANGED | `defineNuxtPlugin` works identically |
| Auto-imports | UNCHANGED | Same behavior for composables, utils, components |
| Error handling APIs | UNCHANGED | `createError`, `showError`, `useError`, `clearError` |
| `routeRules` syntax | CORRECT | `prerender`, `isr`, `ssr: false` all work as documented |
| Nitro API proxy pattern | CORRECT | Matches recommended Nuxt 4 architecture |
| `nuxtServerInit` replacement | CORRECT | Nitro server middleware is the right approach |
| ofetch / `$fetch` | CORRECT | Built-in, no extra dependency |
| Pinia 3 | RELEASED | v3.0.4, `@pinia/nuxt` v0.11.3 compatible |
| `pinia-plugin-persistedstate` | COMPATIBLE | Works with Pinia 3 |
| vee-validate 4 | COMPATIBLE | `@vee-validate/nuxt` available |
| nuxt-security | COMPATIBLE | Works with Nuxt 4.4 |
| `@nuxt/image` v2 | CONFIRMED | Already installed |
| `@nuxt/fonts` v0.14 | CONFIRMED | Already installed |
| `@nuxt/scripts` v0.13 | CONFIRMED | Already installed |
| Firebase integration approach | CORRECT | Direct SDK v11+ via client plugin |
| `v-memo` / `v-once` | CORRECT | Still recommended in Vue 3.5 |
| `NuxtIsland` | AVAILABLE | Server-only components work |
| `defineAsyncComponent` | CORRECT | Standard lazy loading |
| Payload extraction | CORRECT | Works in dev + ISR/SWR since Nuxt 4.3 |
| TypeScript 6 | SAFE | No issues with Vue 3.5 / Nuxt 4 |
| Rendering strategy | CORRECT | SSR/ISR/SSG/SPA per route works |
| Testing strategy (Vitest + Playwright) | CORRECT | Correct tool choices |

---

## Key API Differences: Nuxt 2 vs Nuxt 4

| Nuxt 2 | Nuxt 4 | Notes |
|--------|--------|-------|
| `$auth` | `useAuth()` composable | Custom composable |
| `$request(args)` | `useApi().request(url, opts)` | Composable pattern |
| `$alert({ msg, type })` | `useToast()` | From vue-toastification v2 |
| `$dir()` | `useDirection()` | Custom composable |
| `this.$store.getters[...]` | `storeToRefs(useXxxStore())` | Pinia |
| `this.$store.dispatch(...)` | `useXxxStore().actionName()` | Direct function call |
| `this.$t('key')` | `const { t } = useI18n(); t('key')` | In script setup |
| `$t('key')` in template | `$t('key')` | Still works in templates |
| `this.$router.push(...)` | `navigateTo(...)` or `useRouter().push(...)` | Nuxt composable preferred |
| `this.$route.params` | `useRoute().params` | Composable |
| `app.localePath('/path')` | `useLocalePath()('/path')` | Auto-imported composable |
| `process.client` | `import.meta.client` | Vite convention |
| `process.server` | `import.meta.server` | Vite convention |
| `asyncData()` | `useAsyncData()` or `useFetch()` | Composable in `<script setup>` |
| `fetch()` hook | `useFetch()` or `useAsyncData()` | Composable in `<script setup>` |
| `head()` | `useHead()` or `useSeoMeta()` | Composable |
| `nuxtServerInit` | Server middleware (`server/middleware/`) | Nitro event handler |
| `process.env.VAR` | `useRuntimeConfig().public.var` | Never use process.env in client |
| `publicRuntimeConfig` | `runtimeConfig.public` | Config key rename |
| `privateRuntimeConfig` | `runtimeConfig` (top-level) | Server-only by default |
| `static/` directory | `public/` directory | Rename |
| `store/` directory | `app/stores/` | Inside app dir |
| `components/` at root | `app/components/` | Inside app dir |
| `pages/` at root | `app/pages/` | Inside app dir |
| `plugins/` at root | `app/plugins/` | Inside app dir |
| `middleware/` at root | `app/middleware/` | Inside app dir |
| `layouts/` at root | `app/layouts/` | Inside app dir |
| `server-middleware/` | `server/middleware/` | Nitro convention |
| `buildModules` | `modules` (unified) | No distinction in Nuxt 4 |
| `modules` array | `modules` array | Same key, different module versions |
| Global mixins | Composables in `app/composables/` | Auto-imported |
| Options API (`data`, `methods`, `computed`) | Composition API (`ref`, `function`, `computed`) | Full rewrite |
| `<script>` + `export default` | `<script setup lang="ts">` | Modern syntax |

---

## Module Version Matrix

| Module | Old (Nuxt 2) | Target Version | Status |
|--------|-------------|---------------|--------|
| `nuxt` | 2.15.8 | 4.4.2 | Installed |
| `vue` | 2.7.10 | 3.5.32 | Installed |
| `vue-router` | 3.x | 5.0.4 | Installed |
| `vuetify` | 2.6.10 | 3.7+ | To install |
| `vuetify-nuxt-module` | N/A (was @nuxtjs/vuetify) | 1.0.0-beta.2 | To install |
| `pinia` | N/A (was vuex) | 3.0.4+ | To install |
| `@pinia/nuxt` | N/A | 0.11.3+ | To install |
| `@nuxtjs/i18n` | 7.3.1 | **10.2.4+** | To install |
| `vee-validate` | 3.4.14 | 4.x | To install |
| `@vee-validate/nuxt` | N/A | Latest | To install |
| `@sentry/nuxt` | N/A (was @nuxtjs/sentry) | Latest | To install |
| `nuxt-security` | N/A | Latest | To install |
| `@nuxt/image` | N/A | 2.0.0 | Installed |
| `@nuxt/fonts` | N/A | 0.14.0 | Installed |
| `@nuxt/scripts` | N/A | 0.13.2 | Installed |
| `@nuxt/icon` | N/A | 2.2.1 | Installed |
| `@nuxt/hints` | N/A | 1.0.3 | Installed |
| `@nuxt/eslint` | N/A | 1.15.2 | Installed |
| `vue-toastification` | 1.7.14 | 2.x | To install |
| `@tiptap/vue-3` | N/A (was tiptap-vuetify) | Latest | To install |
| `vue-easy-lightbox` | 0.20.0 | 1.x+ | To install |
| `vue-advanced-cropper` | 1.x | 2.x+ | To install |
| `firebase` | 9.22.1 | 11+ | To install |
| `pusher-js` | 8.4.0-rc2 | 8.4+ (stable) | To install |
| `maska` | N/A (was v-mask) | 3.x | To install |
| `pinia-plugin-persistedstate` | N/A | Latest | To install |
| `@vueuse/nuxt` | N/A | Latest | To install |
| `vitest` | N/A | Latest | To install |
| `@playwright/test` | N/A | Latest | To install |

---

## Corrected Directory Structure

```
doworkss-fe-latest/
├── app/                          # Application code (Nuxt 4 convention)
|   ├── app.vue                   # Root component
|   ├── assets/
|   |   ├── scss/
|   |   ├── fonts/
|   |   └── images/
|   ├── components/
|   |   ├── base/                 # BaseButton, BaseInput, BaseModal, BaseFilePicker
|   |   ├── layout/               # AppNav, AppFooter, AppSidebar
|   |   ├── feature/              # Domain-specific components
|   |   |   ├── auth/
|   |   |   ├── chat/
|   |   |   ├── deals/
|   |   |   ├── services/
|   |   |   └── wallet/
|   |   └── shared/               # ServiceCard, ProviderCard
|   ├── composables/              # Replaces mixins + plugins
|   |   ├── useAuth.ts            # Cookie-based auth (custom)
|   |   ├── useApi.ts             # API calls with showToast option
|   |   ├── useCurrency.ts
|   |   ├── useChat.ts
|   |   ├── usePusher.ts
|   |   ├── useFcm.ts
|   |   ├── useInfiniteScroll.ts
|   |   └── useDirection.ts
|   ├── layouts/
|   ├── middleware/
|   ├── pages/
|   ├── plugins/                  # Only for 3rd-party integrations
|   └── stores/                   # CORRECTED: Pinia stores INSIDE app/
|       ├── auth.ts
|       ├── global.ts
|       ├── chat.ts
|       ├── deals.ts
|       ├── services.ts
|       ├── serviceForm.ts
|       ├── wallet.ts
|       ├── plan.ts
|       ├── categories.ts
|       └── ui.ts
├── server/                       # Nitro server (stays at root)
|   ├── api/
|   |   ├── auth/
|   |   |   ├── login.post.ts     # Sets httpOnly cookies
|   |   |   ├── logout.post.ts    # Clears cookies
|   |   |   ├── refresh.post.ts   # Refreshes tokens, updates cookies
|   |   |   └── user.get.ts       # Returns user profile
|   |   └── proxy/
|   |       └── [...].ts          # Catch-all API proxy
|   ├── middleware/
|   |   ├── auth.ts               # Reads cookies, validates tokens
|   |   └── security.ts
|   └── utils/
|       ├── auth.ts               # Token validation, cookie helpers
|       └── proxy.ts              # Backend API proxy helper
├── shared/                       # Shared between app/ and server/
|   ├── types/
|   |   ├── auth.ts
|   |   ├── service.ts
|   |   ├── deal.ts
|   |   └── api.ts
|   ├── constants/
|   └── utils/
|       ├── currency.ts
|       ├── string.ts
|       ├── validation.ts
|       └── date.ts
├── public/                       # Static files (was static/)
|   ├── firebase-messaging-sw.js  # Manual FCM service worker
|   └── robots.txt
├── locales/                      # i18n translations
├── tests/
|   ├── unit/
|   ├── integration/
|   └── e2e/
├── nuxt.config.ts
├── tsconfig.json                 # Multi-reference (auto-generated)
├── vitest.config.ts
└── playwright.config.ts
```

---

## Cookie-Based Auth Architecture (Corrected from Session-Based)

### Flow Diagrams

**Login:**
```
Browser                    Nitro Server                Backend API
  |                            |                          |
  |-- POST /api/auth/login --> |                          |
  |   { email, password }      |-- POST /login ---------> |
  |                            |   + PRIVATE_KEY header    |
  |                            |<-- { token, refresh,   --|
  |                            |     user }                |
  |                            |                          |
  |                            | setCookie('access_token', token, {
  |                            |   httpOnly: true, secure: true,
  |                            |   sameSite: 'lax', maxAge: 86100 })
  |                            |                          |
  |                            | setCookie('refresh_token', refreshToken, {
  |                            |   httpOnly: true, secure: true,
  |                            |   sameSite: 'lax', maxAge: 31536000 })
  |                            |                          |
  |<-- { user } (no tokens) --|                          |
  | useState('auth:user', user)|                          |
```

**SSR Request:**
```
Browser                    Nitro Server Middleware       Backend API
  |                            |                          |
  |-- GET /ar/services ------> |                          |
  |   (cookies sent auto)      |                          |
  |                            | getCookie('access_token')  |
  |                            | if expired:              |
  |                            |   getCookie('refresh_token')
  |                            |   POST /refresh-token -> |
  |                            |   update cookies         |
  |                            |                          |
  |                            | event.context.auth = {   |
  |                            |   user, token }          |
  |                            |                          |
  |                            | SSR renders page with    |
  |                            | auth state hydrated      |
  |<-- HTML + hydration -------|                          |
```

**API Proxy (authenticated request):**
```
Browser                    Nitro Proxy Route            Backend API
  |                            |                          |
  |-- $fetch('/api/proxy/..') >|                          |
  |   (cookies sent auto)      |                          |
  |                            | getCookie('access_token')  |
  |                            | proxyRequest(event, {    |
  |                            |   headers: {             |
  |                            |     Authorization: token,|
  |                            |     'private-key': KEY   |
  |                            |   }                      |
  |                            | }) ---> Backend -------> |
  |<-- response data ---------|<-- response -------------|
```

### Server Code Examples

```ts
// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  // Forward to backend
  const response = await $fetch('/login', {
    baseURL: config.apiBaseUrl,
    method: 'POST',
    body,
    headers: {
      'private-key': config.privateKey,
      'Accept': 'application/json',
    },
  })

  // Set httpOnly cookies (tokens NEVER sent to client)
  setCookie(event, 'access_token', response.data.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 - 600, // 23h 50m (match current)
  })

  setCookie(event, 'refresh_token', response.data.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year (match current)
  })

  // Return user data ONLY (no tokens)
  return { user: response.data.user }
})
```

```ts
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  const accessToken = getCookie(event, 'access_token')
  const refreshToken = getCookie(event, 'refresh_token')

  if (!accessToken && !refreshToken) {
    event.context.auth = { user: null, loggedIn: false }
    return
  }

  // If access token expired but refresh token exists, refresh
  if (!accessToken && refreshToken) {
    try {
      const config = useRuntimeConfig()
      const response = await $fetch('/refresh-token', {
        baseURL: config.apiBaseUrl,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'private-key': config.privateKey,
        },
      })

      // Update cookies with new tokens
      setCookie(event, 'access_token', response.data.token, {
        httpOnly: true, secure: true, sameSite: 'lax',
        path: '/', maxAge: 60 * 60 * 24 - 600,
      })
      setCookie(event, 'refresh_token', response.data.refresh_token, {
        httpOnly: true, secure: true, sameSite: 'lax',
        path: '/', maxAge: 60 * 60 * 24 * 365,
      })

      event.context.auth = { user: response.data.user, loggedIn: true, token: response.data.token }
    } catch {
      // Refresh failed - clear cookies
      deleteCookie(event, 'access_token')
      deleteCookie(event, 'refresh_token')
      event.context.auth = { user: null, loggedIn: false }
    }
    return
  }

  // Valid access token - fetch user info
  try {
    const config = useRuntimeConfig()
    const response = await $fetch('/user-information', {
      baseURL: config.apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'private-key': config.privateKey,
      },
    })
    event.context.auth = { user: response.data, loggedIn: true, token: accessToken }
  } catch {
    event.context.auth = { user: null, loggedIn: false }
  }
})
```

```ts
// app/composables/useAuth.ts
export function useAuth() {
  const user = useState<User | null>('auth:user', () => null)
  const loggedIn = computed(() => !!user.value)

  // On SSR: read from server middleware context
  if (import.meta.server) {
    const event = useRequestEvent()
    const authContext = event?.context.auth
    if (authContext?.user) {
      user.value = authContext.user
    }
  }

  async function login(credentials: { email: string; password: string }) {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })
    user.value = response.user
    return response
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo(useLocalePath()('/'))
  }

  async function refreshUser() {
    try {
      const response = await $fetch('/api/auth/user')
      user.value = response.user
    } catch {
      user.value = null
    }
  }

  return { user, loggedIn, login, logout, refreshUser }
}
```
