# Upgrade Part One: Full-Stack Modernization — Nuxt 2 to Nuxt 4 (V2 — Validated)

> **Audience:** Team lead / senior frontend developer
> **Target:** Nuxt 4.4+ (stable, latest) — NOT Nuxt 3 (EOL July 2026)
> **Goal:** Transform the codebase into a modern, performant, secure, well-tested, and maintainable application following industry best practices.
> **Approach:** Step-by-step, one PR per task, zero production breakage.
> **Migration Mode:** Side-by-side — both Nuxt 2 (production) and Nuxt 4 (migration branch) run simultaneously during migration for comparison and validation.
>
> **V2 Changes:** Validated against Nuxt 4.4.2, Vue 3.5.32, Vue Router 5.0.4, Vite 7.3.2, TS 6.0.2, Nitro 2.13.3. Auth corrected to cookie-based (not session-based). See `UPGRADE_VALIDATION_REPORT.md` for full diff.

---

## Table of Contents

1. [Project Current State](#1-project-current-state)
2. [Why Nuxt 4 (Skip Nuxt 3)](#2-why-nuxt-4-skip-nuxt-3)
3. [Stage 1: Pre-Migration Cleanup (Nuxt 2)](#3-stage-1-pre-migration-cleanup-still-in-nuxt-2)
4. [Stage 2: Dependency Audit & Version Map](#4-stage-2-dependency-audit--version-map)
5. [Stage 3: Architecture & Design Patterns](#5-stage-3-architecture--design-patterns-nuxt-4)
   - 5.2: Missing Migration Concerns (Vuetify SCSS, i18n RTL sync, Firebase SW, /home routing, **Toast redesign**, **Auth architecture**)
6. [Stage 4: TypeScript Strategy](#6-stage-4-typescript-strategy)
7. [Stage 5: State Management — Vuex to Pinia](#7-stage-5-state-management--vuex-to-pinia)
8. [Stage 6: Vite & Nitro — Build & Server Engine](#8-stage-6-vite--nitro--build--server-engine)
9. [Stage 7: SSR Optimization & Hybrid Rendering](#9-stage-7-ssr-optimization--hybrid-rendering)
10. [Stage 8: Testing — Vitest & Playwright](#10-stage-8-testing--vitest--playwright)
11. [Stage 9: Performance Optimization](#11-stage-9-performance-optimization)
12. [Stage 10: Security Hardening](#12-stage-10-security-hardening)
13. [Stage 11: SOLID Principles & Best Practices](#13-stage-11-solid-principles--best-practices)
14. [Stage 12: Migration Waves & Sprint Plan (14 sprints)](#14-stage-12-migration-waves--sprint-plan)
15. [Risk Assessment](#15-risk-assessment)
16. [Key Decisions Before Starting](#16-key-decisions-before-starting)

---

## 1. Project Current State

| Metric | Count |
|--------|-------|
| Vue Components | 188 |
| Pages | 65 |
| Layouts | 6 |
| Vuex Store Modules | 21 (105 files) |
| Plugins | 24 |
| API Modules | 16 |
| Middleware | 2 |
| Locales | 6 languages (ar, en, tr, fr, es, ur) |
| Total Vue Code | ~67,000+ lines |
| Largest Component | `Messages.vue` (3,228 lines) |
| Largest Page | `withdraw/index.vue` (1,351 lines) |

**Current Stack:**
Nuxt 2.15.8 · Vue 2 · Vuetify 2.6 · Vuex · Webpack · @nuxtjs/auth-next · @nuxtjs/axios · @nuxtjs/i18n 7 · Firebase 9 (FCM only) · Pusher · Sentry 7 · vee-validate 3 · No tests · No TypeScript

**Key Patterns to Preserve:**
- **Toast control is per-method** — Components explicitly set `localStorage.setItem("toast", "true"/"false")` before specific API calls to control whether `$request` in `ApiCalls.js` shows error toasts. This is intentional, not a bug. In Nuxt 4, replace with a `showToast` option on the request composable (no localStorage).
- **Auth is deeply custom** — **405 `$auth` references across 94 files**, custom refresh scheme, cross-tab sync, FCM token sync. This is the highest-risk migration area.

**Target Stack:**
Nuxt 4.4+ · Vue 3.5+ · Vuetify 3 · Pinia 3 · Vite 7 · Nitro · TypeScript · @nuxtjs/i18n 10+ · Custom useAuth (cookie-based) + Nitro API proxy · ofetch · @sentry/nuxt · vee-validate 4 · Vitest + Playwright · nuxt-security

---

## 2. Why Nuxt 4 (Skip Nuxt 3)

| Factor | Nuxt 3 | Nuxt 4 |
|--------|--------|--------|
| **Status** | Maintenance only, EOL July 2026 | Stable since mid-2025 (latest v4.4+) |
| **Migration from Nuxt 2** | Supported via Nuxt Bridge | Direct migration supported |
| **Directory Structure** | Flat | `app/` directory (cleaner separation) |
| **Performance** | Good | Better — shallow refs by default, shared payload, optimized font handling |
| **Ecosystem** | Modules migrating to v4 | Active ecosystem, `moduleDependencies` API |
| **Future** | No new features | Active development, Nuxt 5 in early stages |

**Decision:** Migrate directly to Nuxt 4. Nuxt 3 would mean migrating twice (Nuxt 2 → 3, then 3 → 4) since Nuxt 3 is already in end-of-life phase.

**Migration Path Options:**
1. **Direct Nuxt 2 → Nuxt 4** (recommended): Fresh scaffold, migrate features wave by wave
2. **Nuxt Bridge → Nuxt 4**: Use Nuxt Bridge as stepping stone (adds complexity)

We recommend Option 1 — a clean Nuxt 4 scaffold is simpler than bridging.

---

## 3. Stage 1: Pre-Migration Cleanup (Still in Nuxt 2)

All changes stay inside the current Nuxt 2 codebase. Safe to deploy to production. Each task = one PR.

### 3.1 Remove Dead Code

**Risk: Very Low | Effort: 1–2 days**

| File | Reason | Action |
|------|--------|--------|
| `components/NuxtLogo.vue` | Zero references in codebase | Delete |
| `components/VuetifyLogo.vue` | Zero references in codebase | Delete |
| `plugins/auth-interceptor.js` | NOT loaded in `nuxt.config.js` — not in plugins, not in auth.plugins | Delete |
| `plugins/vue-plyr.js` | Commented out in config, BUT `<vue-plyr>` still used in `components/pages/service/Gallery.vue` | Replace `<vue-plyr>` with native `<video>` element, then delete plugin |
| `store/global/actions.js` | `refresh_token_DISABLED_USING_NUXT_AUTH_INSTEAD` function | Remove dead function body |

**Dead packages to remove (confirmed — not imported anywhere in source code):**

| Package | Reason |
|---------|--------|
| `vue-tel-input` ^5 | Not imported. `EditPhoneInput.vue` / `PhoneInput.vue` don't use it |
| `vue-pdf` ^4 | Duplicate — `plugins/vue-pdf.js` imports from `@teckel/vue-pdf`, not `vue-pdf` |
| `@sentry/tracing` ^7 | Not imported — tracing handled by `@nuxtjs/sentry` module |
| `core-js` ^3 | Only reference is a **broken import** in `NavDesktop.vue:161` (`import { locale } from "core-js"` — `locale` is not a core-js export). Fix the import first, then remove |

**Also sweep:**
- Commented-out code blocks throughout (`store/global/actions.js`, `schemes/customRefresh.js`, `plugins/mixins/filters_shared_script.js`)
- Remove `console.log` / `console.error` that leak debug info (per security audit)
- Fix broken `core-js` import in `components/layouts/default/NavDesktop.vue:161`
- Verification: `npm run build` after each deletion

### 3.2 Fix SSR-Unsafe Patterns

**Risk: Low–Medium | Effort: 5–7 days**

151 `localStorage` accesses across 56 files, 100 `window.` across 44 files, 69 `document.` across 25 files — many unguarded for SSR.

> **Note:** `plugins/ApiCalls.js` localStorage toast check is **already guarded** with `process.client` (line 14). No fix needed.
> **Note:** `plugins/mixins/add_edit_deal.js` localStorage accesses (lines 118–136) are inside **submit handlers** that only run on user interaction (client-side). Not SSR-unsafe — no fix needed.
> **Note:** Toast control via localStorage is **intentional per-method design** — components set `localStorage("toast", "true"/"false")` before specific `$request` calls to control error toast display. This pattern works correctly but will be replaced with a `showToast` request option in Nuxt 4 (see Stage 3 Architecture).

| File | Issue | Fix |
|------|-------|-----|
| `plugins/axios.js` (line 79) | `localStorage.removeItem("authurized")` in 302 case — runs during SSR | Wrap in `if (process.client)` |
| `components/shared/service/grid-style.vue` | 4 localStorage accesses | Move to `mounted()` |
| `components/layouts/default/NavDesktop.vue` | 3 localStorage + 6 `window.` accesses | Move to `mounted()` |
| `pages/home/index.vue` | 13 localStorage + 6 `window.` accesses | Audit each — move browser APIs to `mounted()` or guard with `process.client` |
| `pages/withdraw/index.vue` | 4 `window.` accesses | Guard with `process.client` |
| `pages/my-profile/index.vue` | 4 `document.` accesses | Move to `mounted()` |
| `components/pages/deals/DealDelivery.vue` | 13 `document.` accesses | Move to `mounted()` or use `$refs` |
| `components/pages/chat/Photo.vue` | 6 `document.` accesses | Move to `mounted()` or use `$refs` |
| `components/shared/PaymentComponent.vue` | 7 `window.` accesses | Guard with `process.client` |
| `store/filter_header/actions.js` | 4 localStorage + 2 `window.` accesses | Guard with `process.client` |

**Full audit needed:** Run `grep -rn "localStorage\|window\.\|document\." --include="*.vue" --include="*.js"` and categorize each as: (a) already guarded, (b) client-only context (mounted/click handler), (c) needs fix.

### 3.3 Complex Component Redesign (Dedicated Stages)

> **Decision (confirmed):** Complex components will be **redesigned during migration**, not migrated as-is. Each component gets its own dedicated stage with full Composition API rewrite, `<script setup>`, and proper decomposition.

**Risk: Medium–High | Effort: 15–20 days total**

All components below will be rewritten to `<script setup lang="ts">` with Composition API, proper sub-component extraction, and composable-based logic.

---

#### 3.3.1 Messages.vue (3,228 lines) — Chat System Redesign

**Priority: Highest complexity | Dependencies: Pusher, wavesurfer.js, lightbox, deals, ratings**

**Current responsibilities (all in one file):** UI rendering, WebSocket/Pusher management, audio recording, file uploads, deal cards, rating cards, infinite scroll, online status, message formatting, lightbox.

**Redesign plan — split into composables + components:**

| New File | Type | Responsibility | Est. Lines |
|----------|------|---------------|------------|
| `composables/useChat.ts` | Composable | Pusher connection, event binding, message CRUD | ~150 |
| `composables/useChatPresence.ts` | Composable | Online/offline status, tab tracking | ~80 |
| `composables/useChatAudio.ts` | Composable | Audio recording, wavesurfer integration | ~100 |
| `components/feature/chat/ChatPage.vue` | Container | Parent page, orchestrates composables | ~300 |
| `components/feature/chat/ChatHeader.vue` | Presentational | User info, status, actions | ~100 |
| `components/feature/chat/ChatMessageList.vue` | Presentational | Message rendering, infinite scroll | ~200 |
| `components/feature/chat/ChatComposer.vue` | Presentational | Text input, file attach, send button | ~150 |
| `components/feature/chat/ChatAudioRecorder.vue` | Presentational | Audio recording UI | ~100 |
| `components/feature/chat/ChatDealCard.vue` | Presentational | Deal info within chat | ~80 |
| `components/feature/chat/ChatRatingCard.vue` | Presentational | Rating prompt/display | ~80 |
| `components/feature/chat/ChatPhoto.vue` | Presentational | Photo messages + lightbox | ~80 |

**Key risks:** Pusher `.bind()` callbacks reference `this.` methods scattered throughout — event routing changes after split. All `$refs` chains will break. Must audit and map all Pusher event handlers before splitting.

---

#### 3.3.2 AddDeal.vue (1,446 lines) — Deal Creation Redesign

**Priority: High | Dependencies: vee-validate, file upload, currency, extra options**

**Redesign plan:**

| New File | Type | Responsibility | Est. Lines |
|----------|------|---------------|------------|
| `composables/useDealForm.ts` | Composable | Form state, validation, submission | ~120 |
| `components/feature/deals/DealFormPage.vue` | Container | Orchestrates form steps | ~200 |
| `components/feature/deals/DealFormHeader.vue` | Presentational | Deal type, service selection | ~100 |
| `components/feature/deals/DealBudgetSection.vue` | Presentational | Budget, currency, extras pricing | ~150 |
| `components/feature/deals/DealTermsSection.vue` | Presentational | Terms, timeline, requirements | ~100 |
| `components/feature/deals/DealAttachments.vue` | Presentational | File upload, preview | ~100 |

---

#### 3.3.3 MainServiceCard.vue (1,145 lines) — Service Card Redesign

**Priority: High | Dependencies: currency, favorites, tour, ratings, user auth**

**Redesign plan:**

| New File | Type | Responsibility | Est. Lines |
|----------|------|---------------|------------|
| `components/shared/ServiceCard.vue` | Container | Card logic, favorite toggle, tour | ~200 |
| `components/shared/ServiceCardMedia.vue` | Presentational | Image/video gallery thumbnail | ~100 |
| `components/shared/ServiceCardInfo.vue` | Presentational | Title, provider, rating, price | ~150 |
| `components/shared/ServiceCardActions.vue` | Presentational | CTA buttons, share, favorite | ~80 |

---

#### 3.3.4 DealDelivery.vue (1,042 lines) — Delivery Flow Redesign

**Priority: Medium | Dependencies: file upload, document handling, status tracking**

**Redesign plan:**

| New File | Type | Responsibility | Est. Lines |
|----------|------|---------------|------------|
| `composables/useDealDelivery.ts` | Composable | Delivery state, submission, approval | ~100 |
| `components/feature/deals/DeliveryPage.vue` | Container | Orchestrates delivery flow | ~200 |
| `components/feature/deals/DeliveryFileUpload.vue` | Presentational | File upload + preview | ~120 |
| `components/feature/deals/DeliveryTimeline.vue` | Presentational | Status history | ~100 |
| `components/feature/deals/DeliveryActions.vue` | Presentational | Accept/reject/request revision | ~80 |

---

#### 3.3.5 DealReview.vue (947 lines) — Deal Review Redesign

**Priority: Medium | Dependencies: ratings, currency, tour**

**Redesign plan:**

| New File | Type | Responsibility | Est. Lines |
|----------|------|---------------|------------|
| `components/feature/deals/DealReviewPage.vue` | Container | Review orchestration | ~200 |
| `components/feature/deals/DealReviewSummary.vue` | Presentational | Deal summary, amounts | ~120 |
| `components/feature/deals/DealReviewRating.vue` | Presentational | Star rating, feedback form | ~100 |
| `components/feature/deals/DealReviewStatus.vue` | Presentational | Status badges, actions | ~80 |

---

#### 3.3.6 grid-style.vue (970 lines) + row-style.vue (928 lines) — Service List Views Redesign

**Priority: Medium | Dependencies: currency, favorites, tour, localStorage**

These two components share ~70% logic. Redesign as a single composable with two display variants.

**Redesign plan:**

| New File | Type | Responsibility | Est. Lines |
|----------|------|---------------|------------|
| `composables/useServiceList.ts` | Composable | Shared list logic, filtering, sorting | ~100 |
| `components/shared/ServiceGridCard.vue` | Presentational | Grid layout variant | ~200 |
| `components/shared/ServiceRowCard.vue` | Presentational | Row layout variant | ~200 |

---

#### 3.3.7 File Upload System — Full Rebuild From Scratch

**Priority: High | Total current lines: 1,286 across 6 files | Used in: 6 different features**

> **Decision (confirmed):** The entire file upload / picker system will be **rebuilt from scratch** with proper architecture. The current system has massive code duplication, zero validation, no confirmation flows, and no proper state management.

**Current files (ALL will be deleted and replaced):**

| File | Lines | Problems |
|------|-------|----------|
| `FilePicker.vue` | 297 | Orchestrator, duplicate `isDisabled` prop (defined twice), no validation |
| `ImagePicker.vue` | 312 | Lightbox, main image selection, but no size/dimension validation |
| `VideoPicker.vue` | 164 | Copy-pasted methods (`available_stored_image`, `check_stored_image`, `previewFile`, `toggle_activate`, `check_if_link`) — identical to other pickers |
| `AudioPicker.vue` | 162 | Same copy-pasted methods, emits `set_main_image` (makes no sense for audio) |
| `PdfPicker.vue` | 162 | Same copy-pasted methods, no PDF preview |
| `DocumentPicker.vue` | 189 | Same copy-pasted methods, hardcoded file type icon mapping |

**Current problems:**
- **5 identical method blocks** copy-pasted across all sub-pickers (`available_stored_image`, `check_stored_image`, `previewFile`, `toggle_activate`, `check_if_link`)
- **Identical SCSS** copy-pasted in all 6 files
- **No file validation** — no size limits, no file count limits, no type verification
- **No delete confirmation** — clicking remove instantly emits, no "are you sure?"
- **No upload progress** — only a spinner, no percentage or progress bar
- **No disabled state** for max file count reached
- **No dynamic validation** — can't pass custom rules (e.g., "images required but audio optional")
- **No toast feedback** — no success/error messages on upload/delete
- **Broken prop** — `isDisabled` defined twice in FilePicker.vue

**Where the file system is used (6 features):**

| Feature | File | File Types Used |
|---------|------|----------------|
| Add Service (Step 2) | `components/pages/add-service/Step2Form.vue` | image, video, audio, pdf, documents |
| Edit Service | `components/ServiceFormUpdate.vue` | image, video, audio, pdf, documents |
| Add Deal | `components/pages/deals/AddDeal.vue` | image, video, audio, pdf, documents |
| Deal Deliveries | `pages/deals/index/_deal_id/add-delivers.vue` | image, video, audio, pdf, documents |
| Add Blog | `pages/add-blog/index.vue` | image |
| Edit Blog | `pages/edit-blog/_slug.vue` | image |
| Top-up Wallet | `pages/top-up-wallet/index.vue` | image (payment proof) |

**New architecture — rebuild from scratch:**

| New File | Type | Responsibility | Est. Lines |
|----------|------|---------------|------------|
| `composables/useFileUpload.ts` | Composable | Upload state, progress tracking, abort, retry | ~150 |
| `composables/useFileValidation.ts` | Composable | Size limits, type checking, count limits, dimension validation, custom rules | ~100 |
| `components/base/BaseFilePicker.vue` | Container | Main picker — drag & drop, click to browse, validation orchestration, toast feedback | ~250 |
| `components/base/BaseFilePreview.vue` | Presentational | Single file preview (auto-detects type: image/video/audio/pdf/doc) | ~150 |
| `components/base/BaseFileList.vue` | Presentational | File list with grid/row layout, reorder, progress bars | ~120 |
| `components/base/BaseDeleteConfirm.vue` | Presentational | Delete confirmation dialog | ~60 |
| `shared/utils/fileHelpers.ts` | Utility | File type detection, URL preview, icon mapping — pure functions (no duplication) | ~80 |

**Key features the new system MUST support:**

| Feature | Description |
|---------|-------------|
| **Dynamic validation** | Pass rules as props: `{ maxSize: '5MB', maxCount: 10, required: true, acceptTypes: ['image/*', 'video/*'] }` |
| **Per-field validation** | Some forms need images required but audio optional — each picker instance gets its own rules |
| **Upload progress** | Real progress bar per file (percentage), not just a spinner |
| **Delete confirmation** | Confirmation dialog before delete, with optional toast on success |
| **Toast control** | `showToast` prop — display success/error messages or stay silent |
| **Disabled state** | Auto-disable picker when max file count reached, or when `disabled` prop is true |
| **Loading states** | Uploading, deleting, processing — each with distinct visual feedback |
| **Main image selection** | For images: select which is the "main" image (carried from current behavior) |
| **Lightbox preview** | For images: click to enlarge (use `vue-easy-lightbox` Vue 3 build) |
| **Drag & drop** | Native HTML5 drag and drop zone |
| **File type icons** | Automatic icon by file extension (pdf, docx, xlsx, ppt, zip, etc.) |
| **Accessibility** | ARIA labels, keyboard navigation, screen reader announcements |

---

#### 3.3.8 Add Service Form System (5 components, 2,971 lines total)

**Priority: High | Dependencies: FilePicker (3.3.7), vee-validate, categories, currency**

These 5 components form the multi-step service creation wizard. Redesign as a cohesive system during Sprint 9.

| Current File | Lines | Responsibility |
|--------------|-------|---------------|
| `MainData.vue` | 744 | Service title, description, category selection |
| `Step2Form.vue` | 683 | Media upload (uses FilePicker), requirements |
| `BudgetForm.vue` | 601 | Pricing, packages, delivery time |
| `ExtraOptions.vue` | 486 | Extra service options, add-ons |
| `AddressForm.vue` | 457 | Location, address, map |
| + `ServiceFormUpdate.vue` | 356 | Edit service (reuses above components) |
| + Smaller components | ~470 | Step1Form, Step3Form, CategoriesGuide, FormSteps, etc. |

**Redesign plan:**

| New File | Type | Est. Lines |
|----------|------|------------|
| `composables/useServiceForm.ts` | Composable — multi-step form state, validation, save draft | ~200 |
| `components/feature/services/ServiceFormWizard.vue` | Container — step orchestration | ~200 |
| `components/feature/services/ServiceBasicInfo.vue` | Presentational — title, description, category | ~200 |
| `components/feature/services/ServiceMedia.vue` | Presentational — uses BaseFilePicker | ~150 |
| `components/feature/services/ServicePricing.vue` | Presentational — budget, packages, extras | ~250 |
| `components/feature/services/ServiceLocation.vue` | Presentational — address, map | ~150 |
| `components/feature/services/ServiceExtras.vue` | Presentational — add-on options | ~150 |

---

#### 3.3.9 Deal Extra Components (ExtraDrawer + CardDeal, 1,150 lines)

**Priority: Medium | Dependencies: currency, deals store**

| Current File | Lines | Responsibility |
|--------------|-------|---------------|
| `ExtraDrawer.vue` | 655 | Deal extras selection drawer |
| `CardDeal.vue` | 495 | Deal card display in listings |

**Redesign plan:**

| New File | Type | Est. Lines |
|----------|------|------------|
| `components/feature/deals/DealExtrasDrawer.vue` | Container — extras selection | ~200 |
| `components/feature/deals/DealExtraItem.vue` | Presentational — single extra | ~80 |
| `components/feature/deals/DealCard.vue` | Presentational — deal card | ~200 |
| `components/feature/deals/DealCardStatus.vue` | Presentational — status badge + actions | ~80 |

---

#### 3.3.10 Payment & Wallet Components (1,684 lines total)

**Priority: Medium | Dependencies: payment gateway (Tap), currency, auth**

| Current File | Lines | Responsibility |
|--------------|-------|---------------|
| `ByCardSection.vue` | 557 | Card payment form |
| `ModalInsertInfo.vue` | 333 | Payment info modal |
| `ModalInsertBankAccount.vue` | 320 | Bank account entry modal |
| `ModalInsertCard.vue` | 223 | Card entry modal |
| `PaymentComponent.vue` (shared) | 251 | Shared payment component |

**Redesign plan:**

| New File | Type | Est. Lines |
|----------|------|------------|
| `composables/usePayment.ts` | Composable — Tap SDK integration, payment state | ~150 |
| `components/feature/wallet/PaymentCardForm.vue` | Presentational — card input | ~200 |
| `components/feature/wallet/BankAccountForm.vue` | Presentational — bank details | ~150 |
| `components/feature/wallet/PaymentMethodSelector.vue` | Container — method selection | ~150 |

---

#### 3.3.11 Navigation & Layout Components (1,162 lines total)

**Priority: Medium | Dependencies: auth, i18n, currency, search, categories**

| Current File | Lines | Responsibility |
|--------------|-------|---------------|
| `CategoriesNavBar.vue` | 527 | Home page category navigation |
| `MobileMenu.vue` | 425 | Mobile navigation drawer |
| `NavDesktop.vue` | 403 | Desktop navigation bar |
| `SearchBar.vue` | 334 | Search functionality |

These will be redesigned during layout migration (Sprint 8). Each gets `<script setup>` rewrite with composables.

---

#### 3.3.12 Category & Filter Components

| Current File | Lines | Responsibility |
|--------------|-------|---------------|
| `FiltersForm.vue` | 472 | Category page filter panel |

Redesign during category page migration (Sprint 9).

---

#### 3.3.13 Card Components

| Current File | Lines | Responsibility |
|--------------|-------|---------------|
| `MainBlogCard.vue` | 453 | Blog post card |
| `MainServiceCard.vue` | 1,145 | Already covered in 3.3.3 |

`MainBlogCard.vue` redesign during blog migration (Sprint 10).

---

#### 3.3.14 Large Pages — Full Inventory (Redesign During Migration Wave)

**ALL pages 400+ lines.** Each will be rewritten to `<script setup lang="ts">` with extracted composables and sub-components during its sprint.

| Page | Lines | Migration Sprint | Key Complexity |
|------|-------|-----------------|----------------|
| `pages/withdraw/index.vue` | 1,351 | Sprint 12 | Payment flow, bank selection, validation |
| `pages/my-profile/index.vue` | 1,269 | Sprint 12 | Profile edit, avatar cropper, social links |
| `pages/services/_slug.vue` | 1,267 | Sprint 9 | Service detail, SEO, gallery, deals CTA |
| `pages/mark-service/_id.vue` | 1,267 | Sprint 12 | Service marking/editing flow |
| `pages/plans/index.vue` | 1,248 | Sprint 10 | Subscription plans, comparison, upgrade |
| `pages/my-services/_type.vue` | 1,248 | Sprint 12 | Service list, filtering, status tabs |
| `pages/deals/.../payment.vue` | 949 | Sprint 11 | Deal payment, Tap integration |
| `pages/otp-confirmation/index.vue` | 733 | Sprint 8 | OTP flow, timer, resend |
| `pages/provider/_slug.vue` | 717 | Sprint 9 | Provider profile, services, reviews |
| `pages/my-deals/_type.vue` | 704 | Sprint 11 | Deal list, filtering, status tabs |
| `pages/deals/index.vue` | 599 | Sprint 11 | Deal overview page |
| `pages/top-up-wallet/index.vue` | 596 | Sprint 12 | Wallet top-up, payment methods |
| `pages/home/index.vue` | 571 | Sprint 8 | Homepage, categories, featured |
| `pages/dashboard/index.vue` | 565 | Sprint 11 | Dashboard overview, stats |
| `pages/deals/.../add-delivers.vue` | 547 | Sprint 11 | Delivery submission, file upload |
| `pages/edit-blog/_slug.vue` | 473 | Sprint 10 | Blog editor, TipTap, media |
| `pages/my-wallet/index.vue` | 448 | Sprint 12 | Wallet overview, transactions |
| `pages/auth/two-factor-authentication.vue` | 446 | Sprint 8 | 2FA setup/verify |
| `pages/auth/sign-up.vue` | 440 | Sprint 8 | Registration form |
| `pages/blog/_slug.vue` | 439 | Sprint 10 | Blog post detail, SEO |
| `pages/two-step-verification/index.vue` | 436 | Sprint 8 | 2-step verification flow |
| `pages/deals/.../implementation/index.vue` | 410 | Sprint 11 | Deal implementation tracking |
| `pages/payment-by-card/index.vue` | 404 | Sprint 12 | Direct card payment |

### 3.4 Dead Assets Cleanup

**Risk: Very Low | Effort: 1 day**

**91 unreferenced asset files** found across the project. These files are not imported, required, or referenced in any `.vue`, `.js`, `.scss`, or `.css` file. Delete during Sprint 1.

> **Note:** Dynamic `require()` patterns were audited (e.g., `require(\`~/assets/svg/${item.icon}.svg\`)` in DashboardAside, MobileAside, about-us). All dynamically loaded assets are accounted for and excluded from this list.

#### Dead Icons — `assets/icons/` (24 files)

| File | Reason |
|------|--------|
| `app-store.png` | Not referenced (SVG version in `assets/images/app/` is used) |
| `apple.png` | Not referenced (`apple.svg` is used instead) |
| `budget.svg` | Zero references |
| `check-green.svg` | Zero references |
| `download-deliver.svg` | Zero references |
| `gear.svg` | Zero references |
| `google-play.png` | Not referenced (SVG version in `assets/images/app/` is used) |
| `google.png` | Not referenced (`google.svg` is used instead) |
| `hart.svg` | Zero references (misspelling of "heart") |
| `report.svg` | Zero references |
| `service-marked.svg` | Zero references |
| `sm-linkedin.svg` | Zero references (other linkedin icons used) |
| `sm-twitter.svg` | Zero references (sm-x.svg used instead) |
| `sm-website.svg` | Zero references |
| `sm-wechat.svg` | Zero references |
| `unlock.svg` | Zero references |
| `dashboard-icons/add-friend.png` | Zero references |
| `dashboard-icons/dashboards.png` | Zero references |
| `dashboard-icons/heart.png` | Zero references |
| `dashboard-icons/location.png` | Zero references |
| `dashboard-icons/star_FILL0_wght400_GRAD0_opsz48.png` | Zero references |
| `plans/clock.svg` | Zero references |
| `plans/Progress Circle.svg` | Zero references |
| `plans/red-tag-icon.svg` | Zero references |

> **Entire `dashboard-icons/` folder can be deleted** — all 5 files are dead.

#### Dead Social Media Icons — `assets/icons/social-media-icons/` (13 files)

These are **old versions** superseded by `updated-social-icons/` or `-small` variants:

| Dead File | Replacement Used Instead |
|-----------|------------------------|
| `behance.png` | `updated-social-icons/behance.png` |
| `dribble.png` | `updated-social-icons/dribble.png` |
| `drive.png` | `updated-social-icons/drive.png` |
| `fb.svg` | `social-media-icons/fb-small.svg` |
| `github.png` | `updated-social-icons/github.png` |
| `instagram.svg` | `social-media-icons/instagram-small.svg` |
| `linkedin.svg` | `social-media-icons/linkedin-small.svg` |
| `pinterest.png` | `updated-social-icons/pinterest.png` |
| `tumblr.png` | Not used at all |
| `twitter-small.svg` | Not used — `sm-x.svg` used instead |
| `twitter.svg` | `updated-social-icons/twitter.svg` |
| `unsplash.png` | `updated-social-icons/unsplash.png` |
| `vimeo.png` | `updated-social-icons/vimeo.png` |

**Still used in `social-media-icons/`:** `youtube.svg`, `instagram-small.svg`, `fb-small.svg`, `link-small.svg`, `linkedin-small.svg`, `snapchat.svg`, `tiktok.svg`

#### Dead Updated Social Icons — `assets/icons/updated-social-icons/` (11 files)

SVG duplicates where only the PNG version is actually imported:

| Dead SVG | PNG Version Used Instead |
|----------|------------------------|
| `behance.svg` | `behance.png` is imported |
| `dribble.svg` | `dribble.png` is imported |
| `drive.svg` | `drive.png` is imported |
| `github.svg` | `github.png` is imported |
| `pinterest.svg` | `pinterest.png` is imported |
| `tumblr.png` | Not used at all |
| `tumblr.svg` | Not used at all |
| `unsplash.svg` | `unsplash.png` is imported |
| `vimeo.svg` | `vimeo.png` is imported |
| `web_site.svg` | `website.svg` is used (different name) |
| `wechat.svg` | `wechat.png` is imported |

#### Dead Images — `assets/images/` (8 files)

| File | Reason |
|------|--------|
| `account.jpeg` | Zero references |
| `category/category-card.png` | Zero references (duplicate exists in `imgs/category/`) |
| `jobs/category-icon.png` | Zero references |
| `jobs-img/job-image.png` | Zero references |
| `new_header.png` | Zero references (`new_header_img.webp` is used) |
| `provider/empty-reviews.svg` | Zero references |
| `wallet/american-express.svg` | Zero references |
| `wallet/mada.svg` | Zero references |

> **Entire `jobs/` and `jobs-img/` folders can be deleted** — all files are dead.

#### Dead Images — `assets/imgs/` (17 files)

| File | Reason |
|------|--------|
| `app/app-store.png` | Zero references (SVG version in `assets/images/app/` is used) |
| `app/google-play.png` | Zero references (SVG version in `assets/images/app/` is used) |
| `category/category-card.png` | Zero references (duplicate of `assets/images/category/`) |
| `chat/mobile-block.png` | Zero references |
| `chat/sent-check.svg` | Zero references |
| `chat/Vector.png` | Zero references |
| `deals/card-tick.svg` | Zero references |
| `deals/magicpen.svg` | Zero references |
| `deals/profile-tick.svg` | Zero references |
| `Jobs/category-icon.png` | Zero references |
| `jobs-img/job-image.png` | Zero references |
| `popup.jpg` | Zero references |
| `provider/1.jpg` | Zero references |
| `provider/phonecall.svg` | Zero references (`phone.svg` is used) |
| `rating/blocked.png` | Zero references (`blocked.svg` is used) |
| `rating/empty-state-review.svg` | Zero references (code uses `empty-state-reviews.svg` — note the 's') |
| `rating/hello.png` | Zero references |

> **Entire `Jobs/` and `jobs-img/` folders can be deleted.**
> **Duplicate folders:** `assets/imgs/app/`, `assets/imgs/category/` duplicate `assets/images/app/`, `assets/images/category/` — consolidate during migration.

#### Dead SVGs — `assets/svg/` (20 files)

| File | Reason |
|------|--------|
| `clock.svg` | Zero references |
| `countries-background.svg` | Zero references |
| `down-arrow.svg` | Zero references |
| `eye-closed-white.svg` | Zero references |
| `eye-opened-white.svg` | Zero references |
| `find-out.svg` | Zero references |
| `gear.svg` | Zero references |
| `header.svg` | Zero references |
| `location1.svg` | Zero references |
| `new_header-cropped.svg` | Zero references |
| `new_header.svg` | Zero references |
| `no-bio.svg` | Zero references |
| `no-reviews.svg` | Zero references |
| `no-service.svg` | Zero references |
| `reason_not_register.svg` | Zero references (`.jpg` version is used) |
| `report.svg` | Zero references |
| `Rocket.svg` | Zero references |
| `see-more.svg` | Zero references |
| `success_check.svg` | Zero references |
| `testAd.svg` | Zero references |

**Still used in `assets/svg/` (dynamically loaded):** `2fa.svg`, `brief-case.svg`, `deals.svg`, `followers-icon.svg`, `heart.svg`, `logout.svg`, `money-3.svg`, `qr-code-aside.svg`, `qr-icon.svg`, `printer-icon.svg`, `squares.svg`, `store-icon.svg`, `user.svg`, `wallet.svg`, `article-line.svg`, `job-seek-logo.svg`, `mazaady-logo.svg`, `mazaady-system-logo.svg`, `bulb-bro.svg`, `business-project-pana.svg`, `our-map.svg`, `website-creator-pana.svg`, `remove-button.svg`

#### Dead Static Files — `static/` (2 files)

| File | Reason |
|------|--------|
| `vuetify-logo.svg` | Only used by `VuetifyLogo.vue` (already marked as dead component) |
| `icons/pdf_icon.png` | Zero references |

> `icons/` folder inside `static/` has 3 files (`apple.svg`, `facebook.svg`, `google.svg`). Check if these are used by external services (OAuth providers) before deleting.

#### Summary

| Folder | Dead Files | Action |
|--------|-----------|--------|
| `assets/icons/` (root + sub) | 48 | Delete files, delete `dashboard-icons/` folder entirely |
| `assets/images/` | 8 | Delete files, delete `jobs/` and `jobs-img/` folders |
| `assets/imgs/` | 17 | Delete files, delete `Jobs/` and `jobs-img/` folders |
| `assets/svg/` | 20 | Delete files |
| `static/` | 2 | Delete files |
| **Total** | **95** | **~27% of all 357 media assets are dead** |

#### Additional Cleanup Notes

1. **Duplicate folder structure:** `assets/images/` and `assets/imgs/` overlap (app, category, faq, header, jobs-img, provider). During Nuxt 4 migration, consolidate into a single `assets/images/` folder
2. **Social media icon chaos:** Three separate folders (`social-media-icons/`, `updated-social-icons/`, `sm-*.svg` in icons root). During migration, consolidate into one `assets/icons/social/` folder with one file per platform
3. **PNG/SVG duplicates:** Multiple icons exist as both PNG and SVG. Standardize on SVG during migration

---

### 3.5 Responsive by Media Query — Replace JS-Based Device Detection

**Risk: Medium | Effort: 5–7 days | Priority: High**

> **Problem:** The entire codebase uses a JavaScript-based `device_width` Vuex store + `window.innerWidth` resize listener to detect mobile vs desktop. This causes:
> 1. **Duplicate components** — separate Mobile/Desktop versions of the same component (13 pairs found)
> 2. **Layout flash on load** — JS defaults to desktop (`width === -1 ? false`), then switches to mobile after hydration
> 3. **SSR mismatch** — `window.innerWidth` is unavailable on server, causing hydration warnings
> 4. **Performance waste** — JS resize listener runs debounced at 250ms + Vuex dispatch on every resize
> 5. **63 occurrences across 34 files** — deeply embedded pattern throughout the codebase
> 6. **Components rendered but hidden** — `v-if="getIsMobile"` still runs component logic on desktop, `v-show` renders both and hides one with CSS

**Current architecture (DELETE in Nuxt 4):**
- `store/device_width/` — Vuex store with `is_mobile` state, `getIsMobile` getter (`< 900px`)
- `plugins/window-resize.js` — Client plugin, listens to `window.resize`, dispatches to store
- `$store.getters['device_width/getIsMobile']` — Used in 34 files (63 times)

**Nuxt 4 replacement: CSS media queries + Vuetify 3 `useDisplay()`**

In Nuxt 4, responsive behavior should be handled by:
1. **CSS media queries** — for show/hide, layout changes, sizing (zero JS, no hydration issues)
2. **Vuetify 3 `useDisplay()`** — for the rare cases where JS logic truly depends on viewport (already reactive, SSR-safe via `ssrClientHints`)
3. **Vuetify 3 `<v-responsive>`** — for container-based responsive behavior

```ts
// Nuxt 4 — for the rare JS cases
const { mobile, mdAndUp, lgAndUp } = useDisplay()

// CSS — for ALL show/hide and layout cases
.desktop-only { display: none; }
@media (min-width: 900px) { .desktop-only { display: block; } }

.mobile-only { display: block; }
@media (min-width: 900px) { .mobile-only { display: none; } }
```

---

#### 3.5.1 Duplicate Mobile/Desktop Component Pairs (13 pairs — MERGE)

These pairs exist because of JS-based detection. In Nuxt 4, merge each pair into **one responsive component** using CSS media queries and Vuetify's responsive props.

| Desktop Component | Mobile Component | Action |
|---|---|---|
| `FormStepsDesktop.vue` (70 lines) | `FormStepsMobile.vue` (72 lines) | Merge → single `FormSteps.vue` with CSS breakpoints |
| `NavDesktop.vue` (403 lines) | `NavMobile.vue` (109 lines) | Merge → single `AppNav.vue` with responsive layout |
| `DesktopAside.vue` (209 lines) | `MobileAside.vue` (201 lines) | Merge → single `DashboardSidebar.vue` with drawer breakpoint |
| `DesktopUserMenu.vue` (79 lines) | `MobileMenu.vue` (425 lines) | Merge → single `UserMenu.vue` with responsive drawer |
| `DesktopButtons.vue` (98 lines) | (inline in MobileMenu) | Merge into `UserMenu.vue` |
| `NotificationsMenuDesktop.vue` (159 lines) | (inline in MobileMenu) | Merge → single `NotificationsMenu.vue` |
| `SearchBar.vue` (334 lines) | `MobileSearchMenu.vue` (201 lines) | Merge → single `SearchBar.vue` with responsive overlay |
| `HeaderDesktop.vue` (category) | `HeaderMobile.vue` (category) | Merge → single `CategoryHeader.vue` |
| `LanguageSwitcher.vue` (209 lines) | `MobileLanguageMenu.vue` (104 lines) | Merge → single `LanguageSwitcher.vue` |
| `UserCurrencyWrapper.vue` (43 lines) | `MobileCurrency.vue` (149 lines) | Merge → single `CurrencySwitcher.vue` |
| `CustomNav.vue` shows desktop nav | `CustomNav.vue` shows mobile nav | Refactor — use CSS to toggle, not `v-show` with getter |
| `CategoriesNavBar.vue` desktop section | `CategoriesNavBar.vue` mobile section | Refactor — one layout, responsive CSS |
| `AuthInfo.vue` desktop section | `AuthInfo.vue` mobile section | Refactor — one layout, responsive CSS |

> **Result:** ~13 duplicate component pairs → ~13 single responsive components. Eliminates ~1,500 lines of duplicated code.

---

#### 3.5.2 v-if/v-show Toggling with getIsMobile (44 occurrences — REPLACE WITH CSS)

All `v-if="$store.getters['device_width/getIsMobile']"` and `v-show` toggles should be replaced with CSS classes:

**Pattern A: Show/hide blocks (MOST COMMON — 38 occurrences)**

Replace JS toggle with CSS utility classes:

```vue
<!-- BEFORE (Nuxt 2) — JS-based, causes hydration mismatch -->
<div v-if="!$store.getters['device_width/getIsMobile']">Desktop content</div>
<div v-if="$store.getters['device_width/getIsMobile']">Mobile content</div>

<!-- AFTER (Nuxt 4) — CSS-based, SSR-safe, no flash -->
<div class="d-none d-md-block">Desktop content</div>
<div class="d-block d-md-none">Mobile content</div>
```

> Vuetify 3 provides `d-none`, `d-md-block`, `d-lg-flex`, etc. — built-in responsive display classes. Zero JS needed.

**Affected files (show/hide pattern):**

| File | Occurrences | What toggles |
|------|------------|-------------|
| `pages/category/_slug.vue` | 6 | Filter sidebar desktop/mobile, sort bar |
| `pages/providers/index.vue` | 6 | Filter sidebar desktop/mobile, sort bar |
| `components/pages/add-service/CategoriesGuide.vue` | 5 | Category tree desktop/mobile layout |
| `pages/two-step-verification/index.vue` | 3 | 2FA step images mobile-only |
| `pages/my-profile/index.vue` | 3 | Profile header desktop/mobile |
| `pages/add-blog/index.vue` | 3 | Blog form layout |
| `components/pages/deals/DealReview.vue` | 3 | Delivery files section |
| `components/layouts/default/CustomNav.vue` | 2 | Desktop nav vs mobile nav |
| `components/shared/AuthInfo.vue` | 2 | Social icons desktop-only |
| `components/pages/add-service/AddressForm.vue` | 2 | Map layout desktop/mobile |
| `pages/blogs/index.vue` | 2 | Blog grid layout |
| `pages/deals/index.vue` | 2 | Deal card actions |
| `components/pages/home/WorkStepsSection.vue` | 2 | Step images mobile-only |
| `components/pages/add-service/FormStepsMobile.vue` | 1 | Entire component mobile-only |
| `components/pages/add-service/FormStepsDesktop.vue` | 1 | Entire component desktop-only |
| `components/pages/add-service/MainData.vue` | 1 | Category breadcrumb desktop-only |
| `components/shared/service/row-style.vue` | 1 | Provider info desktop-only |
| `components/shared/Notification.vue` | 1 | Notification popup desktop-only |
| `components/shared/FilterHeader.vue` | 1 | Filter header desktop-only |
| `components/pages/my-articles/index.vue` | 1 | Articles header desktop-only |
| `components/pages/category/HeaderMobile.vue` | 1 | Entire component mobile-only |
| `components/inputs/whatsappInput.vue` | 1 | Label desktop-only |
| `components/inputs/PhoneInput.vue` | 1 | Label mobile-only |
| `pages/my-qr-code/index.vue` | 1 | QR steps desktop-only |

---

#### 3.5.3 Dynamic Values Based on getIsMobile (8 occurrences — REPLACE WITH CSS OR useDisplay)

These use getIsMobile to compute dynamic values (not just show/hide). Some can be CSS, some need `useDisplay()`:

| File | Current Code | Nuxt 4 Replacement |
|------|-------------|-------------------|
| `pages/my-services/_type.vue:850` | `getIsMobile ? "100%" : "30%"` (dialog width) | CSS: `width: 30%; @media (max-width: 899px) { width: 100%; }` |
| `pages/plans/index.vue:403` | `:vertical="!getIsMobile"` (stepper direction) | Vuetify 3: `<v-stepper :mobile="mobile"` with `useDisplay()` |
| `components/pages/add-service/CategoriesGuide.vue:23` | `:width="getIsMobile ? '600' : '1000'"` (dialog width) | CSS: `max-width: 1000px; @media (max-width: 899px) { max-width: 600px; }` |
| `components/pages/add-service/CategoriesGuide.vue:52` | `'overflow-x': getIsMobile` (style binding) | CSS: `@media (max-width: 899px) { overflow-x: auto; }` |
| `components/pages/add-service/ExtraOptions.vue:446` | `getIsMobile ? "19em" : "100%"` (drawer width) | CSS: `width: 100%; @media (max-width: 899px) { width: 19em; }` |
| `components/profile/QrCard.vue:6` | `width: getIsMobile` (dynamic width) | CSS: responsive width with media query |
| `components/pages/deals/DealReview.vue:274` | `:isMobile="getIsMobile"` (prop pass-through) | Remove prop — child uses CSS or `useDisplay()` internally |
| `components/pages/provider/SocialMediaCard.vue:9` | `:small="getIsMobile ? true : false"` (icon size) | Vuetify 3: use responsive `size` prop or CSS |

---

#### 3.5.4 JS Resize Listener (support.vue — REPLACE)

| File | Current Code | Nuxt 4 Replacement |
|------|-------------|-------------------|
| `components/layouts/support.vue:186` | `this.isMobile = window.innerWidth <= 768` (manual resize) | CSS class on chat window: `@media (max-width: 768px) { .chat-window { /* full-screen */ } }` |

---

#### 3.5.5 Computed/Method Checks (Editor.vue — REPLACE)

| File | Current Code | Nuxt 4 Replacement |
|------|-------------|-------------------|
| `components/Editor.vue:86` | `getIsMobile && ...` (conditional toolbar) | `useDisplay()` if toolbar config truly differs, or responsive CSS for toolbar layout |

---

#### 3.5.6 Files to DELETE in Nuxt 4

| File | Reason |
|------|--------|
| `store/device_width/state.js` | Replaced by CSS media queries + `useDisplay()` |
| `store/device_width/mutations.js` | Replaced by CSS media queries + `useDisplay()` |
| `store/device_width/getters.js` | Replaced by CSS media queries + `useDisplay()` |
| `store/device_width/actions.js` | Replaced by CSS media queries + `useDisplay()` |
| `plugins/window-resize.js` | No longer needed — CSS handles responsive, `useDisplay()` for JS cases |
| `components/pages/add-service/FormStepsMobile.vue` | Merged into single `FormSteps.vue` |
| `components/pages/add-service/FormStepsDesktop.vue` | Merged into single `FormSteps.vue` |
| `components/pages/category/HeaderMobile.vue` | Merged into `CategoryHeader.vue` |

---

#### 3.5.7 Migration Steps

1. **During Nuxt 4 scaffold (Sprint 5):**
   - Do NOT create `device_width` store or `window-resize` plugin
   - Add Vuetify 3 `ssrClientHints` for SSR-safe display detection
   - Define responsive utility classes (`mobile-only`, `desktop-only`) if Vuetify's `d-*` classes aren't enough

2. **During each page migration (Sprints 8–12):**
   - Replace every `v-if/v-show getIsMobile` with Vuetify responsive classes (`d-none d-md-block`)
   - Merge duplicate Mobile/Desktop component pairs into single responsive components
   - Replace dynamic value patterns with CSS media queries or `useDisplay()`
   - Remove all `$store.getters['device_width/getIsMobile']` references

3. **Verify:** Each migrated page must render correctly at 320px, 768px, 1024px, 1440px without JS-based detection

---

### 3.6 Prepare Mixins for Composable Conversion

**Risk: Low | Effort: 2 days**

Create standalone utility functions (`utils/currency.js`, `utils/string.js`) alongside existing global mixins. Use utilities in new code. Full mixin removal during migration.

### 3.7 Clean Up Store Modules

**Risk: Low | Effort: 2–3 days**

- Extract duplicate reset sequences in `store/update_service/actions.js`
- Fix empty `catch {}` blocks in `store/chat/actions.js`
- Standardize error handling: return data on success, throw on failure, never silent swallow

---

## 4. Stage 2: Dependency Audit & Version Map

### 4.1 Current → Target Version Map

#### Core Framework

| Current | Target | Notes |
|---------|--------|-------|
| `nuxt` ^2.15.8 | `nuxt` ^4.4+ | Complete rewrite of config and structure |
| `vue` 2 | `vue` ^3.5+ (bundled) | Composition API, `<script setup>`, reactivity changes |
| `vuetify` ^2.6 | `vuetify` ^3.7+ | Component API changes, grid → flex/grid, RTL mature |
| `@nuxtjs/vuetify` ^1.12 | `vuetify-nuxt-module` ^1.0.0-beta.2 | Official Nuxt module — do NOT install `vite-plugin-vuetify` alongside it (conflict). Also install `sass-embedded` |

#### State & Data

| Current | Target | Notes |
|---------|--------|-------|
| Vuex (22 modules) | **Pinia** ^3+ | Official Vue 3 state manager, setup stores, DevTools |
| `@nuxtjs/axios` ^5 | **`ofetch`** (built-in) | `useFetch`, `useAsyncData`, `$fetch` — no extra dep |
| `@nuxtjs/auth-next` | **Custom `useAuth` composable** (cookie-based, see 5.2.6 below) | 380 `$auth` refs across 90 files — custom cookie-based auth with Nitro API proxy |

> **IMPORTANT — `useAsyncData` / `useFetch` Nuxt 4 Breaking Changes:**
>
> | Change | Nuxt 3 | Nuxt 4 | Action |
> |--------|--------|--------|--------|
> | Default `data`/`error` value | `null` | `undefined` | Use `!data.value` instead of `=== null` |
> | `data` ref type | `ref` (deep) | `shallowRef` | Use `{ deep: true }` for nested mutations, or replace entire objects |
> | Stale data on refetch | Preserved | Cleared to `undefined` | Use `getCachedData` to preserve if needed |
> | Same-key calls | Independent | Shared refs | Every call must have a unique key |

#### Forms & Validation

| Current | Target | Notes |
|---------|--------|-------|
| `vee-validate` ^3 | **`vee-validate`** ^4 | Composition API: `useForm`, `useField`, `defineField` |
| `v-mask` ^2 | **`maska`** ^3 | Vue 3 directive, lighter, better maintained |

#### i18n

| Current | Target | Notes |
|---------|--------|-------|
| `@nuxtjs/i18n` ^7 | **`@nuxtjs/i18n`** ^10+ | Nuxt 4 compatible, composable API (`useI18n`, `useLocalePath`) |

#### Monitoring & Error Tracking

| Current | Target | Notes |
|---------|--------|-------|
| `@nuxtjs/sentry` ^8 + `@sentry/tracing` ^7 | **`@sentry/nuxt`** (latest) | Official Sentry Nuxt module, built-in tracing |

#### Firebase & Real-time

| Current | Target | Notes |
|---------|--------|-------|
| `@nuxtjs/firebase` ^8 + `firebase` ^9 | **`firebase`** ^11+ (direct SDK) | Only using FCM — custom client plugin, no module needed |
| `pusher-js` ^8.4.0-rc2 | **`pusher-js`** ^8.4+ (stable) | Framework-agnostic, move off RC |

#### Rich Text & Media

| Current | Target | Notes |
|---------|--------|-------|
| `tiptap-vuetify` ^2 | **`@tiptap/vue-3`** + extensions | Vue 2 specific → Vue 3 native |
| `wavesurfer.js` ^7 | **`wavesurfer.js`** ^7 (latest) | Framework-agnostic, keep |
| `vue-easy-lightbox` ^0.20 | **`vue-easy-lightbox`** ^1+ | Vue 3 build |
| `vue-advanced-cropper` ^1 | **`vue-advanced-cropper`** ^2+ | Vue 3 build |

#### UI Components

| Current | Target | Notes |
|---------|--------|-------|
| `vue-toastification` ^1 | **`vue-toastification`** ^2 | Vue 3 build |
| `vue-infinite-loading` ^2 | **Custom `useInfiniteScroll` composable** | Use `IntersectionObserver` — no dep needed |
| `vue-tour` ^2 | **`vue3-tour`** or custom | Vue 3 compatible |
| `vue-tel-input` ^5 | **`vue-tel-input`** ^8+ | Vue 3 build |
| `vue-pdf` + `@teckel/vue-pdf` | **`@tato30/vue-pdf`** | Vue 3 PDF viewer |
| `@chenfengyuan/vue-qrcode` v1 | **`@chenfengyuan/vue-qrcode`** v2+ | Vue 3 build |

#### Build & Config

| Current | Target | Notes |
|---------|--------|-------|
| `@nuxtjs/dotenv` ^1 | **Built-in `runtimeConfig`** | Nuxt 4 native — delete dependency |
| `@nuxtjs/sitemap` ^2 | **`@nuxtjs/sitemap`** (latest, Nuxt 4 compatible) | Config migration |
| `core-js` ^3 | **Remove** | Vite + modern targets don't need it |
| `vue-server-renderer` | **Remove** | Bundled with Nuxt 4 |
| `vue-template-compiler` | **Remove** | Bundled with Nuxt 4 |
| `html2pdf.js` | **Keep as-is** | Framework-agnostic |
| `isomorphic-dompurify` | **Keep as-is** | Framework-agnostic |

### 4.2 Dead Packages (Remove Now — Pre-Migration)

These packages are in `package.json` but are **not imported or used** anywhere in the source code:

| Package | Status | Evidence |
|---------|--------|----------|
| **`vue-tel-input`** ^5 | **DEAD — Remove** | Not imported anywhere. Phone input components (`EditPhoneInput.vue`, `PhoneInput.vue`) exist but do NOT use this package |
| **`vue-pdf`** ^4 | **DEAD — Remove** | Plugin `plugins/vue-pdf.js` imports from `@teckel/vue-pdf`, not `vue-pdf`. This is a leftover duplicate |
| **`@sentry/tracing`** ^7 | **DEAD — Remove** | Not imported anywhere in source code. Sentry tracing is handled by `@nuxtjs/sentry` module directly |
| **`core-js`** ^3 | **Misused — Remove** | Only one reference: `import { locale } from "core-js"` in `NavDesktop.vue:161` — this is a **wrong import** (`locale` is not a core-js export). Fix the import, then remove the package |

> **Action:** Remove these 4 packages in Sprint 1 (Dead Code Removal). For `core-js`, fix the broken import in `NavDesktop.vue` first.

### 4.3 Packages That Work As-Is in Nuxt 4 (No Replacement Needed)

These packages are framework-agnostic and will work without changes:

| Package | Used In | Notes |
|---------|---------|-------|
| `pusher-js` | Chat (Messages.vue, chat-presence) | Move off RC to stable ^8.4+ |
| `html2pdf.js` | QR code page, provider profile | Client-only, framework-agnostic |
| `wavesurfer.js` | Chat audio (Messages.vue, Audio.vue) | Framework-agnostic |
| `isomorphic-dompurify` | XSS sanitization | Framework-agnostic |
| `@mdi/font` | Material Design Icons (Vuetify) | CSS-only, works everywhere |

### 4.4 New Dependencies to Add

| Package | Purpose |
|---------|---------|
| **`@nuxt/image`** | Automatic image optimization (WebP/AVIF, lazy load, responsive) |
| **`@nuxt/fonts`** | Self-host fonts (Tajawal, Nunito) — zero external requests |
| **`@nuxt/scripts`** | Load 3rd-party scripts (Apple Auth, Google GSI, Tap SDK) without blocking |
| **`nuxt-security`** | OWASP headers, CSP, rate limiting — security by default |
| **`@pinia/nuxt`** | Pinia integration for Nuxt |
| **`@vueuse/nuxt`** | 200+ composables (useLocalStorage, useIntersectionObserver, etc.) |
| **`vitest`** | Unit & integration testing |
| **`@vue/test-utils`** | Vue component testing |
| **`@playwright/test`** | E2E testing |
| **`pinia-plugin-persistedstate`** | Persist Pinia state to cookies (SSR-safe) |

---

## 5. Stage 3: Architecture & Design Patterns (Nuxt 4)

### 5.1 Nuxt 4 Directory Structure

```
doworkss_frontend/
├── app/                          # Application code (NEW in Nuxt 4)
│   ├── assets/
│   │   ├── scss/
│   │   ├── fonts/
│   │   └── images/
│   ├── components/
│   │   ├── base/                 # Base/atomic components (BaseButton, BaseInput, BaseModal)
│   │   ├── layout/               # Layout components (AppNav, AppFooter, AppSidebar)
│   │   ├── feature/              # Feature components organized by domain
│   │   │   ├── chat/
│   │   │   ├── deals/
│   │   │   ├── services/
│   │   │   ├── wallet/
│   │   │   └── auth/
│   │   └── shared/               # Shared components (ServiceCard, ProviderCard)
│   ├── composables/              # Reusable logic (replaces mixins + plugins)
│   │   ├── useAuth.ts            # Authentication (replaces @nuxtjs/auth-next)
│   │   ├── useApi.ts             # API calls (replaces $request + axios plugin)
│   │   ├── useCurrency.ts        # Currency formatting & exchange
│   │   ├── useChat.ts            # Chat presence & messaging
│   │   ├── usePusher.ts          # Pusher real-time connection
│   │   ├── useFcm.ts             # Firebase Cloud Messaging
│   │   ├── useInfiniteScroll.ts  # IntersectionObserver-based scroll
│   │   └── useDirection.ts       # RTL/LTR detection
│   ├── layouts/
│   ├── middleware/
│   ├── pages/
│   ├── plugins/                  # Only for 3rd-party integrations
│   ├── stores/                   # Pinia stores (MUST be inside app/)
│   │   ├── auth.ts
│   │   ├── global.ts
│   │   ├── chat.ts
│   │   ├── deals.ts
│   │   ├── services.ts
│   │   ├── serviceForm.ts
│   │   ├── wallet.ts
│   │   ├── plan.ts
│   │   ├── categories.ts
│   │   └── ui.ts                # UI state (modals, menus, device)
│   └── app.vue
├── layers/                       # Feature layers (optional, for DDD)
│   └── (future: admin, blog, etc.)
├── modules/                      # Custom Nuxt modules
├── server/                       # Nitro server (API routes, middleware)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.post.ts
│   │   │   ├── logout.post.ts
│   │   │   └── refresh.post.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.ts               # Server-side auth validation
│   │   └── security.ts
│   └── utils/
├── shared/                       # Shared between app/ and server/
│   ├── types/                    # TypeScript interfaces & types
│   │   ├── auth.ts
│   │   ├── service.ts
│   │   ├── deal.ts
│   │   └── api.ts
│   ├── constants/
│   └── utils/                    # Pure functions (no Vue dependency)
│       ├── currency.ts
│       ├── string.ts
│       ├── validation.ts
│       └── date.ts
├── public/                       # Static files (was static/)
├── locales/                      # i18n translations
├── tests/                        # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── nuxt.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── tsconfig.json
```

### 5.2 Missing Migration Concerns (Critical)

These items are NOT covered elsewhere in the plan but are required for a successful migration:

#### 5.2.1 Vuetify SCSS Variables → Vuetify 3 Theme System

**Current:** `assets/scss/base/vutifay-variables.scss` is imported globally and customizes Vuetify 2 via SASS variables.
**Nuxt 4:** Vuetify 3 uses a completely different theming system — CSS custom properties + JS-based theme configuration in `vuetify.config.ts`.

**Action:**
1. Audit `vutifay-variables.scss` for all custom variables (colors, breakpoints, typography)
2. Map each to Vuetify 3's `createVuetify({ theme: { ... } })` config
3. Move custom SCSS that isn't Vuetify-specific to `assets/scss/main.scss`
4. Test RTL rendering — Vuetify 3 handles RTL differently (per-component `locale` prop vs global `$vuetify.rtl`)

#### 5.2.2 `onBeforeLanguageSwitch` → Composable/Plugin

**Current:** `nuxt.config.js` has a callback that directly manipulates Vuetify internals:
```js
onBeforeLanguageSwitch: (oldLocale, newLocale, isInitialSetup, context) => {
  context.app.vuetify.framework.rtl = isRTL;
  context.app.vuetify.framework.lang.current = locale.langCode;
}
```

**Nuxt 4:** This callback doesn't exist in `@nuxtjs/i18n` v10. Also note: `localePath()` is replaced by `useLocalePath()` composable (auto-imported, same functionality). Replace with:
```ts
// app/plugins/i18n-vuetify-sync.ts
export default defineNuxtPlugin((nuxtApp) => {
  const { locale } = useI18n()
  const vuetify = useVuetify()

  watch(locale, (newLocale) => {
    const localeConfig = nuxtApp.$i18n.locales.value.find(l => l.code === newLocale)
    vuetify.locale.current.value = newLocale
    vuetify.theme.global.current.value = localeConfig?.dir === 'rtl' ? 'rtlTheme' : 'ltrTheme'
  }, { immediate: true })
})
```

#### 5.2.3 Firebase Service Worker (`firebase-messaging-sw.js`)

**Current:** `@nuxtjs/firebase` auto-generates `static/firebase-messaging-sw.js`. This file is currently modified (per git status) and handles FCM push notifications.
**Nuxt 4:** Dropping `@nuxtjs/firebase` means this service worker must be **manually created and maintained** in `public/firebase-messaging-sw.js`.

**Action:**
1. Copy current `static/firebase-messaging-sw.js` to version control (if not already)
2. During migration, place in `public/firebase-messaging-sw.js`
3. Update to use Firebase SDK v11+ importScripts
4. Ensure `fcmPublicVapidKey` comes from `runtimeConfig`

#### 5.2.4 `/home` → `/` Route Handling Change

**Current:** `extendRoutes` remaps the `/home` route path to `/` — same URL serves content, no redirect.
**Plan's `routeRules`:** `'/home': { redirect: '/' }` — this is a **301 redirect**, not a remapping.

**SEO Impact:** Existing `/home` URLs indexed by search engines will get a 301 redirect. This is generally fine (and actually better for SEO) but should be verified with the SEO team. Consider setting up redirect in `_redirects` or Nitro middleware rather than `routeRules` if you need a 302 instead.

#### 5.2.5 Toast System Redesign (Per-Method Control)

**Current mechanism:** Components set `localStorage.setItem("toast", "true"/"false")` before specific `$request` calls. `ApiCalls.js` reads this flag to decide whether to show error toasts. The caller controls display per-method.

**Nuxt 4 replacement — `showToast` option on request composable:**
```ts
// app/composables/useApi.ts
interface RequestOptions extends FetchOptions {
  showToast?: boolean  // default: false — caller opts in per-call
}

export function useApi() {
  const { locale } = useI18n()
  const toast = useToast()

  async function request<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    try {
      return await $fetch<T>(url, { /* ... */ })
    } catch (error) {
      if (options?.showToast && import.meta.client) {
        showErrorToast(toast, error)
      }
      return { error: true, details: error, status: error.statusCode }
    }
  }

  return { request }
}

// Usage — caller controls toast display:
const { request } = useApi()
await request('/withdraw', { method: 'POST', body: data, showToast: true })
await request('/subscribe', { method: 'POST', body: data, showToast: false })
```

This eliminates localStorage for toast control and makes the behavior explicit per-call.

#### 5.2.6 Auth Architecture Decision (CRITICAL — CONFIRMED)

**Why existing auth libraries are NOT suitable:**

Both `nuxt-auth-utils` (OAuth/sealed-session) and `@sidebase/nuxt-auth` (closest to `@nuxtjs/auth-next`) were evaluated. Neither fits the current deeply custom auth system:

| Current Feature | `nuxt-auth-utils` | `@sidebase/nuxt-auth` |
|----------------|--------------------|-----------------------|
| Custom refresh scheme (refresh token in `Authorization` header) | No — sealed sessions | Partial — has refresh but different pattern |
| `httpOnly: false` cookies (client JS reads tokens for API headers) | No — `httpOnly: true` only | Configurable but limited |
| `nuxtServerInit` SSR token validation + refresh | Partial | Partial |
| `broadcastAuth.js` cross-tab sync via `BroadcastChannel` | No — must build custom | No — must build custom |
| `fcm-notification.client.js` FCM token sync on login/logout | No — must build custom | No — must build custom |
| 405 `$auth` references across 94 files | N/A — all must be rewritten | N/A — all must be rewritten |

**Confirmed approach: Custom `useAuth` composable + Nitro API proxy (Cookie-Based)**

```
Browser → $fetch('/api/auth/login')  → Nitro route → Backend API
                                       Nitro sets httpOnly cookies (access_token, refresh_token)
                                       Returns user data only (no tokens to client)

Browser → $fetch('/api/proxy/...')   → Nitro reads token from cookies → Backend API
                                       Adds Authorization + PRIVATE_KEY headers server-side
```

- Nitro server routes handle token storage in **httpOnly cookies** set via h3 `setCookie`/`getCookie`
- Client never sees raw tokens — `PRIVATE_KEY` and auth tokens stay server-side in cookies
- `useAuth` composable exposes `user`, `loggedIn`, `login()`, `logout()`, `refreshUser()`
- On SSR: Nitro server middleware reads cookies from request, validates/refreshes tokens, sets `event.context.auth`
- On client: `useAuth` reads from `useState` hydrated by SSR
- Cross-tab sync rebuilt with `BroadcastChannel` in a client plugin
- FCM token sync rebuilt in `useFcm` composable

> **SECURITY WARNING:** Never use `useCookie()` for auth tokens. Even with `httpOnly: true`, cookie values leak in the `__NUXT_DATA__` SSR payload during hydration. Auth tokens must be managed exclusively server-side with h3 `setCookie`/`getCookie`. The client only receives user profile data via `useState` hydration.

This approach is more work than `nuxt-auth-utils` but matches the current cookie-based behavior and is production-safe.

**Server implementation examples:**

```ts
// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  const response = await $fetch('/login', {
    baseURL: config.apiBaseUrl,
    method: 'POST',
    body,
    headers: {
      'private-key': config.privateKey,
      'Accept': 'application/json',
    },
  })

  // Set httpOnly cookies (tokens NEVER sent to client)
  setCookie(event, 'access_token', response.data.token, {
    httpOnly: true, secure: true, sameSite: 'lax',
    path: '/', maxAge: 60 * 60 * 24 - 600, // 23h 50m
  })
  setCookie(event, 'refresh_token', response.data.refresh_token, {
    httpOnly: true, secure: true, sameSite: 'lax',
    path: '/', maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  // Return user data ONLY (no tokens)
  return { user: response.data.user }
})
```

```ts
// server/api/auth/logout.post.ts
export default defineEventHandler(async (event) => {
  const accessToken = getCookie(event, 'access_token')
  const config = useRuntimeConfig()

  if (accessToken) {
    await $fetch('/logout', {
      baseURL: config.apiBaseUrl,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'private-key': config.privateKey,
      },
    }).catch(() => {}) // Best-effort backend logout
  }

  deleteCookie(event, 'access_token', { path: '/' })
  deleteCookie(event, 'refresh_token', { path: '/' })
  return { success: true }
})
```

### 5.3 Design Patterns to Apply

#### Pattern 1: Composable Pattern (replaces Mixins)

**Before (Nuxt 2 — Mixin):**
```js
// plugins/mixins/global_user_currency.js
export default {
  computed: {
    globalCurrency() {
      return this.$auth?.$storage?.getCookie("userCurrency");
    }
  }
}
```

**After (Nuxt 4 — Composable):**
```ts
// app/composables/useCurrency.ts
export function useCurrency() {
  const auth = useAuth()
  const currency = computed(() => auth.user.value?.currency || getGuestCurrency())
  
  function formatCurrency(value: number, code: string): string {
    return new Intl.NumberFormat(useI18n().locale.value, {
      style: 'currency', currency: code
    }).format(value)
  }
  
  function getExchangePrice(amount: number, fromRate: number, toRate: number): number {
    return (amount / fromRate) * toRate
  }

  return { currency, formatCurrency, getExchangePrice }
}
```

#### Pattern 2: Repository Pattern (for API layer)

**Before (Nuxt 2 — $request + URL builders):**
```js
// Scattered across components
const res = await this.$request({ method: 'get', url: services(slug) })
```

**After (Nuxt 4 — Repository Composable):**
```ts
// app/composables/useApi.ts
// All requests go through Nitro proxy — PRIVATE_KEY is added server-side, never on client
export function useApi() {
  const { locale } = useI18n()
  const { currency } = useCurrency()

  async function request<T>(url: string, options?: RequestOptions): Promise<T> {
    return $fetch<T>(`/api/proxy${url}`, {
      headers: {
        'content-language': locale.value,
        'currency': currency.value?.code,
      },
      ...options,
    })
  }

  return { request }
}

// app/composables/useServices.ts
export function useServices() {
  const { request } = useApi()
  
  const getService = (slug: string) => request<Service>(`/services/${slug}`)
  const getSimilar = (slug: string) => request<Service[]>(`/similar-services/${slug}`)
  const createService = (data: CreateServiceDTO) => request<Service>('/services', { method: 'POST', body: data })
  
  return { getService, getSimilar, createService }
}
```

#### Pattern 3: Container/Presentational Pattern

Split components into:
- **Container (Smart):** Handles data fetching, state, and business logic
- **Presentational (Dumb):** Receives props, emits events, renders UI

```
components/feature/deals/
├── DealPage.vue              # Container — uses useDeals(), handles logic
├── DealCard.vue              # Presentational — receives deal prop
├── DealBudgetDisplay.vue     # Presentational — shows pricing
└── DealStatusBadge.vue       # Presentational — shows status
```

#### Pattern 4: Provide/Inject for Deep Component Trees

For the chat system where data must pass through many levels:
```ts
// ChatPage.vue (provider)
const chatState = useChatState()
provide('chatState', chatState)

// ChatMessageItem.vue (deep child)
const chatState = inject('chatState')
```

---

## 6. Stage 4: TypeScript Strategy

### 6.1 Adoption Approach: Progressive

Do NOT convert all 188 components at once. Use a progressive strategy:

| Phase | What Gets TypeScript | When |
|-------|---------------------|------|
| **Phase 1** | `nuxt.config.ts`, `shared/types/`, `shared/utils/` | During scaffold |
| **Phase 2** | All composables (`app/composables/*.ts`) | During Wave 1 |
| **Phase 3** | All Pinia stores (`app/stores/*.ts`) | During Wave 2 |
| **Phase 4** | Server routes (`server/**/*.ts`) | During Wave 1–2 |
| **Phase 5** | All migrated components use `<script setup lang="ts">` — **full rewrite, no Options API carried over** | During each migration wave |

### 6.2 Core Type Definitions

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
  token: string | null
  refreshToken: string | null
  loggedIn: boolean
}

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

// shared/types/deal.ts
export interface Deal {
  id: number
  status: DealStatus
  budget: number
  currency: Currency
  deliveries: DealDelivery[]
  service: Service
  buyer: User
  seller: User
}

type DealStatus = 'draft' | 'pending' | 'approved' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'rejected'

// shared/types/api.ts
export interface ApiResponse<T> {
  data: T
  message: string
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

### 6.3 TypeScript Config

Nuxt 4.4 auto-generates separate TypeScript configs for app, server, shared, and node contexts. The root `tsconfig.json` uses multi-reference structure:

```json
// tsconfig.json (auto-generated by Nuxt 4 — do NOT manually edit)
{
  "files": [],
  "references": [
    { "path": "./.nuxt/tsconfig.app.json" },
    { "path": "./.nuxt/tsconfig.server.json" },
    { "path": "./.nuxt/tsconfig.shared.json" },
    { "path": "./.nuxt/tsconfig.node.json" }
  ]
}
```

Custom TypeScript options should be configured in `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  typescript: {
    strict: true,
    typeCheck: true,
  },
})
```

> **Note:** The generated configs already include `strict: true`, `noUncheckedIndexedAccess: true`, and `forceConsistentCasingInFileNames: true` by default in Nuxt 4.

---

## 7. Stage 5: State Management — Vuex to Pinia

### 7.1 Migration Map: Vuex Modules → Pinia Stores

| Vuex Module | Pinia Store | Pattern | Notes |
|------------|-------------|---------|-------|
| `store/global/` | `app/stores/global.ts` | Setup store | Currencies, modals, support channels |
| `store/user/` | `app/stores/auth.ts` | Setup store | Merge with auth composable |
| `store/chat/` | `app/stores/chat.ts` | Setup store | Conversations, messages, unread count |
| `store/deals/` | `app/stores/deals.ts` | Setup store | Deal preview, extras, stepper state |
| `store/wallet/` | `app/stores/wallet.ts` | Setup store | Balance, cards, bank accounts |
| `store/update_service/` | `app/stores/serviceForm.ts` | Setup store | Service creation/edit wizard |
| `store/my_services/` | `app/stores/services.ts` | Setup store | User's services list |
| `store/plan/` | `app/stores/plan.ts` | Setup store | Subscription plans |
| `store/all_categories/` | `app/stores/categories.ts` | Setup store | Category cache |
| `store/ads/` | — | Delete | Single boolean, use `useState` |
| `store/blog_tags/` | — | Delete | Fetch on demand with `useFetch` |
| `store/device_id/` | — | Delete | Use `useDeviceId` composable |
| `store/device_width/` | — | **Delete entirely** | Replace with CSS media queries + Vuetify 3 `useDisplay()`. See Stage 3.5 for full migration plan (63 occurrences, 34 files, 13 duplicate component pairs) |
| `store/faq/` | — | Delete | Fetch on demand with `useFetch` |
| `store/filter_header/` | `app/stores/ui.ts` | Merge into UI store | Just UI state |
| `store/login_form/` | — | Delete | Local component state |
| `store/mobile_menu/` | `app/stores/ui.ts` | Merge into UI store | Just UI state |
| `store/registration/` | — | Delete | Local component state |
| `store/search_menu/` | `app/stores/ui.ts` | Merge into UI store | Just UI state |
| `store/social_media/` | — | Delete | Local component state + validation |
| `store/verify/` | — | Delete | Local component state |

**Result:** 21 Vuex modules → 8 Pinia stores + composables. Reduced complexity by ~60%.

### 7.2 Pinia Store Pattern (Setup Store Syntax)

```ts
// app/stores/chat.ts
export const useChatStore = defineStore('chat', () => {
  // State (ref = reactive state)
  const conversations = ref<Conversation[]>([])
  const currentConversation = ref<Conversation | null>(null)
  const unreadCount = ref(0)
  const loading = ref(false)

  // Getters (computed)
  const sortedConversations = computed(() =>
    [...conversations.value].sort((a, b) => 
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    )
  )

  // Actions (functions)
  async function fetchConversations(page: number = 1) {
    loading.value = true
    try {
      const { request } = useApi()
      const res = await request<PaginatedResponse<Conversation>>('/conversations', {
        params: { page }
      })
      if (page === 1) conversations.value = res.data
      else conversations.value.push(...res.data)
    } finally {
      loading.value = false
    }
  }

  function incrementUnread() {
    unreadCount.value++
  }

  function markAsRead(conversationId: number) {
    const conv = conversations.value.find(c => c.id === conversationId)
    if (conv) {
      unreadCount.value -= conv.unread_count
      conv.unread_count = 0
    }
  }

  return {
    conversations, currentConversation, unreadCount, loading,
    sortedConversations,
    fetchConversations, incrementUnread, markAsRead,
  }
})
```

### 7.3 Pinia Best Practices

- Use **Setup stores** (not Options stores) — mirrors Composition API, better TypeScript inference
- **Pinia 3 breaking change:** `defineStore({ id: 'name', ... })` object signature is REMOVED. Only `defineStore('name', { ... })` (options) or `defineStore('name', () => { ... })` (setup) work
- Use **`storeToRefs()`** when destructuring state (preserves reactivity)
- Use **`pinia-plugin-persistedstate`** for SSR-safe persistence (cookies, not localStorage)
- Never call store constructors at module level — use lazy initialization
- Keep stores thin — business logic in composables, stores hold state
- **Pinia Colada** is available for async data fetching with caching, deduplication, and background revalidation — but defer adoption until post-migration. Use built-in `useFetch`/`useAsyncData` first to reduce migration complexity

---

## 8. Stage 6: Vite & Nitro — Build & Server Engine

### 8.1 Vite (Replaces Webpack)

Nuxt 4 uses **Vite** as the default build tool. Benefits over current Webpack setup:

| Webpack (Current) | Vite (Nuxt 4) |
|-------------------|---------------|
| Cold start: 30–60s | Cold start: ~1-2s (ESM-based, Vite 7) |
| HMR: 2–5s | HMR: <100ms (no full rebundle) |
| Build: minutes | Build: seconds (Rollup-based) |
| `--max-old-space-size=4096` needed | Default memory is fine |
| Manual transpile config | Auto-detect + tree-shaking |

**Action Items:**
- Remove `--max-old-space-size=4096` from dev script (no longer needed)
- Remove `build.transpile` array — Vite handles this automatically
- Use `vuetify-nuxt-module` for Vuetify tree-shaking (only ship used components) — do NOT also install `vite-plugin-vuetify` (conflict)
- Configure `optimizeDeps` for large deps like `firebase`, `pusher-js`

### 8.2 Nitro (Server Engine)

Nitro powers Nuxt 4's server side. It replaces the old `server-middleware/` pattern.

**Current server middleware → Nitro equivalents:**

| Current | Nitro Equivalent |
|---------|-----------------|
| `server-middleware/cache.js` | `server/middleware/cache.ts` or Nitro's built-in caching with `routeRules` |
| `server-middleware/robots-txt.js` | `server/routes/robots.txt.ts` |
| `server-middleware/robots.js` | `routeRules` with headers in `nuxt.config.ts` |

**New Nitro capabilities to leverage:**

```ts
// nuxt.config.ts — Hybrid rendering with route rules
export default defineNuxtConfig({
  routeRules: {
    // Static pages — prerender at build
    '/about-us': { prerender: true },
    '/privacy-policy': { prerender: true },
    '/terms-and-conditions': { prerender: true },
    '/faq': { prerender: true },
    
    // ISR for semi-dynamic pages (revalidate every hour)
    '/services/**': { isr: 3600 },
    '/providers/**': { isr: 3600 },
    '/blogs/**': { isr: 3600 },
    
    // SPA for authenticated pages (no SSR needed)
    '/dashboard/**': { ssr: false },
    '/my-services/**': { ssr: false },
    '/my-deals/**': { ssr: false },
    '/my-wallet/**': { ssr: false },
    '/account-settings/**': { ssr: false },
    '/chat/**': { ssr: false },
    
    // Full SSR for public pages (SEO critical)
    '/': { ssr: true },
    '/home': { redirect: '/' },
  }
})
```

---

## 9. Stage 7: SSR Optimization & Hybrid Rendering

### 9.1 Rendering Strategy per Page Type

| Page Type | Rendering | Why |
|-----------|-----------|-----|
| Home, Services listing, Provider profiles | **SSR** | SEO-critical, dynamic content |
| Blog posts | **ISR** (revalidate hourly) | SEO-critical but changes infrequently |
| About, Terms, Privacy, FAQ | **Prerender (SSG)** | Static content, build-time generation |
| Dashboard, My Services, Deals, Chat, Wallet | **SPA (CSR)** | Behind auth, no SEO value, faster navigation |
| Auth pages (login, register) | **SSR** | SEO for indexed auth pages |

### 9.2 SSR Performance Techniques

```ts
// 1. Use Nuxt 4's shallow refs (default in v4) — faster reactivity
const items = shallowRef<Service[]>([])

// 2. Use useAsyncData with key for deduplication
const { data: service } = await useAsyncData(
  `service-${slug}`,
  () => $fetch(`/api/services/${slug}`),
  { 
    transform: (res) => res.data,  // Only store what you need
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key]  // Cache across navigations
  }
)

// 3. Use <NuxtIsland> for server-only components (zero client JS)
// Good for: footer, static sidebars, SEO meta blocks

// 4. Use payloadExtraction for shared data between prerendered pages
// Nuxt 4 does this automatically with shared payload
```

### 9.3 What Replaces `nuxtServerInit`

Current `nuxtServerInit` does: token refresh, countries fetch, currency setup.

**Nuxt 4 equivalent — Nitro Server Middleware + Composable:**

```ts
// server/middleware/auth.ts — runs on every SSR request (cookie-based)
export default defineEventHandler(async (event) => {
  const accessToken = getCookie(event, 'access_token')
  const refreshToken = getCookie(event, 'refresh_token')

  if (!accessToken && !refreshToken) {
    event.context.auth = { user: null, loggedIn: false }
    return
  }

  // If no access token but refresh token exists, refresh
  if (!accessToken && refreshToken) {
    try {
      const config = useRuntimeConfig()
      const response = await $fetch('/refresh-token', {
        baseURL: config.apiBaseUrl,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'private-key': config.privateKey,
        },
      })
      setCookie(event, 'access_token', response.data.token, {
        httpOnly: true, secure: true, sameSite: 'lax',
        path: '/', maxAge: 60 * 60 * 24 - 600,
      })
      setCookie(event, 'refresh_token', response.data.refresh_token, {
        httpOnly: true, secure: true, sameSite: 'lax',
        path: '/', maxAge: 60 * 60 * 24 * 365,
      })
      event.context.auth = { user: response.data.user, loggedIn: true, token: response.data.token }
    } catch {
      deleteCookie(event, 'access_token')
      deleteCookie(event, 'refresh_token')
      event.context.auth = { user: null, loggedIn: false }
    }
    return
  }

  // Valid access token — fetch user info
  try {
    const config = useRuntimeConfig()
    const response = await $fetch('/user-information', {
      baseURL: config.apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'private-key': config.privateKey,
      },
    })
    event.context.auth = { user: response.data, loggedIn: true, token: accessToken }
  } catch {
    event.context.auth = { user: null, loggedIn: false }
  }
})

// app/composables/useAuth.ts — client & server
export function useAuth() {
  const user = useState<User | null>('auth:user', () => null)
  const loggedIn = computed(() => !!user.value)
  
  // On SSR: read from event context
  // On client: read from state hydrated by SSR
  if (import.meta.server) {
    const event = useRequestEvent()
    user.value = event?.context.auth?.user ?? null
  }
  
  async function login(credentials: LoginDTO) { /* ... */ }
  async function logout() { /* ... */ }
  async function refreshToken() { /* ... */ }
  
  return { user, loggedIn, login, logout, refreshToken }
}
```

---

## 10. Stage 8: Testing — Vitest & Playwright

### 10.1 Testing Strategy (2026 Best Practice)

The modern Vue testing pyramid:

| Layer | Tool | Coverage Target | What to Test |
|-------|------|----------------|--------------|
| **Integration Tests** (70%) | Vitest + `@vue/test-utils` | Composables, store interactions, component behavior | How components behave with real stores and composables |
| **Unit Tests** (20%) | Vitest | Pure functions, utils, validators | `shared/utils/*.ts`, `formatCurrency`, `truncateString` |
| **E2E Tests** (10%) | Playwright | Critical user flows | Auth flow, deal creation, chat, payment |

### 10.2 Vitest Configuration

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',    // Faster than jsdom
    globals: true,
    include: ['tests/**/*.{test,spec}.{ts,js}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['app/composables/**', 'shared/utils/**', 'app/stores/**'],
      thresholds: {
        statements: 60,         // Start low, increase over time
        branches: 50,
        functions: 60,
      }
    },
    setupFiles: ['tests/setup.ts'],
  },
})
```

### 10.3 Test Examples

```ts
// tests/unit/utils/currency.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, getExchangePrice } from '~/shared/utils/currency'

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1000, 'USD', 'en')).toBe('$1,000.00')
  })
  it('formats SAR correctly in Arabic', () => {
    expect(formatCurrency(1000, 'SAR', 'ar')).toContain('1,000')
  })
})

// tests/integration/composables/useAuth.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

describe('useAuth', () => {
  it('logs in and stores user', async () => {
    // Test with real composable behavior
  })
})

// tests/e2e/auth.spec.ts (Playwright)
import { test, expect } from '@playwright/test'

test('user can login and see dashboard', async ({ page }) => {
  await page.goto('/ar/auth/login')
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'password')
  await page.click('[data-testid="login-button"]')
  await expect(page).toHaveURL(/\/dashboard/)
})
```

### 10.4 What to Test First (Priority)

1. `shared/utils/` — pure functions, easiest to test, highest ROI
2. `composables/useAuth.ts` — most critical composable
3. `composables/useApi.ts` — request/response handling
4. `app/stores/chat.ts` — complex state logic
5. E2E: auth flow → deal creation → chat message → payment

---

## 11. Stage 9: Performance Optimization

### 11.1 Build Performance

| Optimization | How | Impact |
|-------------|-----|--------|
| **Vuetify tree-shaking** | `vuetify-nuxt-module` with auto-import | ~60% reduction in Vuetify bundle |
| **@nuxt/fonts** | Self-host Tajawal + Nunito, eliminate Google Fonts CDN. **Note:** Only `normal/400` weight loads by default — configure additional weights for Tajawal explicitly | Eliminate render-blocking external requests |
| **@nuxt/scripts** | Load Apple Auth, Google GSI, Tap SDK with `useScript()` | Non-blocking, defer 3rd-party scripts |
| **@nuxt/image** | `<NuxtImg>` with WebP/AVIF, responsive sizes, lazy load | ~40-70% image size reduction |
| **Code splitting** | Automatic per-page splitting via Vite + dynamic imports for heavy components | Smaller initial bundle |
| **Component lazy loading** | `defineAsyncComponent` for TiptapEditor, WaveSurfer, PDF viewer | Only load when needed |

### 11.2 Runtime Performance

```ts
// 1. Use v-memo for long lists (services, conversations)
<div v-for="service in services" :key="service.id" v-memo="[service.id, service.status]">
  <ServiceCard :service="service" />
</div>

// 2. Use v-once for static content
<footer v-once>
  <!-- Footer never changes after initial render -->
</footer>

// 3. Use shallowRef for large arrays (Nuxt 4 default)
const services = shallowRef<Service[]>([])

// 4. Use defineAsyncComponent for heavy components
const TiptapEditor = defineAsyncComponent(() => import('~/components/feature/blog/TiptapEditor.vue'))
const WaveSurfer = defineAsyncComponent(() => import('~/components/feature/chat/AudioRecorder.vue'))

// 5. Debounce search inputs
const searchQuery = ref('')
const debouncedSearch = useDebounceFn(searchQuery, 300)
```

### 11.3 Caching Strategy

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Cache API responses at the edge
    '/api/categories': { swr: 86400 },          // Cache 24h, revalidate in background
    '/api/services/popular': { swr: 3600 },      // Cache 1h
    '/api/timezones': { swr: 604800 },           // Cache 7 days
    '/api/support-channels': { swr: 86400 },     // Cache 24h
  }
})
```

### 11.4 Performance Monitoring

- Use **@sentry/nuxt** performance monitoring (tracesSampleRate)
- Add **Web Vitals** tracking: LCP, FID, CLS, TTFB
- Set performance budgets in CI:
  - LCP < 2.5s
  - CLS < 0.1
  - Total JS bundle < 300KB (gzipped)

---

## 12. Stage 10: Security Hardening

### 12.1 `nuxt-security` Module

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-security'],
  security: {
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'nonce-{nonce}'", 'https://appleid.cdn-apple.com', 'https://accounts.google.com'],
        'style-src': ["'self'", "'unsafe-inline'"],  // Vuetify needs inline styles
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
        'connect-src': ["'self'", process.env.BASE_URL, 'https://*.pusher.com', 'wss://*.pusher.com'],
        'frame-src': ["'self'", 'https://accounts.google.com'],
      },
      crossOriginEmbedderPolicy: 'unsafe-none',  // Allow 3rd-party embeds
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
    rateLimiter: {
      tokensPerInterval: 50,
      interval: 60000,  // 50 requests per minute
    },
    csrf: true,
  }
})
```

### 12.2 Auth Security Best Practices

| Practice | Implementation |
|----------|---------------|
| **HttpOnly cookies** | Use Nitro server-side httpOnly cookies via h3 `setCookie`/`getCookie` — tokens never exposed to client JS (see section 5.2.6). **Never use `useCookie()` for tokens** — values leak in `__NUXT_DATA__` |
| **CSRF protection** | `nuxt-security` CSRF middleware |
| **Token rotation** | Rotate refresh token on each use |
| **Secure cookies** | `secure: true`, `sameSite: 'lax'`, `httpOnly: true` |
| **Rate limiting** | Limit auth endpoints: 5 attempts per minute |
| **Input sanitization** | Keep `isomorphic-dompurify` for UGC, use `v-html` only with sanitized content |
| **No secrets in client** | `PRIVATE_KEY` is currently set as an axios default header in `plugins/axios.js:3` — exposed in every client request. Move to **Nitro API proxy** so it's only added server-side. Simply moving to server-only `runtimeConfig` is NOT enough — client-side `$fetch` can't access server-only config. |

### 12.3 Security Checklist

- [ ] `PRIVATE_KEY` removed from client-side entirely — currently in `plugins/axios.js:3` as a default header. Use Nitro API proxy to add server-side only
- [ ] All auth tokens in HttpOnly cookies (not localStorage)
- [ ] CSP headers configured via `nuxt-security`
- [ ] CSRF protection enabled for state-changing requests
- [ ] Rate limiting on auth and payment endpoints
- [ ] `X-Robots-Tag` for non-production via `routeRules`
- [ ] Input sanitization with DOMPurify on all user-generated content
- [ ] No `v-html` without sanitization
- [ ] Dependency audit: `npm audit` in CI pipeline
- [ ] Subresource Integrity (SRI) for external scripts

---

## 13. Stage 11: SOLID Principles & Best Practices

### 13.1 SOLID in Vue/Nuxt Context

#### S — Single Responsibility Principle

**Before:** `Messages.vue` (3,228 lines) handles: UI rendering, websocket management, audio recording, file uploads, deal cards, rating cards, infinite scroll, online status, message formatting.

**After:** Each responsibility = separate composable or component:
- `useChat.ts` — WebSocket/Pusher connection management
- `useChatMessages.ts` — message CRUD operations
- `useChatPresence.ts` — online/offline status
- `ChatComposer.vue` — input UI only
- `ChatAudioRecorder.vue` — audio recording only
- `ChatMessageList.vue` — message rendering only

#### O — Open/Closed Principle

Use composables that can be extended without modifying source:

```ts
// Base composable — closed for modification
export function useApi() {
  async function request<T>(url: string, options?: RequestOptions): Promise<T> { /* ... */ }
  return { request }
}

// Extended composable — open for extension
export function useAuthenticatedApi() {
  const { request } = useApi()
  const { token } = useAuth()
  
  async function authRequest<T>(url: string, options?: RequestOptions): Promise<T> {
    return request<T>(url, {
      ...options,
      headers: { ...options?.headers, Authorization: `Bearer ${token.value}` }
    })
  }
  
  return { authRequest }
}
```

#### L — Liskov Substitution Principle

All service card components (`ServiceCardGrid`, `ServiceCardRow`, `ServiceCardCompact`) accept the same `Service` interface — they're interchangeable:

```ts
// Any card variant can replace another
<component :is="viewMode === 'grid' ? ServiceCardGrid : ServiceCardRow" :service="service" />
```

#### I — Interface Segregation Principle

**Before:** One massive `Service` type used everywhere.
**After:** Specific interfaces for specific use cases:

```ts
interface ServiceListItem { id: number; slug: string; name: string; price: number; thumbnail: string }
interface ServiceDetail extends ServiceListItem { description: string; media: ServiceMedia; extra_options: ExtraOption[] }
interface ServiceFormData { name: string; description: string; category_id: number; /* ... */ }
```

#### D — Dependency Inversion Principle

Components depend on abstractions (composables), not concrete implementations:

```ts
// Component doesn't know HOW auth works — just uses the interface
const { user, loggedIn, login, logout } = useAuth()

// The composable can be swapped (e.g., for testing) without changing components
```

### 13.2 Vue 3 / Nuxt 4 Best Practices

| Practice | Implementation |
|----------|---------------|
| **Use `<script setup>`** | **ALL** components use `<script setup lang="ts">` — no Options API (confirmed decision) |
| **Props as primitives** | Pass `serviceId` instead of full `service` object when possible |
| **Emit typed events** | `defineEmits<{ update: [value: string]; submit: [] }>()` |
| **Use `defineModel`** | Replace manual v-model prop + emit pattern |
| **No Options API** | ALL code uses Composition API — zero Options API in the Nuxt 4 codebase (confirmed decision) |
| **Lazy load routes** | Nuxt 4 does this automatically per page |
| **Use `useState` for simple SSR state** | Instead of Pinia for single values |
| **Use `useCookie` for SSR-safe persistence** | Instead of localStorage. **NEVER for auth tokens** — use httpOnly cookies via server routes |
| **Use `useHead` for dynamic meta** | Per-page SEO tags |
| **Use `data-testid` attributes** | For E2E test selectors (not CSS classes) |

### 13.3 Code Organization Rules

1. **Composables** contain logic. **Components** contain UI. **Stores** contain state. **Utils** contain pure functions.
2. **Never** access `localStorage` or `window` directly — use `useCookie()`, `useState()`, or VueUse composables.
3. **Never** import from `vue` in Nuxt 4 — use auto-imports (`ref`, `computed`, `watch` are global).
4. **Always** use `useRuntimeConfig()` for env vars — never `process.env` in client code.
5. **Always** use `useLocalePath()` for navigation — replaces `localePath()` from i18n v7. Never hardcode locale prefixes.
6. **Always** handle errors with `useErrorBoundary` or `<NuxtErrorBoundary>` — no silent swallowing.
7. **Prefer** `useFetch`/`useAsyncData` over manual `$fetch` in pages — they handle SSR dedup + hydration.

---

## 14. Stage 12: Migration Waves & Sprint Plan

### 14.1 Overall Timeline

```
Sprint 1–4:  Pre-migration cleanup (Nuxt 2, deploy to production)
Sprint 5:    Nuxt 4 scaffold + foundation on migration branch
Sprint 6–7:  Core infrastructure (auth, API, stores, i18n, toast redesign)
Sprint 8–12: Page migration by traffic priority
Sprint 13:   Testing, QA, performance tuning
Sprint 14:   Production cutover
```

### 14.2 Detailed Sprint Plan

#### Phase A: Pre-Migration (Sprints 1–4) — Deploy to Production

| Sprint | Tasks | Risk | Effort |
|--------|-------|------|--------|
| **Sprint 1** | 3.1 Dead code removal + dead package removal (4 packages) + 3.4 Dead asset cleanup (95 files, ~27% of all assets) + fix `NavDesktop.vue` broken import + safe dep upgrades (non-breaking) | Low | ~1.5 weeks |
| **Sprint 2** | 3.2 SSR fixes (151 localStorage, 100 window., 69 document. — audit + fix) | Low–Medium | ~1.5 weeks |
| **Sprint 3** | 3.3 Complex component redesign planning — audit all 7 component groups (Messages, AddDeal, MainServiceCard, DealDelivery, DealReview, grid/row-style). Document Pusher bindings, `$refs` chains, shared state. Actual redesign happens during migration waves when rewriting to Composition API. | Medium | ~2 weeks |
| **Sprint 4** | 3.6 Mixin preparation + 3.7 Store cleanup. **Note:** 3.5 Responsive refactoring (replacing JS-based `device_width/getIsMobile` with CSS media queries) happens during each page migration wave in Sprints 8–12 — no pre-migration work needed, just awareness. | Low | ~1 week |

#### Phase B: Foundation (Sprint 5) — Migration Branch Only

| Task | Details |
|------|---------|
| Scaffold Nuxt 4 | `npx nuxi@latest init`, `app/` directory structure |
| `nuxt.config.ts` | `runtimeConfig`, Vuetify 3 theme (migrate SCSS variables), i18n 10, `routeRules` |
| i18n-Vuetify RTL sync | Plugin to replace `onBeforeLanguageSwitch` (see 5.2.2) |
| TypeScript setup | `tsconfig.json`, `shared/types/` |
| Install core modules | `@nuxt/image`, `@nuxt/fonts`, `@nuxt/scripts`, `nuxt-security`, Pinia |
| Copy assets | `assets/` (same), `static/` → `public/`, `locales/` |
| Firebase SW | Manually create `public/firebase-messaging-sw.js` from current auto-generated file (see 5.2.3) |

#### Phase C: Core Infrastructure (Sprints 6–7) — Migration Branch

| Sprint | Tasks |
|--------|-------|
| **Sprint 6** | `useAuth` composable (cookie-based) + Nitro API proxy (auth routes + PRIVATE_KEY server-side), `useApi` composable with `showToast` option (replaces localStorage toast pattern), i18n 10 setup with all 6 locales, Vuetify 3 theme + RTL sync plugin |
| **Sprint 7** | Pinia stores (global, auth, chat, deals, wallet, services, serviceForm, ui), Sentry (`@sentry/nuxt`), Firebase/FCM plugin (`useFcm` composable), Pusher plugin (`usePusher` composable), middleware (auth, guest, phone-verified), cross-tab auth sync plugin, **File Upload System rebuild from scratch** (`useFileUpload`, `useFileValidation`, `BaseFilePicker`, `BaseFilePreview`, `BaseFileList` — see 3.3.7) |

#### Phase D: Page Migration (Sprints 8–13) — By Traffic Priority

| Sprint | Pages |
|--------|-------|
| **Sprint 8** | Home + default layout, Auth pages (login, register, OTP, verify), Error page |
| **Sprint 9** | Services (listing, detail), Providers (listing, profile), Category pages |
| **Sprint 10** | Chat page, Blog pages, Plans/Subscription |
| **Sprint 11** | Dashboard, Deals (all sub-pages — view, add, edit, payment, implementation, delivery) |
| **Sprint 12** | My Services, My Profile (+ change email/phone, delete account), Account Settings, Wallet (top-up, withdraw, payment methods), remaining pages |

> **Note:** Sprint 10 from the original plan was split into Sprints 11–12 — the original scope (Dashboard + Deals + Profile + Settings + Wallet + all remaining) was 3 sprints of work, not 1.

#### Phase E: Quality & Cutover (Sprints 13–14)

| Sprint | Tasks |
|--------|-------|
| **Sprint 13** | Write Vitest tests for composables + utils, Write Playwright E2E for critical flows, Performance audit (Lighthouse, Web Vitals), Security audit (nuxt-security headers, CSP) |
| **Sprint 14** | Staging QA with real user flows, Fix regressions, Production cutover, Post-cutover monitoring |

### 14.3 Migration Strategy — Side-by-Side (CONFIRMED)

```
main branch         ← Nuxt 2 production (NEVER breaks)
feat/nuxt4          ← Long-lived migration branch
staging             ← Deploys feat/nuxt4 for comparison
```

- **Both apps run simultaneously** — Nuxt 2 on production, Nuxt 4 on staging. Every migrated page is compared against the running Nuxt 2 version for visual and functional parity
- **Production** deploys from `main` (Nuxt 2) — Sprints 1–4 deploy to production
- **Migration work** on `feat/nuxt4` branch — starts Sprint 5
- **Hotfixes** go to `main`, then merge into `feat/nuxt4`
- **Step-by-step validation** — each migrated feature is QA'd against the Nuxt 2 version before moving to the next
- **Cutover** when ALL pages pass QA on staging (Sprint 14)
- **Toast redesign** ships with `useApi` composable in Sprint 6 — eliminates localStorage toast pattern

---

## 15. Risk Assessment

### Highest Risk: Auth Flow Replacement

- **405 `$auth` references across 94 files** (previously estimated at 127+ across 30+ — actual scope is 3x larger)
- `nuxtServerInit` handles token refresh + currency bootstrap
- `schemes/customRefresh.js` + `broadcastAuth.js` + `fcm-notification.client.js`
- `nuxt-auth-utils` and `@sidebase/nuxt-auth` are NOT suitable — use custom `useAuth` composable + Nitro API proxy (see section 5.2.6)
- **Mitigation:** Build `useAuth` composable with comprehensive tests FIRST (Sprint 5). Test on staging with real auth flows (login, refresh, logout, cross-tab sync, FCM token sync) before any page migration. Create a test matrix covering: login → refresh → logout, tab sync, FCM token registration, SSR hydration, token expiry during navigation.

### Medium Risk: Vuetify 2 → 3

- Grid system changes (`v-row`/`v-col` API changes)
- Component prop API differences (every component)
- RTL handling differences
- **Mitigation:** Migrate page by page, visually test each. Use Vuetify 3 migration guide.

### Medium Risk: Vuetify 2 → 3 Theme & SCSS Migration

- `assets/scss/base/vutifay-variables.scss` has no equivalent in Vuetify 3 — completely different theming system
- `onBeforeLanguageSwitch` callback directly manipulates Vuetify internals — not available in i18n v9
- Every Vuetify component has prop API changes
- **Mitigation:** Audit SCSS variables, map to Vuetify 3 JS theme config. Build i18n-RTL sync plugin early (see 5.2.2). Migrate page by page with visual comparison.

### Medium Risk: Component Decomposition (Pre-migration)

- Extracting from 3,228-line Messages.vue can introduce template binding bugs
- Pusher `.bind()` callbacks reference `this.` methods scattered throughout — event routing will change after split
- Any `$refs` chains will break when child components are extracted
- **Mitigation:** Before splitting, audit for `$refs`, `$parent`, `$children`, all Pusher `.bind()` handlers, and shared reactive data. Manual test full chat flow after each extraction.

### Lower Risk: Everything Else

- Pinia migration: mechanical translation from Vuex patterns
- i18n: config changes, same locale files
- Testing: additive, no risk to production
- Dead code removal: zero references, `npm run build` catches issues

---

## 16. Key Decisions (CONFIRMED)

> All decisions below have been confirmed by the team. These are final.

1. **Nuxt 4 confirmed?** ✅ Yes — Nuxt 3 EOL is July 2026. Go directly to Nuxt 4.

2. **TypeScript?** ✅ Progressive adoption. Start with composables, stores, and server code. Components migrate gradually.

3. **Vuetify 3 or alternative?** ✅ **Vuetify 3** — same ecosystem, minimizes relearning, RTL support is mature, strong Nuxt 4 integration. Massive component API changes expected but acceptable.

4. **Auth approach?** ✅ **Custom `useAuth` composable (cookie-based) + Nitro API proxy** — NOT `nuxt-auth-utils` or `@sidebase/nuxt-auth`. The current auth system (405 `$auth` refs across 94 files, custom refresh scheme, cross-tab sync, FCM sync) requires full control. Nitro proxy stores tokens in httpOnly cookies via h3 `setCookie`/`getCookie`, `PRIVATE_KEY` never exposed to client. See section 5.2.6 for detailed architecture.

5. **Options API vs Composition API?** ✅ **Full Composition API rewrite** — all components will be rewritten to `<script setup>` during migration. No Options API carried over. Slower migration, but cleaner long-term result.

6. **Complex components strategy?** ✅ **Redesign during migration** — NOT migrate-as-is. Each complex component gets its own dedicated refactoring stage (see new Stage 3.6: Complex Component Redesign).

7. **Rollout strategy?** ✅ **Side-by-side** — both Nuxt 2 (production) and Nuxt 4 (migration branch) run simultaneously. Step-by-step migration with comparison against the running Nuxt 2 app for validation.

8. **vue-plyr?** ✅ Replace `<vue-plyr>` in `Gallery.vue` with native `<video>` element — one less dependency.

9. **Testing from day one?** ✅ Yes — set up Vitest + Playwright during scaffold. Write tests alongside each migrated feature, not as an afterthought.

10. **Infinite scroll approach?** ✅ Replace `vue-infinite-loading` with a custom `useInfiniteScroll` composable using `IntersectionObserver` (or use `@vueuse/core`'s `useInfiniteScroll`).

11. **Toast system?** ✅ Replace localStorage-based per-method toast control with a `showToast` option on the `useApi` request composable. Callers opt in per-call — no global state, no localStorage. See section 5.2.5.

---

## Sources

- [Announcing Nuxt 4.0](https://nuxt.com/blog/v4)
- [Nuxt 4 Upgrade Guide](https://nuxt.com/docs/getting-started/upgrade)
- [Nuxt 4 Directory Structure](https://nuxt.com/docs/4.x/directory-structure)
- [Nuxt 4 Performance Best Practices](https://nuxt.com/docs/4.x/guide/best-practices/performance)
- [Nuxt 4 Performance Optimization Guide 2026](https://masteringnuxt.com/blog/nuxt-4-performance-optimization-complete-guide-to-faster-apps-in-2026)
- [Nuxt 4 Sessions and Authentication](https://nuxt.com/docs/4.x/guide/recipes/sessions-and-authentication)
- [nuxt-auth-utils Module](https://nuxt.com/modules/auth-utils)
- [nuxt-security Module](https://nuxt.com/modules/security)
- [Nuxt 4 Layers Architecture](https://nuxt.com/docs/4.x/directory-structure/layers)
- [Vue Best Practices in 2026](https://onehorizon.ai/blog/vue-best-practices-in-2026-architecting-for-speed-scale-and-sanity)
- [Pinia Composables Best Practices](https://pinia.vuejs.org/cookbook/composables.html)
- [Vitest Component Testing](https://vitest.dev/guide/browser/component-testing)
- [Vue Testing Pyramid with Vitest](https://alexop.dev/posts/vue3_testing_pyramid_vitest_browser_mode/)
- [vee-validate v4 Composition API](https://vee-validate.logaretm.com/v4/guide/composition-api/getting-started/)
- [Nuxt Security Good Practices](https://nuxt-security.vercel.app/advanced/good-practices)
- [Vue, Nuxt & Vite Status in 2026](https://fivejars.com/insights/vue-nuxt-vite-status-for-2026-risks-priorities-architecture-updates/)
