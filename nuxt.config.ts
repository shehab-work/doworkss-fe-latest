// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // ── Modules ──────────────────────────────────────
  // Sprint 5: scaffold only — UI, state, i18n + already-installed @nuxt modules
  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/scripts',
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxt/hints',
    // ── Add in later sprints ──
    // 'nuxt-auth-utils',                    // Sprint 6
    // '@sentry/nuxt/module',                // Sprint 7 (/module path required)
    // 'nuxt-gtag',                          // Sprint 7
    // 'nuxt-security',                      // Sprint 13
  ],

  // ── CSS ──────────────────────────────────────────
  css: [
    '@mdi/font/css/materialdesignicons.css',
    // '~/assets/scss/main.scss',            // Sprint 5.5: uncomment after copying SCSS
  ],

  // ── Runtime Config ───────────────────────────────
  runtimeConfig: {
    // Server-only (never exposed to client)
    privateKey: '',                          // NUXT_PRIVATE_KEY

    public: {
      appEnv: '',                            // NUXT_PUBLIC_APP_ENV
      apiBase: '',                           // NUXT_PUBLIC_API_BASE
      hostName: '',                          // NUXT_PUBLIC_HOST_NAME
    },
  },

  // ── SSR + Route Rules ────────────────────────────
  ssr: true,
  routeRules: {
    // Prerender static pages at build — uncomment when pages exist (Sprint 8+)
    // '/about-us': { prerender: true },
    // '/privacy-policy': { prerender: true },
    // '/terms-and-conditions': { prerender: true },
    // '/faq': { prerender: true },

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
  },

  // ── Vuetify ──────────────────────────────────────
  vuetify: {
    moduleOptions: {
      styles: true,
      importComposables: true,
      prefixComposables: false,
      ssrClientHints: {
        viewportSize: true,
        prefersColorScheme: true,
        prefersColorSchemeOptions: {
          cookieName: 'color-scheme',
          darkThemeName: 'dark',
          lightThemeName: 'light',
        },
      },
    },
    vuetifyOptions: './vuetify.config.ts',
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
    strategy: 'prefix',
    langDir: 'locales',
    detectBrowserLanguage: false,
  },

  // ── Pinia Persisted State ────────────────────────
  piniaPluginPersistedstate: {
    storage: 'cookies',
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
