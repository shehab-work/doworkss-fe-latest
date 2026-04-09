# Step 5.7: Environment Configuration

## Todos

- [ ] Create `.env.example` with all variables documented
- [ ] Create local `.env` with development values
- [ ] Verify `.env` is in `.gitignore`
- [ ] Verify `useRuntimeConfig()` reads all vars correctly

## .env.example (Sprint 5 — scaffold only)

```env
# ═══════════════════════════════════════════
# App
# ═══════════════════════════════════════════
NUXT_PUBLIC_APP_ENV=development
NUXT_PUBLIC_API_BASE=https://api.doworkss.com
NUXT_PUBLIC_HOST_NAME=https://doworkss.com

# ═══════════════════════════════════════════
# Server-only
# ═══════════════════════════════════════════
NUXT_PRIVATE_KEY=
```

## Variables to Add in Later Sprints

### Sprint 6 (Auth)
```env
NUXT_SESSION_PASSWORD=                      # Min 32 chars, for sealed cookie sessions
NUXT_PUBLIC_GOOGLE_CLIENT_ID=
NUXT_PUBLIC_APPLE_CLIENT_ID=
NUXT_PUBLIC_APPLE_REDIRECT_URI=
```

### Sprint 7 (Plugins)
```env
# Payment — Tap
NUXT_PUBLIC_TAP_PUBLIC_KEY=
NUXT_PUBLIC_TAP_MERCHANT_ID=
NUXT_PUBLIC_TAP_ENVIRONMENT=
NUXT_TAP_SECRET_KEY=

# Real-time — Pusher
NUXT_PUBLIC_PUSHER_APP_KEY=
NUXT_PUBLIC_PUSHER_CLUSTER=

# Firebase (FCM only)
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=
NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NUXT_PUBLIC_FIREBASE_FCM_VAPID_KEY=

# Monitoring — Sentry
NUXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# SEO & Analytics
NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NUXT_PUBLIC_GTAG_ID=
```

## Naming Convention

- `NUXT_` prefix — auto-mapped to `runtimeConfig` by Nuxt 4
- `NUXT_PUBLIC_` — accessible on client + server (`runtimeConfig.public.*`)
- `NUXT_` (without PUBLIC) — server-only (`runtimeConfig.*`)
- Other prefixes (e.g. `SENTRY_AUTH_TOKEN`) — accessed via `process.env` in nuxt.config.ts only

## .gitignore additions

```gitignore
# Already in default .gitignore but verify:
.env
.env.*
!.env.example
```
