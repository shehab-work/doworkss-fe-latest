# Step 5.2: Create Directory Structure

> Corrected based on research: i18n v10 requires `i18n/locales/`, Pinia stores go in `app/stores/`.

## Todos

- [ ] Create all `app/` subdirectories
- [ ] Create `server/` directories
- [ ] Create `shared/` directories
- [ ] Create `i18n/locales/` directory (i18n v10 requirement)
- [ ] Create `tests/` directories
- [ ] Create `e2e/` directory (Playwright)
- [ ] Verify structure matches Nuxt 4 conventions

> **Deferred:** Sentry config files at root (`sentry.client.config.ts`, `sentry.server.config.ts`) — create in Sprint 7 when installing @sentry/nuxt.

## Directory Tree

```
doworkss-FE-latest/
├── app/
│   ├── assets/
│   │   ├── scss/
│   │   │   ├── main.scss
│   │   │   ├── _global.scss
│   │   │   ├── _utils.scss
│   │   │   ├── _vuetify-override.scss
│   │   │   └── base/
│   │   │       ├── custom-variables.scss
│   │   │       ├── helper.scss
│   │   │       ├── reset.scss
│   │   │       └── global.scss
│   │   ├── icons/
│   │   │   └── social/                  # Consolidated social icons
│   │   ├── images/                      # Consolidated from old images + imgs
│   │   │   ├── app/
│   │   │   ├── category/
│   │   │   ├── chat/
│   │   │   ├── deals/
│   │   │   ├── header/
│   │   │   ├── provider/
│   │   │   ├── rating/
│   │   │   └── wallet/
│   │   └── svg/
│   ├── components/
│   │   ├── base/                        # BaseButton, BaseInput, BaseModal, BaseFilePicker
│   │   ├── layout/                      # AppNav, AppFooter, DashboardSidebar
│   │   ├── feature/
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── deals/
│   │   │   ├── services/
│   │   │   ├── wallet/
│   │   │   ├── blog/
│   │   │   └── home/
│   │   └── shared/                      # ServiceCard, ProviderCard, etc.
│   ├── composables/                     # useAuth, useApi, useCurrency, etc.
│   ├── layouts/                         # default, auth, dashboard, chat, edit-blog
│   ├── middleware/                       # auth, guest, phone-verified
│   ├── pages/                           # All route pages
│   ├── plugins/                         # toast, vee-validate, maska, fcm, pusher, etc.
│   ├── stores/                          # Pinia stores (auto-imported by @pinia/nuxt)
│   │   ├── global.ts
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── deals.ts
│   │   ├── wallet.ts
│   │   ├── serviceForm.ts
│   │   ├── categories.ts
│   │   └── ui.ts
│   ├── utils/                           # App-specific utilities (auto-imported)
│   ├── app.vue
│   └── error.vue
├── server/
│   ├── api/
│   │   ├── auth/                        # login, logout, refresh, register, etc.
│   │   ├── pusher/                      # Pusher auth endpoint
│   │   ├── fcm/                         # FCM token registration
│   │   └── proxy/
│   │       └── [...path].ts             # Catch-all proxy to backend API
│   ├── middleware/
│   │   ├── auth.ts                      # SSR token validation
│   │   └── security.ts                  # X-Robots-Tag for non-prod
│   └── utils/
│       ├── session.ts                   # Session helpers
│       └── jwt.ts                       # Token decode/expiry
├── shared/                              # Auto-imported in app + server (Nuxt 4)
│   ├── types/
│   │   ├── auth.ts
│   │   ├── auth.d.ts                    # nuxt-auth-utils type augmentation
│   │   ├── service.ts
│   │   ├── deal.ts
│   │   ├── api.ts
│   │   ├── chat.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── constants/
│   │   └── index.ts
│   └── utils/
│       ├── currency.ts
│       ├── string.ts
│       ├── phone.ts
│       ├── date.ts
│       └── validation.ts
├── i18n/                                # i18n v10 requires this structure
│   └── locales/
│       ├── ar.json
│       ├── en.json
│       ├── tr.json
│       ├── fr.json
│       ├── es.json
│       └── ur.json
├── public/
│   ├── favicon.ico
│   ├── logo-preview.png
│   ├── robots.txt
│   ├── sitemap.xsl
│   └── firebase-messaging-sw.js        # FCM service worker (manual)
├── tests/
│   ├── unit/
│   └── integration/
├── e2e/                                 # Playwright E2E tests
├── config/                              # Optional: shared config files
├── scripts/                             # Build/deploy scripts
├── docs/                                # Documentation
│   ├── MIGRATION_PLAN.md
│   └── PLAN_VALIDATION_REPORT.md
├── plans/                               # Sprint execution plans
├── .github/
│   └── workflows/
│       └── ci.yml
├── nuxt.config.ts
├── vuetify.config.ts                    # External Vuetify config (auto-detected)
├── vitest.config.ts
├── playwright.config.ts
# ├── sentry.client.config.ts            # Sprint 7: create when installing @sentry/nuxt
# ├── sentry.server.config.ts            # Sprint 7: create when installing @sentry/nuxt
├── tsconfig.json
├── .env.example
├── .env                                 # Not committed
├── .gitignore
└── package.json
```

## Create Commands

```bash
# App directories
mkdir -p app/{assets/{scss/base,icons/social,images/{app,category,chat,deals,header,provider,rating,wallet},svg},components/{base,layout,feature/{auth,chat,deals,services,wallet,blog,home},shared},composables,layouts,middleware,pages,plugins,stores,utils}

# Server directories
mkdir -p server/{api/{auth,pusher,fcm,proxy},middleware,utils}

# Shared directories
mkdir -p shared/{types,constants,utils}

# i18n (v10 structure)
mkdir -p i18n/locales

# Testing
mkdir -p tests/{unit,integration} e2e

# CI/CD
mkdir -p .github/workflows

# Other
mkdir -p config scripts
```

## Notes

- **`i18n/locales/`** — i18n v10 uses `restructureDir: 'i18n'` by default (cannot be disabled). Locale files MUST be here, not at `locales/` root.
- **`app/stores/`** — @pinia/nuxt auto-imports from `app/stores/` in Nuxt 4. No `storesDirs` config needed for flat structure.
- **`sentry.*.config.ts`** — Must be at project root. @sentry/nuxt looks for these files automatically.
- **`vuetify.config.ts`** — Must be at project root. vuetify-nuxt-module auto-detects it.
- **`shared/`** — Nuxt 4 auto-imports `shared/utils/` and `shared/types/` in both app and server.
