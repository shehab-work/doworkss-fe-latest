# Step 5.5: Copy Assets & Locales

## Todos

- [ ] Copy locale JSON files to `i18n/locales/` (NOT `locales/` at root)
- [ ] Copy SCSS files to `app/assets/scss/` (rewrite vuetify overrides)
- [ ] Copy used icons (skip 48 dead files per UPGRADE_PART_ONE Section 3.4)
- [ ] Copy used images — consolidate `images/` + `imgs/` into single `images/`
- [ ] Copy used SVGs (skip 20 dead files)
- [ ] Copy static assets to `public/`
- [ ] Verify no broken asset references

> **Deferred → Sprint 7:** Firebase messaging service worker (`public/firebase-messaging-sw.js`) — create when installing firebase.

## Locales

```bash
# From old repo to new i18n/ directory (i18n v10 requirement)
cp doworkss_frontend/locales/ar.json doworkss-FE-latest/i18n/locales/ar.json
cp doworkss_frontend/locales/en.json doworkss-FE-latest/i18n/locales/en.json
cp doworkss_frontend/locales/tr.json doworkss-FE-latest/i18n/locales/tr.json
cp doworkss_frontend/locales/fr.json doworkss-FE-latest/i18n/locales/fr.json
cp doworkss_frontend/locales/es.json doworkss-FE-latest/i18n/locales/es.json
cp doworkss_frontend/locales/ur.json doworkss-FE-latest/i18n/locales/ur.json
```

Do NOT copy `vee-validate-ur.json` — vee-validate v4 uses `@vee-validate/i18n` built-in locales.

## SCSS Files

| Old File | New Location | Action |
|---|---|---|
| `assets/scss/main.scss` | `app/assets/scss/main.scss` | Copy, update import paths |
| `assets/scss/_global.scss` | `app/assets/scss/_global.scss` | Copy as-is |
| `assets/scss/_utils.scss` | `app/assets/scss/_utils.scss` | Copy, check Vuetify 4 utility conflicts |
| `assets/scss/_vuetify-override.scss` | `app/assets/scss/_vuetify-override.scss` | **Major rewrite** — Vuetify 4 uses CSS layers (no `!important`), class names changed |
| `assets/scss/base/custom-variables.scss` | `app/assets/scss/base/custom-variables.scss` | Copy as-is |
| `assets/scss/base/vutifay-variables.scss` | **DELETE** | Replaced by `vuetify.config.ts` theme config |
| `assets/scss/base/helper.scss` | `app/assets/scss/base/helper.scss` | Copy, check conflicts |
| `assets/scss/base/reset.scss` | `app/assets/scss/base/reset.scss` | Copy as-is |
| `assets/scss/base/global.scss` | `app/assets/scss/base/global.scss` | Copy as-is |
| `assets/scss/shared/wallet.scss` | `app/assets/scss/shared/wallet.scss` | Copy, update Vuetify selectors |

## Public / Static Files

```bash
# Copy from old static/ to new public/
cp doworkss_frontend/static/favicon.ico doworkss-FE-latest/public/favicon.ico
cp doworkss_frontend/static/logo-preview.png doworkss-FE-latest/public/logo-preview.png
# Firebase SW deferred to Sprint 7
```

## Firebase Messaging Service Worker — DEFERRED → Sprint 7

> Create `public/firebase-messaging-sw.js` when installing firebase in Sprint 7.
> Uses Firebase SDK v12 compat imports. See Sprint 7 plan for full implementation.

## Notes

- **Consolidate image folders**: Old repo has both `assets/images/` and `assets/imgs/` with overlapping content. Merge into single `app/assets/images/` in new repo.
- **Consolidate social icons**: Three separate folders in old repo → single `app/assets/icons/social/`
- **Skip dead assets**: 95 unreferenced files identified in UPGRADE_PART_ONE Section 3.4
- **SVG standardization**: Where both PNG and SVG exist, keep only SVG
