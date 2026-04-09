# Step 5.1: Install Dependencies

> All versions verified against npm registry on 2026-04-09.
> Audited against actual Nuxt 2 codebase usage on 2026-04-09.

## Sprint 5 Scope: Scaffold Only

Sprint 5 installs **only what's needed to get the foundation running**: UI, i18n, state management, and testing.
Everything else is deferred to the sprint where it's actually used.

## Todos

- [x] Install UI framework deps
- [x] Install state management deps
- [x] Install i18n deps
- [x] Install testing deps — `@nuxt/test-utils@4.0.0` (4.0.1 has `workspace:*` packaging bug)
- [x] Verify `pnpm dev` starts without errors
- [x] Verify no peer dependency warnings

## Install Commands

### Core UI Framework
```bash
pnpm add vuetify@latest vuetify-nuxt-module@0.19.5 @mdi/font
```
> Vuetify 4.0.5 (latest stable). vuetify-nuxt-module@0.19.5 supports `^3.7.0 || ^4.0.0-0`.

### State Management
```bash
pnpm add @pinia/nuxt@0.11.3 pinia@3.0.4 pinia-plugin-persistedstate@4.7.1
```

### Internationalization
```bash
pnpm add @nuxtjs/i18n@10.2.4
```
> v10 — NOT `@next`. `lazy` is always enabled (no config needed).

### Testing (dev dependencies)
```bash
pnpm add -D vitest@4.1.3 @vue/test-utils@2.4.6 happy-dom@20.8.9 @nuxt/test-utils@4.0.1 @playwright/test@1.59.1
```

## One-liner (all at once)

```bash
# Runtime
pnpm add vuetify@latest vuetify-nuxt-module@0.19.5 @mdi/font @pinia/nuxt@0.11.3 pinia@3.0.4 pinia-plugin-persistedstate@4.7.1 @nuxtjs/i18n@10.2.4

# Dev
pnpm add -D vitest@4.1.3 @vue/test-utils@2.4.6 happy-dom@20.8.9 @nuxt/test-utils@4.0.1 @playwright/test@1.59.1
```

## Deferred to Later Sprints

| Package | Version | Sprint | Reason |
|---|---|---|---|
| nuxt-auth-utils | 0.5.29 | Sprint 6 | Auth sprint — sealed sessions for useAuth |
| @sentry/nuxt | 10.47.0 | Sprint 7 | No errors to track in empty scaffold |
| vue-toast-notification | 3.1.3 | Sprint 6 | No API calls to show errors for |
| vee-validate + rules + i18n | 4.15.1 | Sprint 7 | No forms in scaffold |
| maska | 3.2.0 | Sprint 7 | No forms in scaffold |
| pusher-js | 8.5.0 | Sprint 10 | Chat sprint |
| firebase | 12.11.0 | Sprint 7 | FCM plugin sprint |
| isomorphic-dompurify | latest | Sprint 7 | No content to sanitize |
| nuxt-security | 2.5.1 | Sprint 13 | Security hardening sprint |
| nuxt-gtag | 4.1.0 | Sprint 7 | Analytics plugin migration |

## Version Summary Table

| Package | Version | Type |
|---|---|---|
| vuetify | 4.0.5 (latest) | runtime |
| vuetify-nuxt-module | 0.19.5 | runtime |
| @mdi/font | latest | runtime |
| @pinia/nuxt | 0.11.3 | runtime |
| pinia | 3.0.4 | runtime |
| pinia-plugin-persistedstate | 4.7.1 | runtime |
| @nuxtjs/i18n | 10.2.4 | runtime |
| vitest | 4.1.3 | dev |
| @vue/test-utils | 2.4.6 | dev |
| happy-dom | 20.8.9 | dev |
| @nuxt/test-utils | 4.0.1 | dev |
| @playwright/test | 1.59.1 | dev |
