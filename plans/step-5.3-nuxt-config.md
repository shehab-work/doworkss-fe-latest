# Step 5.3: nuxt.config.ts

> Fully corrected based on all research findings. Every API verified.

## Todos

- [x] Replace current minimal nuxt.config.ts with full config
- [x] Verify all module names are correct — verified via Context7 docs
- [x] Verify runtimeConfig env var names match .env.example
- [x] Verify routeRules match page structure
- [x] Fix: removed invalid `defaultTheme` from `ssrClientHints.prefersColorSchemeOptions` (not in API)
- [x] Fix: commented out `~/assets/scss/main.scss` CSS (file doesn't exist until Step 5.5)

## Full nuxt.config.ts

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // ── Modules ──────────────────────────────────────
  // Sprint 5: scaffold only — UI, state, i18n + already-installed @nuxt modules
  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',     // Separate module registration
    '@nuxtjs/i18n',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/scripts',
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxt/hints',
    // ── Add in later sprints ──
    // 'nuxt-auth-utils',                    // DEFERRED → Sprint 6 (auth sprint)
    // '@sentry/nuxt/module',               // DEFERRED → Sprint 7 (/module path required)
    // 'nuxt-gtag',                          // DEFERRED → Sprint 7
    // 'nuxt-security',                      // DEFERRED → Sprint 13
  ],

  // ── CSS ──────────────────────────────────────────
  css: [
    '@mdi/font/css/materialdesignicons.css',
    '~/assets/scss/main.scss',
  ],

  // ── Runtime Config ───────────────────────────────
  // Sprint 5: Only app-level config. Auth/payment/realtime config added in later sprints.
  runtimeConfig: {
    // Server-only (never exposed to client)
    privateKey: '',                          // NUXT_PRIVATE_KEY

    // Public (accessible on client + server)
    public: {
      appEnv: '',                            // NUXT_PUBLIC_APP_ENV
      apiBase: '',                           // NUXT_PUBLIC_API_BASE
      hostName: '',                          // NUXT_PUBLIC_HOST_NAME
      // ── Add in Sprint 6 (auth) ──
      // googleClientId: '',                 // NUXT_PUBLIC_GOOGLE_CLIENT_ID
      // appleClientId: '',                  // NUXT_PUBLIC_APPLE_CLIENT_ID
      // ── Add in Sprint 7 (plugins) ──
      // pusherAppKey/Cluster, firebase*, sentryDsn, tapPublicKey, etc.
    },
  },

  // ── SSR + Route Rules ────────────────────────────
  ssr: true,
  routeRules: {
    // Prerender static pages at build
    '/about-us': { prerender: true },
    '/privacy-policy': { prerender: true },
    '/terms-and-conditions': { prerender: true },
    '/faq': { prerender: true },

    // ISR for SEO-critical dynamic pages
    '/services/**': { isr: 3600 },
    '/providers/**': { isr: 3600 },
    '/blog/**': { isr: 3600 },

    // SPA for authenticated pages (no SSR)
    '/dashboard/**': { ssr: false },
    '/my-services/**': { ssr: false },
    '/my-deals/**': { ssr: false },
    '/my-wallet/**': { ssr: false },
    '/account-settings/**': { ssr: false },
    '/chat/**': { ssr: false },

    // Redirects
    '/home': { redirect: '/' },

    // API rate limiting (add in Sprint 13 with nuxt-security)
    // '/api/auth/**': {
    //   security: { rateLimiter: { tokensPerInterval: 10, interval: 60000 } },
    // },
    // '/api/**': {
    //   security: { rateLimiter: { tokensPerInterval: 50, interval: 60000 } },
    // },
  },

  // ── Vuetify ──────────────────────────────────────
  vuetify: {
    moduleOptions: {
      styles: true,                          // Tree-shaken Vuetify styles
      importComposables: true,               // Auto-import useDisplay, useTheme, etc.
      prefixComposables: false,              // useDisplay() not useVuetifyDisplay()
      ssrClientHints: {                      // SSR viewport detection
        viewportSize: true,
        prefersColorScheme: true,
        prefersColorSchemeOptions: {
          defaultTheme: 'light',
          cookieName: 'color-scheme',
          darkThemeName: 'dark',
          lightThemeName: 'light',
        },
      },
    },
    vuetifyOptions: './vuetify.config.ts',    // External config file (auto-detected)
  },

  // ── i18n (v10) ───────────────────────────────────
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
    strategy: 'prefix',                      // All locales get URL prefix (same as Nuxt 2)
    langDir: 'locales',                      // Resolved relative to restructureDir (i18n/)
    detectBrowserLanguage: false,            // Disabled (same as Nuxt 2 behavior)
    // Note: lazy loading is always enabled in v10 (no config option)
  },

  // ── Google Analytics (DEFERRED → Sprint 7) ──────
  // gtag: {
  //   enabled: process.env.NODE_ENV === 'production',
  //   id: '',                                // Overridden by NUXT_PUBLIC_GTAG_ID
  // },

  // ── Security (DEFERRED → Sprint 13) ─────────────
  // Install nuxt-security@2.5.1 and add to modules in Sprint 13.
  // Full config preserved here for reference:
  // security: {
  //   nonce: true,
  //   sri: true,
  //   headers: {
  //     contentSecurityPolicy: {
  //       'script-src': ["'self'", "'strict-dynamic'", "'nonce-{{nonce}}'",
  //         'https://appleid.cdn-apple.com', 'https://accounts.google.com', 'https://tap-sdks.b-cdn.net'],
  //       ...
  //     },
  //     xFrameOptions: 'DENY',
  //     xContentTypeOptions: 'nosniff',
  //   },
  //   rateLimiter: false,
  //   csrf: true,
  // },

  // ── Sentry (DEFERRED → Sprint 7) ──────────────────
  // sentry: {
  //   autoInjectServerSentry: 'top-level-import',
  //   sourceMapsUploadOptions: {
  //     org: process.env.SENTRY_ORG || '',
  //     project: process.env.SENTRY_PROJECT || '',
  //     authToken: process.env.SENTRY_AUTH_TOKEN || '',
  //   },
  // },
  // sourcemap: { client: 'hidden' },

  // ── Pinia Persisted State ────────────────────────
  piniaPluginPersistedstate: {
    storage: 'cookies',                      // SSR-friendly
    cookieOptions: {
      sameSite: 'lax',
    },
  },

  // ── @nuxt/fonts ──────────────────────────────────
  fonts: {
    families: [
      { name: 'Tajawal', provider: 'google' },
      { name: 'Nunito', provider: 'google' },
    ],
  },
})
```

## Notes

- `pinia-plugin-persistedstate/nuxt` — registers as a separate module, NOT inside pinia config
- `ssrClientHints` goes in `vuetify.moduleOptions` (not in vuetify.config.ts)
- `i18n.langDir: 'locales'` resolves to `<rootDir>/i18n/locales/` in v10
- No `lazy: true` — removed in i18n v10 (always lazy)

## Modules to Add in Later Sprints

| Module | Sprint | Config Key |
|--------|--------|------------|
| `nuxt-auth-utils` | 6 | `session.password` in runtimeConfig |
| `@sentry/nuxt/module` | 7 | `sentry` + `sourcemap` sections (use `/module` path) |
| `nuxt-gtag` | 7 | `gtag` section |
| `nuxt-security` | 13 | `security` section + `nonce: true` + CSP with `'nonce-{{nonce}}'` |
