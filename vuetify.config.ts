// vuetify.config.ts (project root — auto-detected by vuetify-nuxt-module)
import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'

export default defineVuetifyConfiguration({
  // SSR defaults (replaces device_width store)
  ssr: {
    clientWidth: 1280,
    clientHeight: 720,
  },

  // Theme — colors audited from old config/vuetify.options.js
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          // ── Core brand colors ──
          primary: '#407830',
          'primary-lighter': '#7FC719',
          'primary-light': '#F2FDF9',
          secondary: '#424242',
          accent: '#DAECD4',
          'accent-light': '#F2F9E7',
          'accent-red': '#FFEDED',
          'accent2': '#F2FDF9',

          // ── Semantic colors ──
          error: '#F1416C',
          'error-sec': '#FB5454',
          info: '#7239EA',
          success: '#407830',
          warning: '#009EF7',
          green: '#01A601',
          orange: '#FBA718',
          'orange-light': '#FFF2DC',

          // ── Neutrals ──
          background: '#FFFFFF',
          surface: '#FFFFFF',
          'on-background': '#3C3C3C',
          'on-surface': '#3C3C3C',
          dark: '#181C32',
          'dark-blue': '#4F5E64',

          // ── Grays ──
          gray: '#666666',
          'gray-light': '#F4F5F5',
          'gray-medium': '#707070',
          'gray-darker': '#3A3838',
          'greyish-black': '#3D3D3D',
          'grayish-blue': '#66789C',
          'grayish-blue-light': '#A0ABB8',
          'grayish-blue-lighter': '#E0E6F6',

          // ── Backgrounds & borders ──
          bg: '#F6F7F9',
          'bg-grey': '#F3F3F2',
          light: '#F5F8FA',
          'border-light': '#E0E6F7',
          'yellow-light': '#FEFFD8',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#407830',
          secondary: '#616161',
          accent: '#DAECD4',
          error: '#F1416C',
          info: '#7239EA',
          success: '#407830',
          warning: '#009EF7',
          background: '#121212',
          surface: '#1E1E1E',
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
    mobileBreakpoint: 'md',
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
