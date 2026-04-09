# Step 5.10: Sprint 5 Verification Checklist

## Todos

Run each check after completing all previous steps.

### Core Framework
- [ ] `pnpm dev` starts without errors
- [ ] No peer dependency warnings in console
- [ ] `.nuxt/` generates with correct TypeScript configs

### Vuetify
- [ ] Vuetify 4 renders a basic `<v-btn>` component
- [ ] Theme colors apply correctly (primary, secondary)
- [ ] RTL mode works when locale is `ar`
- [ ] LTR mode works when locale is `en`
- [ ] `useDisplay()` returns correct viewport values
- [ ] MDI icons render (`mdi-home`, `mdi-account`)

### i18n
- [ ] Arabic renders as default locale
- [ ] Switching to English changes text direction to LTR
- [ ] URL prefix changes on locale switch (`/ar/...`, `/en/...`)
- [ ] Translation keys resolve from JSON files
- [ ] `$t('key')` works in templates
- [ ] `useLocalePath('/about')` returns locale-prefixed path

### Vuetify + i18n RTL Sync
- [ ] Switching locale to `ar` sets Vuetify RTL mode
- [ ] Switching locale to `en` sets Vuetify LTR mode
- [ ] Switching to `ur` sets Vuetify RTL mode
- [ ] No flash of wrong direction on page load

### Auth (DEFERRED → Sprint 6)
- Auth verification moved to Sprint 6 when nuxt-auth-utils is installed

### Pinia
- [ ] A test store in `app/stores/` auto-imports correctly
- [ ] `storeToRefs()` is available without import
- [ ] `defineStore()` is available without import
- [ ] `pinia-plugin-persistedstate` loads (check for cookie storage)

### Security (DEFERRED → Sprint 13)
- Security header verification moved to Sprint 13 when nuxt-security is installed

### Environment
- [ ] `useRuntimeConfig().public.apiBase` reads from `.env`
- [ ] `useRuntimeConfig().privateKey` reads from `.env` (server only)
- [ ] Public config accessible in components
- [ ] Private config NOT accessible in components (undefined)

### TypeScript
- [ ] `shared/types/` types resolve in components
- [ ] `shared/types/` types resolve in server routes
- [ ] No TypeScript errors: `pnpm nuxi typecheck`

### Testing
- [ ] `pnpm test` runs vitest successfully
- [ ] Example unit test passes
- [ ] `npx playwright install` completes

### Build
- [ ] `pnpm build` does NOT run (per user preference) — but verify config is valid by checking `pnpm dev` has no config errors

### Assets
- [ ] Locale JSON files load correctly from `i18n/locales/`
- [ ] SCSS compiles without errors
- [ ] Favicon renders in browser tab
- [ ] MDI icons render from CSS

### Overall
- [ ] No console errors on page load
- [ ] No hydration mismatches
- [ ] No unhandled promise rejections
- [ ] Dev server responds at http://localhost:3000

## Quick Smoke Test Page

Create a temporary test page to verify everything:

```vue
<!-- app/pages/test.vue — DELETE after verification -->
<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
const display = useDisplay()
const config = useRuntimeConfig()

// Test Pinia auto-import
const testStore = defineStore('test', () => {
  const count = ref(0)
  return { count }
})()

// Test shared types
const testUser: User = {
  id: 1, name: 'Test', email: 'test@test.com',
  phone: null, avatar: null, currency: null,
  account_type: 'individual',
  is_phone_verified: false, is_email_verified: false,
}

useSeoMeta({ title: 'Sprint 5 Verification' })
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <h1 class="text-h4 mb-4">Sprint 5 Verification</h1>

        <v-card class="mb-4 pa-4">
          <h2>Vuetify</h2>
          <v-btn color="primary" class="mr-2">Primary</v-btn>
          <v-btn color="secondary">Secondary</v-btn>
          <p>Mobile: {{ display.mobile.value }}</p>
          <p>Width: {{ display.width.value }}</p>
        </v-card>

        <v-card class="mb-4 pa-4">
          <h2>i18n</h2>
          <p>Locale: {{ locale }}</p>
          <p>Home path: {{ localePath('/') }}</p>
          <v-btn v-for="l in ['ar','en','tr']" :key="l" @click="setLocale(l)" class="mr-2">
            {{ l }}
          </v-btn>
        </v-card>

        <v-card class="mb-4 pa-4">
          <h2>Config</h2>
          <p>API Base: {{ config.public.apiBase }}</p>
          <p>App Env: {{ config.public.appEnv }}</p>
        </v-card>

        <v-card class="mb-4 pa-4">
          <h2>Pinia</h2>
          <p>Test count: {{ testStore.count }}</p>
        </v-card>

        <v-card class="mb-4 pa-4">
          <h2>Types</h2>
          <p>Test user: {{ testUser.name }} ({{ testUser.email }})</p>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>
```
