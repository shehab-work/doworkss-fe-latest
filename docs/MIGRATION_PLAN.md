# Doworkss Migration Execution Plan: Nuxt 2 → Nuxt 4

> **Source repo:** `doworkss_frontend/` (Nuxt 2.15.8, Vue 2, Vuetify 2, Vuex)
> **Target repo:** `doworkss-FE-latest/` (Nuxt 4.4+, Vue 3.5+, Vuetify 3, Pinia)
> **Reference:** `doworkss_frontend/docs/UPGRADE_PART_ONE.md` (architecture decisions, detailed appendices)
> **Created:** 2026-04-08
> **Validated:** 2026-04-09 — See `PLAN_VALIDATION_REPORT.md` for full verification results

---

## Current State of Target Repo

Already in place:
- Nuxt 4.4.2 scaffold with `app/` directory structure
- `@nuxt/eslint`, `@nuxt/fonts`, `@nuxt/hints`, `@nuxt/icon`, `@nuxt/image`, `@nuxt/scripts`
- TypeScript config (reference-based)
- Package manager: `pnpm`

Not yet configured:
- No pages, components, composables, plugins, middleware, layouts, server routes
- No UI framework (Vuetify 3)
- No state management (Pinia)
- No i18n, auth, API layer, or any business logic
- No `.env` or environment configuration
- No CSS/SCSS setup
- No Docker/CI/CD

---

## Phase A: Pre-Migration Cleanup (Sprints 1-4) — In Nuxt 2 Repo

> These changes go into `doworkss_frontend/` and deploy to production. See UPGRADE_PART_ONE.md Sections 3.1-3.7 for full details.

### Sprint 1: Dead Code & Assets (~1.5 weeks)

- [ ] Delete dead components: `NuxtLogo.vue`, `VuetifyLogo.vue`
- [ ] Delete dead plugin: `plugins/auth-interceptor.js`
- [ ] Replace `<vue-plyr>` in `Gallery.vue` with native `<video>`, delete `plugins/vue-plyr.js`
- [ ] Remove dead function in `store/global/actions.js`
- [ ] Remove 4 dead packages: `vue-tel-input`, `vue-pdf`, `@sentry/tracing`, `core-js`
  - Fix broken `core-js` import in `NavDesktop.vue:161` first
- [ ] Delete 95 dead asset files (see UPGRADE_PART_ONE Section 3.4)
- [ ] Remove `console.log`/`console.error` debug statements
- [ ] Verify: `npm run build` passes after each deletion

### Sprint 2: SSR Safety Fixes (~1.5 weeks)

- [ ] Audit all 151 `localStorage`, 100 `window.`, 69 `document.` accesses
- [ ] Categorize each as: already guarded / client-only context / needs fix
- [ ] Fix unguarded SSR-unsafe accesses (wrap in `process.client` or move to `mounted()`)
- [ ] Priority files: `plugins/axios.js:79`, `grid-style.vue`, `NavDesktop.vue`, `home/index.vue`
- [ ] Verify: no SSR errors in dev server after fixes

### Sprint 3: Complex Component Audit (~2 weeks)

- [ ] Audit Messages.vue (3,228 lines): map all Pusher `.bind()` handlers, `$refs` chains, shared state
- [ ] Audit AddDeal.vue (1,446 lines): document form flow, validation, file upload dependencies
- [ ] Audit MainServiceCard.vue (1,145 lines): document currency, favorite, tour dependencies
- [ ] Audit DealDelivery, DealReview, grid/row-style: document shared patterns
- [ ] Audit File Upload system (6 files, 1,286 lines): document all usage locations
- [ ] Output: component decomposition map for each (what splits into what during migration)

### Sprint 4: Mixin & Store Prep (~1 week)

- [ ] Extract utility functions from mixins into `utils/currency.js`, `utils/string.js`
- [ ] Fix empty `catch {}` blocks in `store/chat/actions.js`
- [ ] Standardize store error handling patterns
- [ ] Remove commented-out code blocks

---

## Phase B: Foundation (Sprint 5) — In New Repo

> All work below happens in `doworkss-FE-latest/`. This is the scaffold sprint.

### Step 5.1: Core Dependencies

> **VALIDATED 2026-04-09:** Versions and package names verified against npm registry.

```bash
# UI Framework
pnpm add vuetify vuetify-nuxt-module @mdi/font

# State Management
pnpm add @pinia/nuxt pinia-plugin-persistedstate

# Auth Session Management (sealed cookies)
pnpm add nuxt-auth-utils

# i18n (v10 is latest stable — do NOT use @next)
pnpm add @nuxtjs/i18n

# Security
pnpm add nuxt-security

# Analytics
pnpm add nuxt-gtag

# Utilities
pnpm add @vueuse/nuxt

# Toast Notifications
pnpm add vue-toastification

# Validation
pnpm add vee-validate @vee-validate/rules @vee-validate/i18n

# Input masking
pnpm add maska

# Real-time & messaging (framework-agnostic, keep as-is)
pnpm add pusher-js firebase

# Sanitization
pnpm add isomorphic-dompurify

# Testing
pnpm add -D vitest @vue/test-utils happy-dom @nuxt/test-utils @playwright/test
```

### Step 5.2: Directory Structure

Create the following directory structure inside the repo:

```
doworkss-FE-latest/
├── app/
│   ├── assets/
│   │   ├── scss/
│   │   │   ├── main.scss
│   │   │   ├── _global.scss
│   │   │   ├── _utils.scss
│   │   │   ├── _vuetify-override.scss    # Rewritten for Vuetify 3
│   │   │   └── base/
│   │   │       ├── custom-variables.scss
│   │   │       ├── helper.scss
│   │   │       ├── reset.scss
│   │   │       └── global.scss
│   │   └── images/                       # Consolidated from old assets/images + imgs
│   │       ├── app/
│   │       ├── category/
│   │       ├── chat/
│   │       ├── deals/
│   │       ├── header/
│   │       ├── provider/
│   │       ├── rating/
│   │       └── wallet/
│   ├── components/
│   │   ├── base/                         # Atomic/reusable components
│   │   ├── layout/                       # AppNav, AppFooter, AppSidebar
│   │   ├── feature/                      # Domain-organized
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── deals/
│   │   │   ├── services/
│   │   │   ├── wallet/
│   │   │   ├── blog/
│   │   │   └── home/
│   │   └── shared/                       # Cross-feature components
│   ├── composables/                      # Reusable logic
│   ├── layouts/
│   ├── middleware/
│   ├── pages/
│   ├── plugins/
│   ├── stores/                           # Pinia stores (MUST be inside app/ for Nuxt 4 auto-import)
│   │   ├── global.ts
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── deals.ts
│   │   ├── wallet.ts
│   │   ├── serviceForm.ts
│   │   ├── categories.ts
│   │   └── ui.ts
│   ├── utils/
│   └── app.vue
├── server/
│   ├── api/
│   │   └── auth/
│   ├── middleware/
│   └── utils/
├── shared/                               # Auto-imported in Nuxt 4 (app + server)
│   ├── types/
│   ├── constants/
│   └── utils/
├── locales/                              # i18n translation files
├── public/                               # Static files (was static/)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/                              # Build/deploy scripts
└── docs/                                 # Documentation
```

### Step 5.3: nuxt.config.ts

> **VALIDATED 2026-04-09:** All APIs verified against Nuxt 4.4.2, vuetify-nuxt-module 0.19.5, i18n 10.2.4, nuxt-security 2.5.1

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // ── Modules ──
  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    '@nuxtjs/i18n',            // v10.2.4 (latest stable)
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/scripts',
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxt/hints',
    'nuxt-security',
    'nuxt-gtag',
    '@vueuse/nuxt',
    'nuxt-auth-utils',          // Sealed cookie sessions for auth
  ],

  // ── CSS ──
  css: [
    '@mdi/font/css/materialdesignicons.css',
    '~/assets/scss/main.scss',
  ],

  // ── Runtime Config ──
  runtimeConfig: {
    // Server-only
    privateKey: '',              // NUXT_PRIVATE_KEY
    tapSecretKey: '',            // NUXT_TAP_SECRET_KEY
    session: {
      password: '',              // NUXT_SESSION_PASSWORD (for nuxt-auth-utils sealed cookies)
    },

    public: {
      appEnv: '',                // NUXT_PUBLIC_APP_ENV
      apiBase: '',               // NUXT_PUBLIC_API_BASE
      hostName: '',              // NUXT_PUBLIC_HOST_NAME
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
    // Static pages — prerender at build
    '/about-us': { prerender: true },
    '/privacy-policy': { prerender: true },
    '/terms-and-conditions': { prerender: true },
    '/faq': { prerender: true },

    // ISR for semi-dynamic pages
    '/services/**': { isr: 3600 },
    '/providers/**': { isr: 3600 },
    '/blogs/**': { isr: 3600 },

    // SPA for authenticated pages
    '/dashboard/**': { ssr: false },
    '/my-services/**': { ssr: false },
    '/my-deals/**': { ssr: false },
    '/my-wallet/**': { ssr: false },
    '/account-settings/**': { ssr: false },
    '/chat/**': { ssr: false },

    // Redirects
    '/home': { redirect: '/' },

    // Cache API responses
    '/api/categories': { swr: 86400 },
    '/api/services/popular': { swr: 3600 },
  },

  // ── Vuetify ──
  vuetify: {
    moduleOptions: {
      styles: true,
      importComposables: true,
      prefixComposables: false,
    },
    vuetifyOptions: './vuetify.config.ts',  // Auto-detected at root
  },

  // ── i18n ──
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
    langDir: 'locales',          // Resolved from project root in i18n v10
    detectBrowserLanguage: false,
  },

  // ── Google Analytics ──
  gtag: {
    id: '', // Set via NUXT_PUBLIC_GOOGLE_ANALYTICS_ID
  },

  // ── Security ──
  security: {
    nonce: true,                // Required for CSP nonce support
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'strict-dynamic'",
          "'nonce-{{nonce}}'",  // Double curly braces required
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
    rateLimiter: false,         // Disabled globally — use per-route in routeRules
  },

  // ── Pinia ──
  // No storesDirs config needed — @pinia/nuxt defaults to app/stores/ in Nuxt 4
})
```

### Step 5.4: Vuetify 3 Config

Create `vuetify.config.ts` at project root (auto-detected by vuetify-nuxt-module):

```ts
import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'

export default defineVuetifyConfiguration({
  // SSR viewport hints (replaces device_width store)
  ssr: {
    clientWidth: 1280,
    clientHeight: 720,
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          // Map from old vutifay-variables.scss — audit for actual values
          primary: '#1E88E5',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
        },
      },
    },
  },
  defaults: {
    VBtn: { variant: 'flat' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
  },
  locale: {
    locale: 'ar',
    fallback: 'en',
    rtl: { ar: true, ur: true },
  },
})
```

### Step 5.5: Copy & Adapt Assets

- [ ] Copy `locales/*.json` (6 files) → `locales/`
- [ ] Copy `assets/scss/` → `app/assets/scss/` (rewrite `vutifay-variables.scss` to match Vuetify 3 theme, rewrite `_vuetify-override.scss` for Vuetify 3 selectors)
- [ ] Copy used icons from `assets/icons/` → `app/assets/icons/` (skip 48 dead files)
- [ ] Copy used images from `assets/images/` + `assets/imgs/` → `app/assets/images/` (consolidated, skip duplicates and dead files)
- [ ] Copy used SVGs from `assets/svg/` → `app/assets/svg/` (skip 20 dead files)
- [ ] Copy `static/favicon.ico` → `public/favicon.ico`
- [ ] Copy `static/logo-preview.png` → `public/logo-preview.png`
- [ ] Copy `static/firebase-messaging-sw.js` → `public/firebase-messaging-sw.js` (update to Firebase SDK v11+)
- [ ] Copy `static/sitemap.xsl` → `public/sitemap.xsl` (if exists)
- [ ] Create `public/robots.txt`

### Step 5.6: TypeScript Foundation

Create `shared/types/`:

```ts
// shared/types/auth.ts
export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string | null
  currency: Currency | null
  account_type: 'individual' | 'business'
  is_phone_verified: boolean
  is_email_verified: boolean
}

export interface AuthState {
  user: User | null
  loggedIn: boolean
}

export interface LoginDTO {
  email: string
  password: string
  device_id?: string
}
```

```ts
// shared/types/service.ts
export interface Service {
  id: number
  slug: string
  name: string
  description: string
  category_id: number
  currency_id: number
  status: 'active' | 'draft' | 'pending' | 'closed'
  extra_options: ExtraOption[]
  media: ServiceMedia
}

export interface ServiceListItem {
  id: number
  slug: string
  name: string
  price: number
  thumbnail: string
}
```

```ts
// shared/types/api.ts
export interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

export interface ApiError {
  error: true
  details: unknown
  status: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
```

(See UPGRADE_PART_ONE Section 6.2 for full type definitions — also add `Deal`, `Currency`, `Category`, `Blog`, `Notification` types)

### Step 5.7: Create .env.example

```env
# App
NUXT_PUBLIC_APP_ENV=development
NUXT_PUBLIC_API_BASE=https://api.doworkss.com
NUXT_PUBLIC_HOST_NAME=https://doworkss.com

# Auth (server-only)
NUXT_PRIVATE_KEY=
NUXT_SESSION_PASSWORD=          # Min 32 chars, for nuxt-auth-utils sealed cookies

# Payment
NUXT_PUBLIC_TAP_PUBLIC_KEY=
NUXT_PUBLIC_TAP_MERCHANT_ID=
NUXT_PUBLIC_TAP_ENVIRONMENT=
NUXT_TAP_SECRET_KEY=

# Real-time
NUXT_PUBLIC_PUSHER_APP_KEY=
NUXT_PUBLIC_PUSHER_CLUSTER=

# Firebase (FCM only)
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=
NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NUXT_PUBLIC_FIREBASE_FCM_VAPID_KEY=

# Monitoring
NUXT_PUBLIC_SENTRY_DSN=

# SEO
NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=

# Social Login
NUXT_PUBLIC_GOOGLE_CLIENT_ID=
NUXT_PUBLIC_APPLE_CLIENT_ID=
NUXT_PUBLIC_APPLE_REDIRECT_URI=
```

### Step 5.8: Testing Setup

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.{test,spec}.{ts,js}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['app/composables/**', 'shared/utils/**', 'app/stores/**'],
    },
    setupFiles: ['tests/setup.ts'],
  },
})
```

### Step 5.9: Verify Foundation

- [ ] `pnpm dev` starts without errors
- [ ] Vuetify 3 renders a basic page with RTL support
- [ ] i18n switches between ar/en correctly
- [ ] `useRuntimeConfig()` reads env vars
- [ ] `pnpm test` runs (even with zero tests)

---

## Phase C: Core Infrastructure (Sprints 6-7)

### Sprint 6: Auth + API + i18n + Toast (~2 weeks)

This is the most critical sprint. Auth is the highest-risk migration area.

#### 6.1: Nitro API Proxy Routes

Create server routes that proxy to the backend, adding `PRIVATE_KEY` server-side only:

```
server/
├── api/
│   ├── auth/
│   │   ├── login.post.ts        # Proxy POST /login → backend
│   │   ├── logout.post.ts       # Proxy POST /logout → backend
│   │   ├── refresh.post.ts      # Proxy POST /refresh-token → backend
│   │   ├── user.get.ts          # Proxy GET /user-information → backend
│   │   ├── register.post.ts
│   │   ├── verify-email.post.ts
│   │   ├── verify-phone.post.ts
│   │   ├── forgot-password.post.ts
│   │   └── set-password.post.ts
│   └── proxy/
│       └── [...path].ts         # Catch-all proxy for other API endpoints
├── middleware/
│   ├── auth.ts                  # SSR token validation + refresh
│   └── security.ts              # X-Robots-Tag for non-prod
└── utils/
    ├── session.ts               # Sealed session helpers
    └── jwt.ts                   # Token decode/expiry check
```

**Catch-all proxy** (`server/api/proxy/[...path].ts`):

```ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const path = getRouterParam(event, 'path') || ''
  const session = event.context.auth

  return proxyRequest(event, `${config.public.apiBase}/${path}`, {
    headers: {
      'private-key': config.privateKey,
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    },
  })
})
```

#### 6.2: useAuth Composable

```
app/composables/useAuth.ts
```

Must implement:
- `user` (reactive User | null)
- `loggedIn` (computed boolean)
- `login(credentials)` → calls `/api/auth/login`, stores session
- `logout()` → calls `/api/auth/logout`, clears session
- `refreshToken()` → calls `/api/auth/refresh`
- SSR hydration: reads from `event.context.auth` on server, hydrates to client
- Token refresh on 401 via `onResponseError` interceptor

**Testing requirement:** Write integration tests for login → refresh → logout flow before moving to page migration.

#### 6.3: useApi Composable

```
app/composables/useApi.ts
```

Must implement:
- `request<T>(url, options)` — wraps `$fetch` with common headers
- `showToast` option per-call (replaces localStorage toast pattern)
- Automatic `content-language` and `currency` headers
- Error handling: 403→error, 406→verify-email, 412→verify-phone, 431→upgrade modal, 302→2FA, 429→toast, 404/500→error

#### 6.4: i18n-Vuetify RTL Sync Plugin

```
app/plugins/i18n-vuetify-sync.ts
```

Watches locale changes, syncs Vuetify's RTL mode and current locale. Replaces the old `onBeforeLanguageSwitch` callback.

#### 6.5: Toast Plugin Setup

Configure `vue-toastification` v2 with RTL support. Create `useToast` wrapper if needed.

#### 6.6: Sprint 6 Verification

- [ ] Login with real credentials on staging
- [ ] Token refresh works (wait for expiry or force)
- [ ] Logout clears session
- [ ] API calls include correct headers
- [ ] Toast shows on API errors when `showToast: true`
- [ ] Locale switching toggles RTL/LTR correctly
- [ ] SSR renders with correct auth state (no hydration mismatch)

---

### Sprint 7: Stores + Plugins + File Upload (~2 weeks)

#### 7.1: Pinia Stores

Create 8 stores from 21 Vuex modules (see UPGRADE_PART_ONE Section 7.1):

| New Store | Replaces | Key State |
|-----------|----------|-----------|
| `app/stores/global.ts` | `store/global/` | currencies, countries, modals, support |
| `app/stores/auth.ts` | `store/user/` | user profile data (works with `useAuth`) |
| `app/stores/chat.ts` | `store/chat/` | conversations, messages, unread |
| `app/stores/deals.ts` | `store/deals/` | deal preview, extras, stepper |
| `app/stores/wallet.ts` | `store/wallet/` | balance, cards, bank accounts |
| `app/stores/serviceForm.ts` | `store/update_service/` + `store/my_services/` | service creation/edit wizard |
| `app/stores/categories.ts` | `store/all_categories/` | category tree (cached) |
| `app/stores/ui.ts` | `store/filter_header/` + `store/mobile_menu/` + `store/search_menu/` | UI toggles |

Stores NOT created (replaced by composables/local state):
- `store/ads/` → `useState('showAds', () => false)`
- `store/blog_tags/` → fetch on demand with `useFetch`
- `store/device_id/` → `useDeviceId` composable
- `store/device_width/` → CSS media queries + `useDisplay()`
- `store/faq/` → fetch on demand
- `store/login_form/` → local component state
- `store/registration/` → local component state
- `store/social_media/` → local component state
- `store/verify/` → local component state
- `store/plan/` → can be a store if needed, or fetch on demand

#### 7.2: Firebase/FCM Plugin

```
app/plugins/fcm.client.ts
app/composables/useFcm.ts
```

- Initialize Firebase app with SDK v11+
- Request notification permission
- Get FCM token and sync with backend on login/logout
- Handle foreground messages

#### 7.3: Pusher Plugin

```
app/plugins/pusher.client.ts
app/composables/usePusher.ts
```

- Initialize Pusher with `runtimeConfig` credentials
- Provide channel subscription/unsubscription
- Handle reconnection

#### 7.4: Sentry Setup

```bash
pnpm add @sentry/nuxt
```

Configure in `nuxt.config.ts` with the same `beforeSend` filter for FCM permission noise.

#### 7.5: Middleware

```
app/middleware/auth.ts          # Redirect unauthenticated users
app/middleware/guest.ts         # Redirect authenticated users (replaces user.js)
app/middleware/phone-verified.ts # Check phone verification (replaces is_phone_verified.js)
```

#### 7.6: Cross-Tab Auth Sync

```
app/plugins/broadcast-auth.client.ts
```

Uses `BroadcastChannel` to sync login/logout across browser tabs.

#### 7.7: File Upload System (New Architecture)

Build from scratch (see UPGRADE_PART_ONE Section 3.3.7):

```
app/composables/useFileUpload.ts
app/composables/useFileValidation.ts
app/components/base/BaseFilePicker.vue
app/components/base/BaseFilePreview.vue
app/components/base/BaseFileList.vue
app/components/base/BaseDeleteConfirm.vue
shared/utils/fileHelpers.ts
```

#### 7.8: Shared Utility Functions

Migrate pure functions from mixins (see UPGRADE_PART_ONE Appendix B):

```
shared/utils/currency.ts       # from global_user_currency, fixed_currency_format, price_exchange
shared/utils/string.ts          # from string_truncate, remove_html_tags_string, user_initials
shared/utils/phone.ts           # from clean_phone
shared/utils/validation.ts      # custom validation helpers
shared/utils/date.ts            # from currency_date_format
```

#### 7.9: Composables from Mixins

```
app/composables/useCurrency.ts        # currency formatting + exchange
app/composables/useFavorite.ts         # toggle favorite (needs auth + API)
app/composables/useFilter.ts           # filter state + URL sync
app/composables/useSocialAuth.ts       # Google + Apple login
app/composables/useCountdown.ts        # OTP timer
app/composables/useInfiniteScroll.ts   # IntersectionObserver (or use @vueuse)
app/composables/useDirection.ts        # RTL/LTR detection
app/composables/useNotifications.ts    # notification formatting
```

#### 7.10: vee-validate 4 Plugin

```
app/plugins/vee-validate.ts
```

Register rules with `defineRule`, configure i18n with `@vee-validate/i18n`.

#### 7.11: Sprint 7 Verification

- [ ] All Pinia stores initialize correctly
- [ ] FCM notification permission flow works
- [ ] Pusher connects and receives test events
- [ ] Sentry captures errors
- [ ] Middleware redirects work (auth, guest, phone-verified)
- [ ] Cross-tab sync: login in tab A updates tab B
- [ ] File upload component renders, validates, shows progress
- [ ] All utility functions have unit tests

---

## Phase D: Page Migration (Sprints 8-12)

> For EVERY page migrated, follow the checklist in UPGRADE_PART_ONE Appendix F.
> Key transformations for every file:
> - `_slug` → `[slug]`, `_id` → `[id]` in file names
> - Options API → `<script setup lang="ts">`
> - `asyncData` → `useAsyncData()` / `useFetch()`
> - `this.$store` → Pinia store composables
> - `this.$request` → `useApi().request()`
> - `this.$auth` → `useAuth()`
> - `this.$t()` → `$t()` in template, `useI18n().t()` in script
> - `this.$router` → `useRouter()`
> - Vuetify 2 components → Vuetify 3 API (see Appendix A)
> - `v-if="getIsMobile"` → CSS `d-none d-md-block`
> - `process.client` → `import.meta.client`
> - `localStorage.*` → `useCookie()` or `useState()`
> - `head()` → `useHead()` / `useSeoMeta()`
> - `::v-deep` → `:deep()`
> - `this.$set` → direct assignment
> - `.native` modifier → remove

### Sprint 8: Home + Auth + Layouts + Error (~2 weeks)

#### Layouts (do first — everything depends on these)

| Old | New | Notes |
|-----|-----|-------|
| `layouts/default.vue` | `app/layouts/default.vue` | Merge desktop/mobile nav into single responsive layout |
| `layouts/auth.vue` | `app/layouts/auth.vue` | |
| `layouts/dashboard.vue` | `app/layouts/dashboard.vue` | Merge DesktopAside/MobileAside → single responsive sidebar |
| `layouts/chat.vue` | `app/layouts/chat.vue` | |
| `layouts/editBlog.vue` | `app/layouts/edit-blog.vue` | |
| `layouts/error.vue` | `app/error.vue` | Nuxt 4: error page is `app/error.vue`, not a layout |

#### Layout Components (merge desktop/mobile pairs)

| Old Pair | New Single Component |
|----------|---------------------|
| `NavDesktop.vue` + `NavMobile.vue` | `components/layout/AppNav.vue` |
| `DesktopAside.vue` + `MobileAside.vue` | `components/layout/DashboardSidebar.vue` |
| `DesktopUserMenu.vue` + `MobileMenu.vue` | `components/layout/UserMenu.vue` |
| `SearchBar.vue` + `MobileSearchMenu.vue` | `components/layout/SearchBar.vue` |
| `LanguageSwitcher.vue` + `MobileLanguageMenu.vue` | `components/layout/LanguageSwitcher.vue` |
| `UserCurrencyWrapper.vue` + `MobileCurrency.vue` | `components/layout/CurrencySwitcher.vue` |
| `NotificationsMenuDesktop.vue` | `components/layout/NotificationsMenu.vue` |
| `CustomFooter.vue` | `components/layout/AppFooter.vue` |

#### Home Page

| Old | New |
|-----|-----|
| `pages/home/index.vue` (571 lines) | `app/pages/index.vue` |
| + 15 sub-components in `components/pages/home/` | `app/components/feature/home/` |

#### Auth Pages

| Old | New |
|-----|-----|
| `pages/auth/login.vue` | `app/pages/auth/login.vue` |
| `pages/auth/sign-up.vue` (440 lines) | `app/pages/auth/sign-up.vue` |
| `pages/auth/forgot-password.vue` | `app/pages/auth/forgot-password.vue` |
| `pages/auth/forgot-email.vue` | `app/pages/auth/forgot-email.vue` |
| `pages/auth/set-new-password.vue` | `app/pages/auth/set-new-password.vue` |
| `pages/auth/register-otp.vue` | `app/pages/auth/register-otp.vue` |
| `pages/auth/verify-email.vue` | `app/pages/auth/verify-email.vue` |
| `pages/auth/verify-phone-number.vue` | `app/pages/auth/verify-phone-number.vue` |
| `pages/auth/two-factor-authentication.vue` (446 lines) | `app/pages/auth/two-factor-authentication.vue` |
| `pages/otp-confirmation/index.vue` (733 lines) | `app/pages/otp-confirmation/index.vue` |
| `pages/two-step-verification/index.vue` (436 lines) | `app/pages/two-step-verification/index.vue` |

#### Static Pages

| Old | New |
|-----|-----|
| `pages/about-us/index.vue` | `app/pages/about-us/index.vue` |
| `pages/faq/index.vue` | `app/pages/faq/index.vue` |
| `pages/privacy-policy/index.vue` | `app/pages/privacy-policy/index.vue` |
| `pages/terms-and-conditions/index.vue` | `app/pages/terms-and-conditions/index.vue` |
| `pages/our-platforms/index.vue` | `app/pages/our-platforms/index.vue` |

#### Sprint 8 Verification

- [ ] Home page renders with all sections, RTL/LTR
- [ ] Login → dashboard redirect works
- [ ] Registration flow completes
- [ ] OTP verification works
- [ ] Password reset flow works
- [ ] Layouts render correctly (default, auth, dashboard)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] SEO meta tags correct (compare with Nuxt 2)
- [ ] No hydration mismatches in console

---

### Sprint 9: Services + Providers + Categories (~2 weeks)

| Old | New | Complexity |
|-----|-----|------------|
| `pages/services/_slug.vue` (1,267 lines) | `app/pages/services/[slug].vue` | High — decompose into sub-components |
| `pages/category/_slug.vue` | `app/pages/category/[slug].vue` | Medium — merge HeaderDesktop/Mobile |
| `pages/providers/index.vue` | `app/pages/providers/index.vue` | Medium |
| `pages/provider/_slug.vue` (717 lines) | `app/pages/provider/[slug].vue` | Medium |
| `pages/add-service/index.vue` | `app/pages/add-service/index.vue` | High — multi-step wizard |
| `pages/edit-service/_id.vue` | `app/pages/edit-service/[id].vue` | High — reuses add-service components |
| `pages/mark-service/_id.vue` (1,267 lines) | `app/pages/mark-service/[id].vue` | High |

Components to create:
- `components/shared/ServiceCard.vue` (from MainServiceCard 1,145 lines — decompose)
- `components/shared/ServiceGridCard.vue` + `ServiceRowCard.vue` (from grid-style + row-style)
- `components/feature/services/ServiceFormWizard.vue` + sub-components
- `components/shared/ProviderCard.vue`
- `components/feature/category/` components
- `composables/useServiceList.ts`
- `composables/useServiceForm.ts`

---

### Sprint 10: Chat + Blog + Plans (~2 weeks)

| Old | New | Complexity |
|-----|-----|------------|
| `pages/chat/index.vue` + `_id.vue` | `app/pages/chat/index.vue` + `[id].vue` | Very High — Messages.vue 3,228 lines |
| `pages/blogs/index.vue` | `app/pages/blogs/index.vue` | Low |
| `pages/blog/_slug.vue` (439 lines) | `app/pages/blog/[slug].vue` | Medium |
| `pages/add-blog/index.vue` | `app/pages/add-blog/index.vue` | Medium — TipTap editor |
| `pages/edit-blog/_slug.vue` (473 lines) | `app/pages/edit-blog/[slug].vue` | Medium |
| `pages/plans/index.vue` (1,248 lines) | `app/pages/plans/index.vue` | Medium |
| `pages/my-subscription/index.vue` | `app/pages/my-subscription/index.vue` | Low |

This sprint is dominated by the chat system redesign:
- `composables/useChat.ts` — Pusher connection, message CRUD
- `composables/useChatPresence.ts` — online/offline, tab tracking
- `composables/useChatAudio.ts` — wavesurfer integration
- `components/feature/chat/ChatPage.vue` (container)
- `components/feature/chat/ChatHeader.vue`
- `components/feature/chat/ChatMessageList.vue`
- `components/feature/chat/ChatComposer.vue`
- `components/feature/chat/ChatAudioRecorder.vue`
- `components/feature/chat/ChatDealCard.vue`
- `components/feature/chat/ChatRatingCard.vue`
- `components/feature/chat/ChatPhoto.vue`

Also install TipTap for blog editor:
```bash
pnpm add @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
```

---

### Sprint 11: Dashboard + Deals (~2 weeks)

| Old | New | Complexity |
|-----|-----|------------|
| `pages/dashboard/index.vue` (565 lines) | `app/pages/dashboard/index.vue` | Medium |
| `pages/deals/index.vue` (599 lines) | `app/pages/deals/index.vue` | Medium |
| `pages/deals/index/index.vue` | `app/pages/deals/index/index.vue` | Medium |
| `pages/deals/index/add-deal/index.vue` | `app/pages/deals/index/add-deal/index.vue` | High |
| `pages/deals/index/_deal_id/index.vue` | `app/pages/deals/index/[deal_id]/index.vue` | Medium |
| `pages/deals/index/_deal_id/edit.vue` | `app/pages/deals/index/[deal_id]/edit.vue` | Medium |
| `pages/deals/index/_deal_id/payment.vue` (949 lines) | `app/pages/deals/index/[deal_id]/payment.vue` | High |
| `pages/deals/index/_deal_id/implementation/index.vue` (410 lines) | `app/pages/deals/index/[deal_id]/implementation/index.vue` | Medium |
| `pages/deals/index/_deal_id/add-delivers.vue` (547 lines) | `app/pages/deals/index/[deal_id]/add-delivers.vue` | High |
| `pages/my-deals/_type.vue` (704 lines) | `app/pages/my-deals/[type].vue` | Medium |
| `pages/my-articles/_status.vue` | `app/pages/my-articles/[status].vue` | Low |

Deal components to create (decomposed from large originals):
- `composables/useDealForm.ts`
- `composables/useDealDelivery.ts`
- `composables/usePayment.ts` (Tap SDK integration)
- `components/feature/deals/` — DealFormPage, DealCard, DealReview, DealDelivery, etc.

---

### Sprint 12: Profile + Wallet + Remaining (~2 weeks)

| Old | New | Complexity |
|-----|-----|------------|
| `pages/my-profile/index.vue` (1,269 lines) | `app/pages/my-profile/index.vue` | High |
| `pages/my-profile/change-email/index.vue` | `app/pages/my-profile/change-email/index.vue` | Low |
| `pages/my-profile/change-phone-number/index.vue` | `app/pages/my-profile/change-phone-number/index.vue` | Low |
| `pages/my-profile/delete-account/index.vue` | `app/pages/my-profile/delete-account/index.vue` | Low |
| `pages/account-settings/index.vue` | `app/pages/account-settings/index.vue` | Medium |
| `pages/my-wallet/index.vue` (448 lines) | `app/pages/my-wallet/index.vue` | Medium |
| `pages/top-up-wallet/index.vue` (596 lines) | `app/pages/top-up-wallet/index.vue` | Medium |
| `pages/withdraw/index.vue` (1,351 lines) | `app/pages/withdraw/index.vue` | High |
| `pages/payment-by-card/index.vue` (404 lines) | `app/pages/payment-by-card/index.vue` | Medium |
| `pages/payment-methods/index.vue` | `app/pages/payment-methods/index.vue` | Medium |
| `pages/retrieve-charge/index.vue` | `app/pages/retrieve-charge/index.vue` | Low |
| `pages/retrieve-mobile-charge/index.vue` | `app/pages/retrieve-mobile-charge/index.vue` | Low |
| `pages/my-services/_type.vue` (1,248 lines) | `app/pages/my-services/[type].vue` | High |
| `pages/my-qr-code/index.vue` | `app/pages/my-qr-code/index.vue` | Low |
| `pages/notifications/index.vue` | `app/pages/notifications/index.vue` | Low |
| `pages/favorite/index.vue` | `app/pages/favorite/index.vue` | Low |
| `pages/my-network/followers/index.vue` | `app/pages/my-network/followers/index.vue` | Low |
| `pages/my-network/following/index.vue` | `app/pages/my-network/following/index.vue` | Low |
| `pages/suggestions/index.vue` | `app/pages/suggestions/index.vue` | Low |
| `pages/app-rating/index.vue` | `app/pages/app-rating/index.vue` | Low |
| `pages/user/_id.vue` | `app/pages/user/[id].vue` | Low |
| `pages/siteMap/index.vue` | `app/pages/sitemap/index.vue` | Low |

Wallet/Payment components:
- `composables/usePayment.ts` (if not created in Sprint 11)
- `components/feature/wallet/PaymentCardForm.vue`
- `components/feature/wallet/BankAccountForm.vue`
- `components/feature/wallet/PaymentMethodSelector.vue`

---

## Phase E: Quality & Cutover (Sprints 13-14)

### Sprint 13: Testing + Performance + Security (~2 weeks)

#### Testing

- [ ] Unit tests for all `shared/utils/` functions
- [ ] Integration tests for `useAuth`, `useApi`, `useCurrency`
- [ ] Integration tests for critical Pinia stores (chat, deals, wallet)
- [ ] Playwright E2E tests for:
  - Auth flow (login → dashboard → logout)
  - Service creation wizard
  - Deal creation → payment
  - Chat message send/receive
  - Wallet top-up
- [ ] Coverage target: 60% statements, 50% branches

#### Performance Audit

- [ ] Run Lighthouse on all key pages
- [ ] Targets: LCP < 2.5s, CLS < 0.1, Total JS < 300KB gzipped
- [ ] Verify Vuetify tree-shaking working (check bundle analyzer)
- [ ] Verify `@nuxt/fonts` self-hosting (no external font requests)
- [ ] Verify `@nuxt/scripts` loading 3rd-party scripts non-blocking
- [ ] Verify `@nuxt/image` generating WebP/AVIF

#### Security Audit

- [ ] `PRIVATE_KEY` NOT in any client-side request (verify via DevTools Network)
- [ ] CSP headers present (verify via DevTools Security)
- [ ] CSRF protection on state-changing endpoints
- [ ] No `v-html` without DOMPurify sanitization
- [ ] `npm audit` passes
- [ ] X-Robots-Tag: noindex on non-production

### Sprint 14: Staging QA + Cutover (~2 weeks)

- [ ] Deploy to staging environment
- [ ] Full QA pass comparing every page against Nuxt 2 production
- [ ] Test all 6 locales (ar, en, tr, fr, es, ur)
- [ ] Test RTL rendering in Arabic + Urdu
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Test auth edge cases (expired token, network loss, multi-tab)
- [ ] Test payment flows with test cards
- [ ] Fix all regressions found
- [ ] Production cutover: switch DNS/deployment from Nuxt 2 to Nuxt 4
- [ ] Post-cutover monitoring: Sentry, performance, user feedback
- [ ] Keep Nuxt 2 deployment as rollback for 1 week

---

## Quick Reference: Nuxt 2 → 4 Translation Table

| Nuxt 2 Pattern | Nuxt 4 Equivalent |
|----------------|-------------------|
| `asyncData({ store, params, redirect })` | `useAsyncData()` in `<script setup>` |
| `fetch()` lifecycle | `useFetch()` or `onMounted` + `$fetch` |
| `this.$request(args)` | `useApi().request(url, opts)` |
| `this.$store.dispatch('mod/action')` | `const store = useModStore(); store.action()` |
| `this.$store.getters['mod/getter']` | `storeToRefs(useModStore()).getter` |
| `this.$auth.user` | `useAuth().user.value` |
| `this.$auth.loggedIn` | `useAuth().loggedIn.value` |
| `this.$auth.loginWith('local', ...)` | `useAuth().login(credentials)` |
| `this.$auth.logout()` | `useAuth().logout()` |
| `this.$t('key')` | `$t('key')` in template, `useI18n().t('key')` in script |
| `this.$router.push(path)` | `navigateTo(path)` or `useRouter().push(path)` |
| `this.$route.params.slug` | `useRoute().params.slug` |
| `app.localePath('/path')` | `useLocalePath()('/path')` |
| `this.$alert({ msg, type })` | `useToast().success(msg)` |
| `this.$dir()` | `useDirection().dir.value` |
| `this.$nuxt.$emit('event')` | Pinia store action or `emit()` |
| `this.$nuxt.refresh()` | `refreshNuxtData()` |
| `this.$set(obj, key, val)` | `obj[key] = val` (Proxy-based reactivity) |
| `this.$refs.name` | `useTemplateRef('name')` |
| `head() { return {...} }` | `useSeoMeta({...})` or `useHead({...})` |
| `layout: 'name'` | `definePageMeta({ layout: 'name' })` |
| `middleware: 'auth'` | `definePageMeta({ middleware: ['auth'] })` |
| `process.client` | `import.meta.client` |
| `process.server` | `import.meta.server` |
| `::v-deep .class` | `:deep(.class)` |
| `@click.native` | `@click` (`.native` removed) |
| `$store.getters['device_width/getIsMobile']` | CSS `d-none d-md-block` or `useDisplay()` |
| `localStorage.setItem('toast', 'true')` | `request(url, { showToast: true })` |
| `require('~/assets/...')` | `import` or dynamic `import()` |

---

## Recommended Starting Order

If you're starting now, here's what to do **today**:

1. **Phase A is optional but recommended** — cleaning the Nuxt 2 repo makes the migration smoother but isn't blocking. You can start Phase B in parallel.

2. **Start with Phase B (Sprint 5)** in the new repo:
   - Install dependencies (Step 5.1)
   - Create directory structure (Step 5.2)
   - Configure `nuxt.config.ts` (Step 5.3)
   - Set up Vuetify 3 config (Step 5.4)
   - Copy assets and locales (Step 5.5)
   - Create `.env.example` and `.env` (Step 5.7)
   - Verify `pnpm dev` works

3. **Then Sprint 6** (auth + API) — this is the foundation everything else depends on.

4. **Then Sprint 7** (stores + plugins) — parallel work possible if multiple devs.

5. **Then Sprints 8-12** page-by-page, starting with home and auth.

---

## Risk Mitigation Summary

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Auth regression | High | Critical | Test auth composable exhaustively before page migration |
| Vuetify 3 visual differences | High | Medium | Visual comparison against Nuxt 2 for every page |
| SSR hydration mismatches | Medium | Medium | Check console on every page, use `import.meta.client` guards |
| Performance regression | Medium | Medium | Lighthouse on every sprint, bundle size monitoring |
| i18n/RTL breakage | Medium | High | Test all 6 locales, especially ar/ur RTL |
| Payment flow breakage | Low | Critical | E2E tests with Tap test cards, staging verification |
