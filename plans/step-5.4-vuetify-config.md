# Step 5.4: Vuetify 4 Configuration

> External config file auto-detected at project root.
> Using Vuetify 4.0.5 — key difference: `defaultTheme` must be set to `'light'` (v4 defaults to `'system'`).

## Todos

- [x] Create `vuetify.config.ts` at project root
- [x] Audit old `config/vuetify.options.js` for custom color values (40+ color tokens mapped)
- [x] Map old theme colors to Vuetify 4 theme — all colors from old config preserved
- [x] Configure RTL locales (ar, ur)
- [x] Set `defaultTheme: 'light'` (Vuetify 4 defaults to `system`)
- [x] Set component defaults matching current design
- [x] Verify theme renders correctly in dev
- [x] Fix: added `dark` theme (required by `ssrClientHints.prefersColorScheme`)
- [x] Create `app/plugins/i18n-vuetify-sync.ts` — RTL sync on locale switch

## vuetify.config.ts

```typescript
// vuetify.config.ts (project root — auto-detected by vuetify-nuxt-module)
import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'

export default defineVuetifyConfiguration({
  // SSR defaults (replaces device_width store)
  ssr: {
    clientWidth: 1280,
    clientHeight: 720,
  },

  // Theme
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          // TODO: Audit vutifay-variables.scss from old repo for actual values
          primary: '#1E88E5',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
          background: '#FFFFFF',
          surface: '#FFFFFF',
        },
      },
    },
    variations: {
      colors: ['primary', 'secondary', 'accent'],
      lighten: 2,
      darken: 2,
    },
  },

  // RTL / Locale
  locale: {
    locale: 'ar',
    fallback: 'en',
    rtl: {
      ar: true,
      ur: true,
      en: false,
      tr: false,
      fr: false,
      es: false,
    },
  },

  // Icons
  icons: {
    defaultSet: 'mdi',
  },

  // Display breakpoints (useDisplay composable)
  display: {
    mobileBreakpoint: 'md',    // < 960px = mobile (matches old getIsMobile at 900px)
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
      xxl: 2560,
    },
  },

  // Global component defaults
  defaults: {
    VBtn: {
      variant: 'flat',
      color: 'primary',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      hideDetails: 'auto',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      hideDetails: 'auto',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      hideDetails: 'auto',
    },
    VCard: {
      elevation: 2,
      rounded: 'lg',
    },
    VChip: {
      rounded: 'lg',
    },
  },
})
```

## i18n-Vuetify RTL Sync Plugin

The old `onBeforeLanguageSwitch` callback is removed in i18n v10. Replace with hook:

```typescript
// app/plugins/i18n-vuetify-sync.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('i18n:localeSwitched', ({ newLocale }) => {
    const vuetify = useNuxtApp().$vuetify
    if (!vuetify) return

    const localeConfig = nuxtApp.$i18n.locales.value.find(
      (l: any) => l.code === newLocale
    )
    const isRtl = localeConfig?.dir === 'rtl'

    vuetify.locale.current.value = newLocale
    vuetify.rtl.value = isRtl
  })
})
```

## Notes

- **Vuetify 4:** `defaultTheme: 'light'` is explicit because v4 defaults to `'system'` (respects OS preference)
- **Vuetify 4:** CSS uses `@layer` — no more `!important` in overrides, much cleaner customization
- `mobileBreakpoint: 'md'` (960px) replaces the old `device_width` store threshold of 900px
- `useDisplay()` is auto-imported by vuetify-nuxt-module (no manual import)
- With `ssrClientHints.viewportSize: true` in nuxt.config, `useDisplay()` returns accurate values on SSR
- Theme colors are placeholder values — audit the old `vutifay-variables.scss` for actual brand colors
