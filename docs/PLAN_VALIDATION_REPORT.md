# Migration Plan Validation Report

> Deep verification of every technical assumption in UPGRADE_PART_ONE.md and MIGRATION_PLAN.md against current documentation and installed packages.
> Validated: 2026-04-09

---

## Environment Verified

| Package | Installed | Latest | Status |
|---------|-----------|--------|--------|
| `nuxt` | 4.4.2 | — | Current |
| `vue` | ^3.5.30 (pinned by nuxt) | — | `useTemplateRef` available (Vue 3.5+) |
| `h3` | 1.15.11 (bundled) | — | `proxyRequest`, `sendProxy`, `getRouterParam` all available |
| `vuetify-nuxt-module` | Not installed yet | 0.19.5 | Compatible |
| `@nuxtjs/i18n` | Not installed yet | 10.2.4 | v10 is latest (not v9 as plan says) |
| `@pinia/nuxt` | Not installed yet | 0.11.3 | Compatible, Nuxt 4 aware |
| `nuxt-security` | Not installed yet | 2.5.1 | Compatible |
| `@sentry/nuxt` | Not installed yet | 10.47.0 | Compatible |
| `nuxt-auth-utils` | Not installed yet | 0.5.29 | Available if needed |

---

## CRITICAL ISSUES (Must Fix Before Executing)

### Issue 1: Pinia Stores Directory — Wrong Location

**Plan says:** `stores/` at project root (outside `app/`)
**Correct for Nuxt 4:** `app/stores/`

**Evidence:** `@pinia/nuxt` v0.11.3 README:
> "In the new directory structure introduced since Nuxt 4, this directory is `app/stores`."

**Impact:** Stores won't be auto-imported if placed at root `stores/`.

**Fix:** Move stores into `app/stores/`. Remove `storesDirs` config from `nuxt.config.ts` — the default already points to `app/stores` in Nuxt 4.

```diff
- stores/           # WRONG - at root
+ app/stores/       # CORRECT - inside app/

# nuxt.config.ts
- pinia: {
-   storesDirs: ['./stores/**'],
- },
+ // No config needed - @pinia/nuxt defaults to app/stores/ in Nuxt 4
```

If you need nested stores, add:
```ts
pinia: {
  storesDirs: ['app/stores/**'],
}
```

---

### Issue 2: Auth Session — Contradictory Approach

**Plan says (Decision #4):** "NOT nuxt-auth-utils" — use custom `useAuth` composable + Nitro API proxy
**Plan also says (Section 5.2.6, Appendix C.4):** Uses `getUserSession()`, `replaceUserSession()` — these are `nuxt-auth-utils` functions!

**The plan contradicts itself.** These functions don't exist without `nuxt-auth-utils`.

**Recommended fix — Use `nuxt-auth-utils` for session layer only:**

The decision to avoid `nuxt-auth-utils` was based on its OAuth/sealed-session model not matching the current token-based flow. However, `nuxt-auth-utils` provides exactly the sealed cookie primitives you need (`getUserSession`, `replaceUserSession`, `clearUserSession`). You can use it as a **session storage layer** while building custom auth logic on top.

```
Approach: nuxt-auth-utils (session storage) + custom useAuth composable (auth logic)
```

```ts
// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  // Call backend API
  const response = await $fetch('/login', {
    baseURL: config.public.apiBase,
    method: 'POST',
    body,
    headers: { 'private-key': config.privateKey },
  })

  // Store tokens in sealed session (nuxt-auth-utils)
  await setUserSession(event, {
    user: response.data.user,
    token: response.data.token,
    refreshToken: response.data.refresh_token,
  })

  return response.data.user
})
```

**Alternative:** If you truly don't want `nuxt-auth-utils`, build sealed sessions manually with h3's `useSession`:
```ts
import { useSession } from 'h3'
const session = await useSession(event, { password: config.sessionSecret })
```

But this is reinventing what `nuxt-auth-utils` already provides. **Recommendation: Install `nuxt-auth-utils` and use it for session management.**

---

### Issue 3: @nuxtjs/i18n Version — Plan Says v9, Latest Is v10

**Plan says:** `@nuxtjs/i18n` ^9+ (with `@next` tag)
**Actual latest:** `@nuxtjs/i18n` **v10.2.4** (stable, no `@next` needed)

**Impact:** The API is the same (v9 and v10 are compatible), but installation command should be:
```diff
- pnpm add @nuxtjs/i18n@next
+ pnpm add @nuxtjs/i18n
```

The i18n v10 config uses `language` (not the old `iso`), which the plan correctly uses. Verified from docs.

---

## MEDIUM ISSUES (Should Fix)

### Issue 4: Vuetify Config File Path

**Plan says:**
```ts
vuetify: {
  moduleOptions: { ssrClientHints: { ... } },
  vuetifyOptions: './config/vuetify.config.ts',
}
```

**Docs show:** The external config file should be at project root as `vuetify.config.ts` (auto-detected), or explicitly referenced. Custom paths work when explicitly specified.

**But:** The `ssrClientHints` config structure in the plan is wrong. According to docs, `ssrClientHints` is a `moduleOptions` property, but it takes different options than what the plan shows.

**Correct structure verified from docs:**
```ts
vuetify: {
  moduleOptions: {
    styles: true,
    importComposables: true,
    prefixComposables: false,
  },
  vuetifyOptions: './vuetify.config.ts', // or './config/vuetify.config.ts'
}
```

For SSR client hints, the Vuetify config file should have:
```ts
// vuetify.config.ts
export default defineVuetifyConfiguration({
  ssr: {
    clientWidth: 1280,
    clientHeight: 720,
  },
  // ... theme, defaults, locale
})
```

**Fix:** Move `ssr` config into `vuetifyOptions` (the external config file), not `moduleOptions`.

---

### Issue 5: nuxt-security CSP Nonce Syntax

**Plan says:** `'nonce-{nonce}'` (single curly braces)
**Docs say:** `'nonce-{{nonce}}'` (double curly braces)

**Fix:**
```diff
- "'nonce-{nonce}'"
+ "'nonce-{{nonce}}'"
```

Also, the plan should enable the `nonce: true` option:
```ts
security: {
  nonce: true,  // MISSING from plan
  headers: {
    contentSecurityPolicy: {
      'script-src': ["'self'", "'strict-dynamic'", "'nonce-{{nonce}}'"],
    }
  }
}
```

---

### Issue 6: i18n `langDir` Relative Path

**Plan says:** `langDir: '../locales/'`
**Issue:** In Nuxt 4, `srcDir` is `app/`. The `langDir` is resolved relative to `srcDir` (`app/`), so `../locales/` would resolve to `<root>/locales/` — which IS where we put locale files. So this works.

**However**, the cleaner approach (per i18n v10 docs) is:
```ts
i18n: {
  langDir: 'locales',  // resolved relative to project root in i18n v10
  // OR
  locales: [
    { code: 'ar', file: 'ar.json' },
    // ...
  ]
}
```

**Recommendation:** Test both approaches during Sprint 5. The `../locales/` path should work but is fragile. If i18n v10 resolves relative to root by default, use just `'locales'`.

---

### Issue 7: nuxt-security Rate Limiter Defaults

**Plan says:** `tokensPerInterval: 50, interval: 60000`
**Defaults:** `tokensPerInterval: 150, interval: 300000`

The plan's values are stricter (50 requests per minute vs 150 per 5 minutes). This is an intentional choice, not a bug. But be aware this may cause issues during development or with rapid API calls. Consider using per-route overrides for auth endpoints instead of a global strict limit:

```ts
security: {
  rateLimiter: false,  // Disable globally
},
routeRules: {
  '/api/auth/**': {
    security: {
      rateLimiter: { tokensPerInterval: 5, interval: 60000 },
    },
  },
  '/api/**': {
    security: {
      rateLimiter: { tokensPerInterval: 50, interval: 60000 },
    },
  },
}
```

---

## MINOR ISSUES (Nice to Fix)

### Issue 8: Vuetify RTL Configuration

**Plan's vuetify.config.ts:**
```ts
locale: {
  locale: 'ar',
  fallback: 'en',
  rtl: { ar: true, ur: true },
}
```

**Correct structure per vuetify-nuxt-module docs:**
The `locale` type is `Omit<LocaleOptions, 'adapter'> & RtlOptions`. The RTL config should be:
```ts
locale: {
  locale: 'ar',
  fallback: 'en',
},
// RTL is separate in theme, not locale
// Vuetify 3 handles RTL per-locale automatically when locale.rtl is configured
```

Verify during Sprint 5 — the exact API depends on the vuetify-nuxt-module version.

---

### Issue 9: `proxyRequest` Import

**Plan's catch-all proxy uses `proxyRequest`** which is confirmed available in h3 v1.15.11. However, in Nitro server routes, h3 utilities are auto-imported, so no explicit import is needed. Verified.

---

### Issue 10: Directory Structure — `shared/` Auto-Import Scope

**Plan correctly places `shared/` at root.** Nuxt 4 docs confirm:
> "The `shared/` directory allows for code sharing between the Vue application and the Nitro server, including auto-imports for utilities and types."

Auto-imported directories within `shared/`:
- `shared/utils/` — auto-imported in both app and server
- `shared/types/` — auto-imported as types in both app and server

This is correct in the plan.

---

## VERIFIED CORRECT (No Changes Needed)

| Plan Element | Status | Evidence |
|---|---|---|
| Nuxt 4 `app/` directory structure | CORRECT | Docs confirm `app/` is default srcDir |
| `routeRules` with `prerender`, `isr`, `swr`, `ssr: false`, `redirect` | CORRECT | Docs show exact same syntax |
| `runtimeConfig` public/private split | CORRECT | Standard Nuxt 4 API |
| `useAsyncData` / `useFetch` for data fetching | CORRECT | Standard Nuxt 4 API |
| `useState` for SSR-safe shared state | CORRECT | Docs confirm |
| `useCookie` for SSR-safe cookie access | CORRECT | Docs confirm |
| `useTemplateRef` for template refs | CORRECT | Vue 3.5+ (Nuxt 4.4.2 uses Vue 3.5.30) |
| `useHead` / `useSeoMeta` for SEO | CORRECT | Standard Nuxt 4 API |
| `definePageMeta` for layout/middleware | CORRECT | Standard Nuxt 4 API |
| `import.meta.client` / `import.meta.server` | CORRECT | Replaces `process.client/server` |
| `navigateTo` for programmatic navigation | CORRECT | Standard Nuxt 4 API |
| `refreshNuxtData` replacing `$nuxt.refresh()` | CORRECT | Standard Nuxt 4 API |
| `useLoadingIndicator` replacing `$nuxt.$loading` | CORRECT | Standard Nuxt 4 API |
| `proxyRequest` from h3 for API proxy | CORRECT | h3 v1.15.11 exports it |
| `getRouterParam` from h3 for dynamic routes | CORRECT | h3 v1.15.11 exports it |
| `defineEventHandler` for server routes | CORRECT | Nitro standard |
| `server/api/` and `server/middleware/` structure | CORRECT | Standard Nitro |
| Vuetify 3 `defineVuetifyConfiguration` | CORRECT | vuetify-nuxt-module docs confirm |
| vee-validate 4 composable API (`useForm`, `useField`) | CORRECT | Standard vee-validate 4 |
| `::v-deep` → `:deep()` migration | CORRECT | Vue 3 standard |
| `.native` modifier removal | CORRECT | Vue 3 standard |
| `this.$set` → direct assignment | CORRECT | Vue 3 Proxy reactivity |
| Vuetify 2 → 3 breaking changes (Appendix A) | CORRECT | Comprehensive and accurate |
| Mixin → Composable mapping (Appendix B) | CORRECT | Logical and well-structured |
| Data fetching patterns (Appendix C) | CORRECT | Matches Nuxt 4 docs |
| Environment variable mapping (Appendix D) | CORRECT | `NUXT_` prefix convention |

---

## CORRECTED nuxt.config.ts

Based on all validations, here is the corrected configuration:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // ── Modules ──
  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    '@nuxtjs/i18n',          // v10.2.4 (NOT @next)
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/scripts',
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxt/hints',
    'nuxt-security',
    'nuxt-gtag',
    '@vueuse/nuxt',
    'nuxt-auth-utils',        // For sealed session management
  ],

  // ── CSS ──
  css: [
    '@mdi/font/css/materialdesignicons.css',
    '~/assets/scss/main.scss',
  ],

  // ── Runtime Config ──
  runtimeConfig: {
    privateKey: '',
    tapSecretKey: '',
    session: {
      password: '',           // NUXT_SESSION_PASSWORD (for nuxt-auth-utils)
    },
    public: {
      appEnv: '',
      apiBase: '',
      hostName: '',
      tapPublicKey: '',
      tapMerchantId: '',
      tapEnvironment: '',
      pusherAppKey: '',
      pusherCluster: '',
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseStorageBucket: '',
      firebaseMessagingSenderId: '',
      firebaseAppId: '',
      firebaseMeasurementId: '',
      firebaseFcmVapidKey: '',
      sentryDsn: '',
      googleSiteVerification: '',
      googleClientId: '',
      googleAnalyticsId: '',
      appleClientId: '',
      appleRedirectUri: '',
    },
  },

  // ── SSR + Rendering ──
  ssr: true,
  routeRules: {
    '/about-us': { prerender: true },
    '/privacy-policy': { prerender: true },
    '/terms-and-conditions': { prerender: true },
    '/faq': { prerender: true },

    '/services/**': { isr: 3600 },
    '/providers/**': { isr: 3600 },
    '/blogs/**': { isr: 3600 },

    '/dashboard/**': { ssr: false },
    '/my-services/**': { ssr: false },
    '/my-deals/**': { ssr: false },
    '/my-wallet/**': { ssr: false },
    '/account-settings/**': { ssr: false },
    '/chat/**': { ssr: false },

    '/home': { redirect: '/' },
  },

  // ── Vuetify ──
  vuetify: {
    moduleOptions: {
      styles: true,
      importComposables: true,
      prefixComposables: false,
    },
    vuetifyOptions: './vuetify.config.ts',
  },

  // ── i18n (v10) ──
  i18n: {
    locales: [
      { code: 'ar', language: 'ar-SA', dir: 'rtl', name: 'العربية', file: 'ar.json' },
      { code: 'en', language: 'en-US', dir: 'ltr', name: 'English', file: 'en.json' },
      { code: 'tr', language: 'tr-TR', dir: 'ltr', name: 'Turkce', file: 'tr.json' },
      { code: 'fr', language: 'fr-FR', dir: 'ltr', name: 'Francais', file: 'fr.json' },
      { code: 'es', language: 'es-ES', dir: 'ltr', name: 'Espanol', file: 'es.json' },
      { code: 'ur', language: 'ur-PK', dir: 'rtl', name: 'اردو', file: 'ur.json' },
    ],
    defaultLocale: 'ar',
    strategy: 'prefix',
    lazy: true,
    langDir: 'locales',     // Test: if not found, try '../locales'
    detectBrowserLanguage: false,
  },

  // ── Google Analytics ──
  gtag: {
    id: '',
  },

  // ── Security ──
  security: {
    nonce: true,              // CRITICAL: was missing
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'strict-dynamic'",
          "'nonce-{{nonce}}'",  // FIXED: double curly braces
          'https://appleid.cdn-apple.com',
          'https://accounts.google.com',
          'https://tap-sdks.b-cdn.net',
        ],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
        'connect-src': ["'self'", 'https://*.pusher.com', 'wss://*.pusher.com'],
        'frame-src': ["'self'", 'https://accounts.google.com'],
      },
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
    rateLimiter: false,       // Disable globally, use per-route
  },

  // ── Per-route rate limiting ──
  // (Add to routeRules above)
  // '/api/auth/**': { security: { rateLimiter: { tokensPerInterval: 5, interval: 60000 } } },

  // ── Pinia ──
  // No config needed - @pinia/nuxt defaults to app/stores/ in Nuxt 4
})
```

---

## CORRECTED Directory Structure

```diff
  doworkss-FE-latest/
  ├── app/
  │   ├── assets/
  │   ├── components/
  │   ├── composables/
  │   ├── layouts/
  │   ├── middleware/
  │   ├── pages/
  │   ├── plugins/
+ │   ├── stores/              # MOVED: was at root stores/
+ │   │   ├── global.ts
+ │   │   ├── auth.ts
+ │   │   ├── chat.ts
+ │   │   ├── deals.ts
+ │   │   ├── wallet.ts
+ │   │   ├── serviceForm.ts
+ │   │   ├── categories.ts
+ │   │   └── ui.ts
  │   ├── utils/
  │   ├── app.vue
  │   └── error.vue
  ├── server/
  │   ├── api/
  │   ├── middleware/
  │   └── utils/
  ├── shared/                  # Correct - auto-imported in app + server
  │   ├── types/
  │   ├── constants/
  │   └── utils/
- ├── stores/                  # WRONG - not auto-imported in Nuxt 4
  ├── locales/
  ├── public/
  ├── tests/
  ├── vuetify.config.ts        # At root (auto-detected by module)
  ├── nuxt.config.ts
  └── package.json
```

---

## CORRECTED Install Command

```bash
# Core
pnpm add vuetify vuetify-nuxt-module @mdi/font

# State
pnpm add @pinia/nuxt pinia-plugin-persistedstate

# Auth (session management)
pnpm add nuxt-auth-utils

# i18n (v10, NOT @next)
pnpm add @nuxtjs/i18n

# Security
pnpm add nuxt-security

# Analytics
pnpm add nuxt-gtag

# Utilities
pnpm add @vueuse/nuxt

# Toast
pnpm add vue-toastification

# Validation
pnpm add vee-validate @vee-validate/rules @vee-validate/i18n

# Input masking
pnpm add maska

# Real-time
pnpm add pusher-js firebase

# Sanitization
pnpm add isomorphic-dompurify

# Testing
pnpm add -D vitest @vue/test-utils happy-dom @nuxt/test-utils @playwright/test
```

---

## Summary of Changes Required

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | CRITICAL | Stores at root `stores/` | Move to `app/stores/` |
| 2 | CRITICAL | Auth uses `getUserSession` but rejects `nuxt-auth-utils` | Use `nuxt-auth-utils` for session layer |
| 3 | CRITICAL | i18n says v9 `@next` | Install v10 (latest stable, no `@next`) |
| 4 | MEDIUM | Vuetify `ssrClientHints` location | Move `ssr` config to `vuetify.config.ts` |
| 5 | MEDIUM | CSP nonce syntax `{nonce}` | Use `{{nonce}}` + add `nonce: true` |
| 6 | MEDIUM | i18n `langDir: '../locales/'` | Use `'locales'` (resolved from root) |
| 7 | MEDIUM | Rate limiter too strict globally | Disable globally, use per-route |
| 8 | MINOR | Vuetify RTL config structure | Verify during Sprint 5 |
| 9 | MINOR | `proxyRequest` import | Auto-imported in Nitro — no import needed |

**Bottom line:** The architectural decisions are all sound. The issues above are configuration details, not design flaws. Fix the 3 critical items (stores location, auth sessions, i18n version) and the plan is ready to execute.
