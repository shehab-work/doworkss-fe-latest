# Doworkss Migration Workflow

> Nuxt 2.15.8 → Nuxt 4.4.2 | Full Implementation Workflow
> Generated: 2026-04-09 | Audited against actual codebase usage

---

## Dependency Audit Summary

Before starting, these corrections were applied based on auditing every package
against actual usage in the Nuxt 2 codebase:

| Package | Decision | Reason |
|---------|----------|--------|
| `@vueuse/nuxt` + `@vueuse/core` | **REMOVED** | Zero imports in codebase — speculative |
| `nuxt-security` | **DEFERRED → Sprint 13** | Not in Nuxt 2; hardening belongs in security sprint |
| `nuxt-gtag` | **DEFERRED → Sprint 7** | Manual gtag script works; integrate when migrating analytics plugin |
| `nuxt-auth-utils` | **DEFERRED → Sprint 6** | Auth sprint — no auth in scaffold |
| `@sentry/nuxt` | **DEFERRED → Sprint 7** | No errors to track in empty scaffold |
| `vue-toast-notification` | **DEFERRED → Sprint 6** | No API calls to show errors for |
| `vee-validate` + rules + i18n | **DEFERRED → Sprint 7** | No forms in scaffold |
| `maska` | **DEFERRED → Sprint 7** | No forms in scaffold |
| `pusher-js` | **DEFERRED → Sprint 10** | Chat sprint |
| `firebase` | **DEFERRED → Sprint 7** | FCM plugin sprint |
| `isomorphic-dompurify` | **DEFERRED → Sprint 7** | No content to sanitize |
| `@pinia/nuxt` | **KEPT in Sprint 5** | State management infrastructure |

---

## Phase B: Foundation — Sprint 5

### Step 5.1: Install Dependencies

**Runtime (7 packages):**
```bash
pnpm add vuetify@latest vuetify-nuxt-module@0.19.5 @mdi/font \
  @pinia/nuxt@0.11.3 pinia@3.0.4 pinia-plugin-persistedstate@4.7.1 \
  @nuxtjs/i18n@10.2.4
```

**Dev (5 packages):**
```bash
pnpm add -D vitest@4.1.3 @vue/test-utils@2.4.6 happy-dom@20.8.9 \
  @nuxt/test-utils@4.0.1 @playwright/test@1.59.1
```

**Checkpoints:**
- [ ] `pnpm dev` starts without errors
- [ ] No peer dependency warnings

### Step 5.2: Directory Structure

See `step-5.2-directory-structure.md` for full tree + `mkdir -p` commands.

**Key corrections from audit:**
- Stores at `app/stores/` (NOT root `stores/`)
- Locales at `i18n/locales/` (NOT root `locales/`)
- Vuetify config at project root
- Sentry configs deferred to Sprint 7

**Checkpoints:**
- [ ] All directories created
- [ ] Structure matches Nuxt 4 conventions

### Step 5.3: nuxt.config.ts

See `step-5.3-nuxt-config.md` for full verified config.

**Modules registered (Sprint 5):**
```typescript
modules: [
  'vuetify-nuxt-module',
  '@pinia/nuxt',
  'pinia-plugin-persistedstate/nuxt',
  '@nuxtjs/i18n',
  '@nuxt/image', '@nuxt/fonts', '@nuxt/scripts', '@nuxt/icon', '@nuxt/eslint', '@nuxt/hints',
]
```

**Deferred modules:**
- `nuxt-auth-utils` → Sprint 6
- `@sentry/nuxt/module` → Sprint 7
- `nuxt-gtag` → Sprint 7
- `nuxt-security` → Sprint 13

**Critical config details:**
- i18n: `langDir: 'locales'` resolves to `i18n/locales/` (v10 restructureDir)
- i18n: NO `lazy: true` (removed in v10, always lazy)
- Sentry: `'@sentry/nuxt/module'` (with `/module` path)
- Pinia persistedstate: `'pinia-plugin-persistedstate/nuxt'` (separate module)
- SSR client hints in `vuetify.moduleOptions` (NOT vuetify.config.ts)

**Checkpoints:**
- [ ] Config replaces minimal scaffold
- [ ] `pnpm dev` still works with modules loaded

### Step 5.4: Vuetify Config

See `step-5.4-vuetify-config.md` for full config.

**Action required:** Audit `doworkss_frontend/config/vuetify.options.js` and
`assets/scss/base/vutifay-variables.scss` for actual brand colors.

**Checkpoints:**
- [ ] `vuetify.config.ts` created at root
- [ ] Theme colors match brand
- [ ] RTL works for `ar` and `ur` locales

### Step 5.5: Assets & Locales

See `step-5.5-assets-locales.md` for copy commands and file mapping.

**Key actions:**
- Copy 6 locale JSON files → `i18n/locales/`
- Copy SCSS → `app/assets/scss/` (rewrite Vuetify 2 → 4 selectors)
- Copy used assets (skip 48 dead icons, 20 dead SVGs)
- Merge `assets/images/` + `assets/imgs/` → single `app/assets/images/`
- Firebase SW deferred to Sprint 7

**Checkpoints:**
- [ ] Locale files load correctly
- [ ] SCSS compiles without errors
- [ ] Favicon renders
- [ ] MDI icons render

### Step 5.6: TypeScript Types

See `step-5.6-typescript-types.md` for all type definitions.

**Files to create:**
- `shared/types/auth.ts` — User, LoginDTO, AuthState
- ~~`shared/types/auth.d.ts`~~ — DEFERRED → Sprint 6 (nuxt-auth-utils augmentation)
- `shared/types/service.ts` — Service, ServiceListItem, ServiceFormData
- `shared/types/deal.ts` — Deal, DealStatus, DealDelivery
- `shared/types/api.ts` — ApiResponse, ApiError, PaginatedResponse
- `shared/types/chat.ts` — Conversation, Message
- `shared/types/user.ts` — Currency, Category, Notification

**Checkpoints:**
- [ ] Types auto-import in `app/` components
- [ ] Types auto-import in `server/` routes

### Step 5.7: Environment Config

See `step-5.7-env-config.md` for full `.env.example`.

**Checkpoints:**
- [ ] `.env.example` created with all variables
- [ ] `.env` created with dev values
- [ ] `.env` in `.gitignore`
- [ ] `useRuntimeConfig()` reads vars correctly

### Step 5.8: Testing Setup

See `step-5.8-testing-setup.md` for configs.

**Key correction:** Use `defineVitestConfig` from `@nuxt/test-utils/config` (NOT `vitest/config`).

**Checkpoints:**
- [ ] `vitest.config.ts` created
- [ ] `playwright.config.ts` created
- [ ] `pnpm test` runs example test
- [ ] Test scripts added to `package.json`

### Step 5.9: CI Workflow

See `step-5.9-ci-workflow.md` for GitHub Actions config.

**Checkpoints:**
- [ ] `.github/workflows/ci.yml` created
- [ ] Triggers on push/PR to main and feat/nuxt4

### Step 5.10: Verification

See `step-5.10-verification.md` for 80+ verification items.

**Smoke test:** Create temporary `app/pages/test.vue` to verify all Sprint 5 features.
Delete after verification.

**Sprint 5 exit criteria:**
- [ ] `pnpm dev` starts clean (no errors, no peer warnings)
- [ ] Vuetify 4 renders with correct theme + RTL
- [ ] i18n switches locales with URL prefix
- [ ] Pinia auto-imports work
- [ ] Types resolve in app/ and server/
- [ ] Env vars read correctly
- [ ] Vitest runs
- [ ] CI workflow committed

---

## Phase C: Core Infrastructure — Sprints 6-7

### Sprint 6: Auth + API + i18n Sync + Toast (~2 weeks)

**Highest risk sprint. Auth has 405 `$auth` references across 94 files.**

#### 6.0: Install Deferred Dependencies
```bash
pnpm add nuxt-auth-utils@0.5.29 vue-toast-notification@3.1.3
```
Add `'nuxt-auth-utils'` to modules in `nuxt.config.ts`.
Add `session.password` to `runtimeConfig`.
Create `shared/types/auth.d.ts` (`#auth-utils` augmentation).

#### 6.1: Nitro API Proxy Routes
```
server/api/auth/login.post.ts
server/api/auth/logout.post.ts
server/api/auth/refresh.post.ts
server/api/auth/user.get.ts
server/api/auth/register.post.ts
server/api/auth/verify-email.post.ts
server/api/auth/verify-phone.post.ts
server/api/auth/forgot-password.post.ts
server/api/auth/set-password.post.ts
server/api/proxy/[...path].ts         # Catch-all for other endpoints
server/middleware/auth.ts              # SSR token validation + refresh
server/utils/session.ts               # Sealed session helpers
server/utils/jwt.ts                   # Token decode/expiry check
```

**Critical:** `PRIVATE_KEY` stays server-only. All API calls proxied through Nitro.

#### 6.2: useAuth Composable
```
app/composables/useAuth.ts
```

Maps all 8 current `$auth` methods:
| Old | New |
|-----|-----|
| `$auth.loginWith('local', { data })` | `useAuth().login(credentials)` |
| `$auth.logout({ data })` | `useAuth().logout(opts)` |
| `$auth.user` | `useAuth().user` |
| `$auth.loggedIn` | `useAuth().loggedIn` |
| `$auth.setUserToken(token, refresh)` | Server-side via `setUserSession()` |
| `$auth.setUser(userData)` | `useAuth().updateUser(userData)` |
| `$auth.reset()` | `useAuth().logout()` |
| `$auth.refreshTokens()` | `useAuth().refreshToken()` |

Wraps `nuxt-auth-utils`'s `useUserSession()` for encrypted session storage.

#### 6.3: useApi Composable
```
app/composables/useApi.ts
```

Replaces `plugins/ApiCalls.js` + `plugins/axios.js`:
- `request<T>(url, options)` — wraps `$fetch` with headers
- Auto-adds `content-language`, `currency` headers
- Error code routing: 403→error, 406→verify-email, 412→verify-phone, 429→toast, etc.
- `showToast` option per-call (replaces localStorage toast pattern)

#### 6.4: i18n-Vuetify RTL Sync Plugin
```
app/plugins/i18n-vuetify-sync.ts
```

Uses `i18n:localeSwitched` hook (replaces removed `onBeforeLanguageSwitch`).

#### 6.5: Toast Setup
```
app/plugins/toast.ts
```

Configure `vue-toast-notification`. Create `useToast()` wrapper composable.

#### Sprint 6 Checkpoints:
- [ ] Login with real credentials on staging
- [ ] Token refresh works
- [ ] Logout clears session
- [ ] API calls include correct headers (private-key server-only)
- [ ] Toast on API errors
- [ ] Locale switching toggles RTL/LTR
- [ ] SSR renders with correct auth state

---

### Sprint 7: Stores + Plugins + Utilities (~2 weeks)

#### 7.0: Install Deferred Dependencies
```bash
pnpm add @sentry/nuxt@10.47.0 vee-validate@4.15.1 @vee-validate/rules@4.15.1 \
  @vee-validate/i18n@4.15.1 maska@3.2.0 firebase@12.11.0 \
  isomorphic-dompurify nuxt-gtag@4.1.0
```
Add `'@sentry/nuxt/module'`, `'nuxt-gtag'` to modules.
Add `sentry`, `sourcemap`, `gtag` config sections.
Add Pusher/Firebase/Sentry env vars to `runtimeConfig.public`.

#### 7.1: Pinia Stores (8 from 22 Vuex modules)

| New Store | Replaces |
|-----------|----------|
| `app/stores/global.ts` | `store/global/` |
| `app/stores/auth.ts` | `store/user/` |
| `app/stores/chat.ts` | `store/chat/` |
| `app/stores/deals.ts` | `store/deals/` |
| `app/stores/wallet.ts` | `store/wallet/` |
| `app/stores/serviceForm.ts` | `store/update_service/` + `store/my_services/` |
| `app/stores/categories.ts` | `store/all_categories/` |
| `app/stores/ui.ts` | `store/filter_header/` + `store/mobile_menu/` + `store/search_menu/` |

**13 Vuex modules NOT migrated to stores** (replaced by composables/local state):
- `ads`, `blog_tags`, `device_id`, `device_width`, `faq`, `login_form`,
  `registration`, `social_media`, `verify`, `plan`

#### 7.2: Plugins
```
app/plugins/fcm.client.ts              # Firebase Cloud Messaging
app/plugins/pusher.client.ts           # Pusher real-time
app/plugins/broadcast-auth.client.ts   # Cross-tab auth sync
app/plugins/vee-validate.ts            # Form validation rules + i18n
app/plugins/sanitize.ts                # DOMPurify setup
```

#### 7.3: Composables (from mixins)
```
app/composables/useCurrency.ts         # from currency/, price_exchange/
app/composables/useFavorite.ts         # toggle favorite
app/composables/useFilter.ts          # filter state + URL sync
app/composables/useSocialAuth.ts      # Google + Apple login
app/composables/useCountdown.ts       # OTP timer
app/composables/useInfiniteScroll.ts  # IntersectionObserver
app/composables/useDirection.ts       # RTL/LTR detection
app/composables/useNotifications.ts   # notification formatting
app/composables/useFcm.ts            # FCM token + foreground messages
app/composables/usePusher.ts         # Channel subscribe/unsubscribe
app/composables/useFileUpload.ts     # File upload logic
app/composables/useFileValidation.ts # File validation
```

#### 7.4: Shared Utilities
```
shared/utils/currency.ts    # from global_user_currency, fixed_currency_format
shared/utils/string.ts      # from string_truncate, remove_html_tags_string
shared/utils/phone.ts       # from clean_phone
shared/utils/validation.ts  # custom validation helpers
shared/utils/date.ts        # from currency_date_format
shared/utils/fileHelpers.ts # file type/size checks
```

#### 7.5: Middleware
```
app/middleware/auth.ts           # Redirect unauthenticated users
app/middleware/guest.ts          # Redirect authenticated users (was user.js)
app/middleware/phone-verified.ts # Enforce phone verification
```

#### 7.6: Analytics (deferred from Sprint 5)
```bash
pnpm add nuxt-gtag@4.1.0
```
Add `'nuxt-gtag'` to modules. Replaces `plugins/google-analytics.js`.

#### Sprint 7 Checkpoints:
- [ ] All 8 Pinia stores initialize
- [ ] FCM permission flow works
- [ ] Pusher connects and receives events
- [ ] Cross-tab auth sync works
- [ ] vee-validate rules register
- [ ] File upload component works
- [ ] All utility functions have unit tests
- [ ] Middleware redirects work

---

## Phase D: Page Migration — Sprints 8-12

> **Every page follows this transformation checklist:**
> - `_slug` → `[slug]` in filenames
> - Options API → `<script setup lang="ts">`
> - `asyncData` → `useAsyncData()` / `useFetch()`
> - `this.$store` → Pinia store composables
> - `this.$request` → `useApi().request()`
> - `this.$auth` → `useAuth()`
> - `this.$t()` → `$t()` in template, `useI18n().t()` in script
> - Vuetify 2 → Vuetify 4 component API
> - `::v-deep` → `:deep()`
> - `.native` modifier → remove
> - `process.client` → `import.meta.client`
> - `head()` → `useSeoMeta()` / `useHead()`

### Sprint 8: Layouts + Home + Auth + Error (~2 weeks)

**Layouts first — everything depends on these:**

| Old | New | Notes |
|-----|-----|-------|
| `layouts/default.vue` | `app/layouts/default.vue` | Merge desktop/mobile nav |
| `layouts/auth.vue` | `app/layouts/auth.vue` | |
| `layouts/dashboard.vue` | `app/layouts/dashboard.vue` | Merge sidebar variants |
| `layouts/chat.vue` | `app/layouts/chat.vue` | |
| `layouts/editBlog.vue` | `app/layouts/edit-blog.vue` | |
| `layouts/error.vue` | `app/error.vue` | Nuxt 4: `error.vue` is NOT a layout |

**Layout components — merge desktop/mobile pairs:**

| Old Pair | New Single |
|----------|-----------|
| `NavDesktop` + `NavMobile` | `components/layout/AppNav.vue` |
| `DesktopAside` + `MobileAside` | `components/layout/DashboardSidebar.vue` |
| `DesktopUserMenu` + `MobileMenu` | `components/layout/UserMenu.vue` |
| `SearchBar` + `MobileSearchMenu` | `components/layout/SearchBar.vue` |
| `LanguageSwitcher` + `MobileLanguageMenu` | `components/layout/LanguageSwitcher.vue` |
| `UserCurrencyWrapper` + `MobileCurrency` | `components/layout/CurrencySwitcher.vue` |
| `CustomFooter` | `components/layout/AppFooter.vue` |

**Home page:** `pages/home/index.vue` (571 lines) → `app/pages/index.vue`

**Auth pages:** 11 pages (login, sign-up, forgot-password, OTP, 2FA, etc.)

**Static pages:** about-us, faq, privacy-policy, terms-and-conditions

#### Sprint 8 Checkpoints:
- [ ] All layouts render correctly
- [ ] Home page with all sections, RTL/LTR
- [ ] Login → dashboard redirect
- [ ] Registration flow completes
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] SEO meta tags match Nuxt 2

---

### Sprint 9: Services + Providers + Categories (~2 weeks)

**High complexity:** ServiceCard (1,145 lines), service wizard, mark-service (1,267 lines)

| Old | New | Lines |
|-----|-----|-------|
| `pages/services/_slug.vue` | `app/pages/services/[slug].vue` | 1,267 |
| `pages/category/_slug.vue` | `app/pages/category/[slug].vue` | |
| `pages/providers/index.vue` | `app/pages/providers/index.vue` | |
| `pages/provider/_slug.vue` | `app/pages/provider/[slug].vue` | 717 |
| `pages/add-service/index.vue` | `app/pages/add-service/index.vue` | |
| `pages/edit-service/_id.vue` | `app/pages/edit-service/[id].vue` | |
| `pages/mark-service/_id.vue` | `app/pages/mark-service/[id].vue` | 1,267 |

**New composables:** `useServiceList.ts`, `useServiceForm.ts`
**Decompose:** MainServiceCard → ServiceCard + ServiceGridCard + ServiceRowCard

---

### Sprint 10: Chat + Blog + Plans (~2 weeks)

**Install:** `pnpm add pusher-js@8.5.0`

**Highest complexity sprint:** Messages.vue is 3,228 lines.

| Old | New | Lines |
|-----|-----|-------|
| `pages/chat/` | `app/pages/chat/` | 3,228+ |
| `pages/blogs/`, `pages/blog/` | `app/pages/blogs/`, `app/pages/blog/` | |
| `pages/add-blog/`, `pages/edit-blog/` | (TipTap editor) | |
| `pages/plans/index.vue` | `app/pages/plans/index.vue` | 1,248 |

**Chat decomposition:**
```
components/feature/chat/ChatPage.vue
components/feature/chat/ChatHeader.vue
components/feature/chat/ChatMessageList.vue
components/feature/chat/ChatComposer.vue
components/feature/chat/ChatAudioRecorder.vue
components/feature/chat/ChatDealCard.vue
components/feature/chat/ChatRatingCard.vue
```

**New composables:** `useChat.ts`, `useChatPresence.ts`, `useChatAudio.ts`

**Install TipTap:** `pnpm add @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link`

---

### Sprint 11: Dashboard + Deals (~2 weeks)

| Old | New | Lines |
|-----|-----|-------|
| `pages/dashboard/` | `app/pages/dashboard/` | 565 |
| `pages/deals/` (nested routes) | `app/pages/deals/` | Multiple |
| `pages/my-deals/_type.vue` | `app/pages/my-deals/[type].vue` | 704 |

**Payment:** `pages/deals/index/_deal_id/payment.vue` (949 lines) — Tap SDK integration

**New composables:** `useDealForm.ts`, `useDealDelivery.ts`, `usePayment.ts`

---

### Sprint 12: Profile + Wallet + Remaining (~2 weeks)

**22 pages total** — mostly medium/low complexity.

| Category | Key Pages |
|----------|-----------|
| Profile | my-profile (1,269 lines), account-settings, delete-account |
| Wallet | my-wallet (448), top-up-wallet (596), withdraw (1,351), payment-by-card (404) |
| Services | my-services/[type] (1,248) |
| Remaining | notifications, favorite, my-network, suggestions, app-rating, sitemap |

**New composables:** `usePayment.ts` (if not in Sprint 11)

---

## Phase E: Quality & Cutover — Sprints 13-14

### Sprint 13: Testing + Performance + Security (~2 weeks)

#### Testing
- [ ] Unit tests for all `shared/utils/`
- [ ] Integration tests for `useAuth`, `useApi`, `useCurrency`
- [ ] Playwright E2E: auth flow, service creation, deal flow, chat, wallet
- [ ] Coverage target: 60% statements, 50% branches

#### Performance
- [ ] Lighthouse on all key pages (LCP < 2.5s, CLS < 0.1, JS < 300KB gzipped)
- [ ] Verify Vuetify tree-shaking (bundle analyzer)
- [ ] Verify `@nuxt/fonts` self-hosting
- [ ] Verify `@nuxt/image` generating WebP/AVIF

#### Security (install `nuxt-security` now)
```bash
pnpm add nuxt-security@2.5.1
```
Add to modules. Configure CSP, nonce, rate limiting.

- [ ] `PRIVATE_KEY` NOT in any client request (DevTools check)
- [ ] CSP headers present
- [ ] No `v-html` without DOMPurify
- [ ] `pnpm audit` passes

---

### Sprint 14: Staging QA + Cutover (~2 weeks)

- [ ] Deploy to staging
- [ ] Full QA: every page compared against Nuxt 2 production
- [ ] Test all 6 locales (ar, en, tr, fr, es, ur)
- [ ] Test RTL in Arabic + Urdu
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Test auth edge cases (expired token, network loss, multi-tab)
- [ ] Test payment flows with Tap test cards
- [ ] Production cutover: switch DNS from Nuxt 2 to Nuxt 4
- [ ] Post-cutover: Sentry monitoring, performance tracking
- [ ] Keep Nuxt 2 as rollback for 1 week

---

## Corrected Quick Reference

| Nuxt 2 Pattern | Nuxt 4 Equivalent |
|----------------|-------------------|
| `asyncData({ store, params })` | `useAsyncData()` in `<script setup>` |
| `fetch()` lifecycle | `useFetch()` or `onMounted` + `$fetch` |
| `this.$request(args)` | `useApi().request(url, opts)` |
| `this.$store.dispatch('mod/action')` | `const store = useModStore(); store.action()` |
| `this.$store.getters['mod/getter']` | `storeToRefs(useModStore()).getter` |
| `this.$auth.user` | `useAuth().user.value` |
| `this.$auth.loggedIn` | `useAuth().loggedIn.value` |
| `this.$auth.loginWith('local', ...)` | `useAuth().login(credentials)` |
| `this.$auth.logout()` | `useAuth().logout()` |
| `this.$t('key')` | `$t('key')` in template, `useI18n().t('key')` in script |
| `this.$router.push(path)` | `navigateTo(path)` |
| `this.$route.params.slug` | `useRoute().params.slug` |
| `app.localePath('/path')` | `useLocalePath()('/path')` |
| `this.$alert({ msg, type })` | `useToast().success(msg)` |
| `this.$dir()` | `useDirection().dir.value` |
| `this.$set(obj, key, val)` | `obj[key] = val` |
| `this.$refs.name` | `useTemplateRef('name')` |
| `head() { return {...} }` | `useSeoMeta({...})` |
| `layout: 'name'` | `definePageMeta({ layout: 'name' })` |
| `middleware: 'auth'` | `definePageMeta({ middleware: ['auth'] })` |
| `process.client` | `import.meta.client` |
| `::v-deep .class` | `:deep(.class)` |
| `@click.native` | `@click` |
| `$store.getters['device_width/getIsMobile']` | CSS `d-none d-md-block` or `useDisplay()` |

---

## Risk Matrix

| Risk | Likelihood | Impact | Sprint | Mitigation |
|------|-----------|--------|--------|------------|
| Auth regression | High | Critical | 6 | Test exhaustively before page migration |
| Vuetify 4 visual diffs | High | Medium | 8-12 | Visual comparison per page |
| SSR hydration mismatch | Medium | Medium | 8-12 | Check console every page |
| Performance regression | Medium | Medium | 13 | Lighthouse per sprint |
| i18n/RTL breakage | Medium | High | 6, 8 | Test all 6 locales |
| Payment flow breakage | Low | Critical | 11 | E2E tests + Tap test cards |
| Chat real-time breakage | Medium | High | 10 | Integration tests for Pusher |

---

## Execution Order

```
Sprint 5  ─── Foundation (THIS SPRINT) — 7 runtime + 5 dev packages
              ├── Vuetify 4 + @mdi/font
              ├── Pinia + persistedstate
              ├── i18n v10
              ├── Directory structure
              ├── nuxt.config.ts (scaffold modules only)
              ├── Vuetify config + i18n config
              ├── Assets + locales
              ├── TypeScript types (no auth.d.ts)
              ├── Env config (app-level only)
              ├── Testing setup
              └── CI workflow

Sprint 6  ─── Auth + API (HIGHEST RISK)
              ├── +Install: nuxt-auth-utils, vue-toast-notification
              ├── Nitro proxy routes
              ├── useAuth composable
              ├── useApi composable
              ├── auth.d.ts type augmentation
              ├── i18n-Vuetify RTL sync
              └── Toast setup

Sprint 7  ─── Stores + Plugins + Utilities
              ├── +Install: @sentry/nuxt, vee-validate, maska, firebase,
              │   isomorphic-dompurify, nuxt-gtag
              ├── 8 Pinia stores
              ├── FCM, broadcast plugins
              ├── 12 composables (from mixins)
              ├── 6 shared utilities
              ├── Middleware (auth, guest, phone-verified)
              ├── vee-validate setup
              ├── Sentry + nuxt-gtag integration
              └── File upload system

Sprint 8  ─── Layouts + Home + Auth (VISUAL FOUNDATION)
Sprint 9  ─── Services + Providers + Categories
Sprint 10 ─── Chat + Blog + Plans (MOST COMPLEX)
Sprint 11 ─── Dashboard + Deals + Payment
Sprint 12 ─── Profile + Wallet + Remaining (22 pages)
Sprint 13 ─── Testing + Performance + Security
Sprint 14 ─── Staging QA + Production Cutover
```
