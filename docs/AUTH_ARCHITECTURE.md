# Auth Architecture Design — Doworkss Nuxt 4

> Sprint 6 deliverable. This document is the implementation spec for the auth layer.
> **Constraints:** Backend API is frozen. All calls through Nitro. Same feature set as old app.

---

## 1. Architecture Overview

```
                          BROWSER (Client)
                ┌──────────────────────────────────┐
                │  useAuth()     useApi()           │
                │  ├─ login()    ├─ request()       │
                │  ├─ logout()   └─ error routing   │
                │  ├─ verify2FA()                   │
                │  └─ loggedIn / user (reactive)    │
                │                                   │
                │  Plugins:                         │
                │  ├─ broadcast-auth (cross-tab)    │
                │  └─ fcm (push notifications)      │
                └──────────────┬───────────────────┘
                               │ $fetch('/api/...')
                               ▼
                ┌──────────────────────────────────┐
                │         NITRO SERVER              │
                │                                   │
                │  /api/auth/*  (7 dedicated routes) │
                │  ├─ Manage sealed session          │
                │  └─ setUserSession / clear         │
                │                                   │
                │  /api/[...] (catch-all proxy)      │
                │  ├─ Reads session for token         │
                │  ├─ Injects auth + common headers   │
                │  ├─ 401 → refresh + retry once      │
                │  └─ Passes through all status codes │
                │                                   │
                │  Session plugin (SSR)              │
                │  └─ fetch hook: pre-refresh token   │
                └──────────────┬───────────────────┘
                               │ $fetch with headers:
                               │ Authorization: Bearer <token>
                               │ private-key: <env>
                               │ platform: web
                               │ content-language: <locale>
                               │ currency: <code>
                               ▼
                ┌──────────────────────────────────┐
                │         BACKEND API               │
                │  (frozen — no changes)            │
                └──────────────────────────────────┘
```

**Key principles:**
- Client **never** sees tokens, `private-key`, or backend URL
- Sealed httpOnly cookie holds encrypted session (via `nuxt-auth-utils`)
- Nitro is a BFF (Backend-for-Frontend) — all traffic is proxied
- Only 7 dedicated routes + 1 catch-all proxy

---

## 2. Session Design

### What's stored in the sealed cookie

```typescript
// Stored in encrypted httpOnly cookie (~1.5KB total, well under 4KB limit)
{
  user: {                          // → Sent to client via useUserSession()
    id: number
    name: string
    email: string
    phone: string
    countryCode: string
    avatar: string | null
    avatarUrl: string | null
    emailVerifiedAt: string | null
    phoneVerifiedAt: string | null
    currency: string               // e.g. "AED" (just the code, not full object)
    currencyId: number
  },
  secure: {                        // → NEVER sent to client
    token: string                  // JWT access token
    refreshToken: string           // Refresh token
    expiresAt: number              // Unix timestamp (seconds)
  },
  loggedInAt: number               // Timestamp
}
```

### nuxt.config.ts session config

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-auth-utils'],

  runtimeConfig: {
    privateKey: '',                   // NUXT_PRIVATE_KEY
    apiBase: '',                      // NUXT_API_BASE (backend URL, server-only)
    session: {
      maxAge: 60 * 60 * 24 * 365,    // 1 year (matches refresh token lifetime)
      name: 'doworkss-session',
      password: '',                   // NUXT_SESSION_PASSWORD (min 32 chars)
      cookie: {
        sameSite: 'lax',
        secure: true,                 // HTTPS in production
        httpOnly: true,               // Client JS cannot read cookie
      },
    },
    public: {
      apiBase: '',                    // NUXT_PUBLIC_API_BASE (not used by client — just for reference)
      appEnv: '',                     // NUXT_PUBLIC_APP_ENV
    },
  },
})
```

---

## 3. File Structure

```
server/
├── api/
│   ├── auth/
│   │   ├── login.post.ts              # 6.1 — Email/phone login + 2FA retry
│   │   ├── register.post.ts           # 6.2 — Complete registration
│   │   ├── social-login.post.ts       # 6.3 — Google/Apple login + 2FA retry
│   │   ├── social-register.post.ts    # 6.4 — Google/Apple registration
│   │   ├── refresh.post.ts            # 6.5 — Manual token refresh
│   │   ├── logout.post.ts             # 6.6 — Logout + clear session
│   │   ├── 2fa-troubleshoot.post.ts   # 6.7 — 2FA troubleshoot (returns tokens)
│   │   └── refresh-user.post.ts       # 6.8 — Re-fetch user data from backend, update session
│   └── [...].ts                        # 7   — Catch-all proxy
├── plugins/
│   └── session.ts                      # 8   — Session fetch hook (SSR refresh)
└── utils/
    ├── backend.ts                      # 5.1 — Backend fetch utility
    └── auth.ts                         # 5.2 — Shared auth helpers

app/
├── composables/
│   ├── useAuth.ts                      # 9.1 — Auth state + methods
│   └── useApi.ts                       # 9.2 — API wrapper + error routing
├── middleware/
│   ├── auth.ts                         # 10  — Require authentication
│   └── guest.ts                        # 10  — Guest-only pages
├── plugins/
│   ├── broadcast-auth.client.ts        # 11.1 — Cross-tab sync
│   └── fcm.client.ts                   # 11.2 — Firebase messaging
└── pages/auth/
    ├── login.vue                       # 12
    ├── sign-up.vue
    ├── register-otp.vue
    ├── two-factor-authentication.vue
    ├── verify-email.vue
    ├── verify-phone-number.vue
    ├── forgot-password.vue
    ├── forgot-email.vue
    └── set-new-password.vue

shared/
└── types/
    └── auth.d.ts                       # 4 — Session type augmentation
```

---

## 4. Type Definitions

```typescript
// shared/types/auth.d.ts
declare module '#auth-utils' {
  interface User {
    id: number
    name: string
    email: string
    phone: string
    countryCode: string
    avatar: string | null
    avatarUrl: string | null
    emailVerifiedAt: string | null
    phoneVerifiedAt: string | null
    currency: string
    currencyId: number
  }

  interface UserSession {
    loggedInAt: number
  }

  interface SecureSessionData {
    token: string
    refreshToken: string
    expiresAt: number
  }
}

export {}
```

```typescript
// shared/types/api.ts

// Backend login/register response shape
export interface BackendAuthResponse {
  data: {
    token: string
    refresh_token: string
    token_expired_at: string     // ISO 8601 datetime
    id: number
    name: string
    email: string
    phone: string
    country_code: string
    avatar: string | null
    avatar_url: string | null
    email_verified_at: string | null
    phone_verified_at: string | null
    currency: {
      id: number
      currency: string
    }
  }
}

export interface BackendRefreshResponse {
  data: {
    token: string
    refresh_token: string
    token_expired_at: string
  }
}

export interface LoginCredentials {
  email?: string
  phone?: string
  country_code?: string
  password: string
  login_type: 'email' | 'phone'
  platform: 'web'
  device_id: string
  code_2fa?: string
  type_2fa?: 'mfa' | 'email'
}

export interface SocialLoginPayload {
  email: string
  provider_id: string
  provider_name: 'google' | 'apple'
  platform: 'web'
  login_type: 'email'
  code_2fa?: string
  type_2fa?: 'mfa' | 'email'
}
```

---

## 5. Server Utilities

### 5.1 Backend Fetch Utility

```typescript
// server/utils/backend.ts
import type { H3Event } from 'h3'

/**
 * Calls the backend API with common headers.
 * Used by auth routes and the catch-all proxy.
 */
export async function backendFetch<T>(
  path: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    query?: Record<string, string>
    event?: H3Event  // Pass event to extract locale/currency from client request
  } = {},
): Promise<T> {
  const config = useRuntimeConfig()

  const headers: Record<string, string> = {
    'private-key': config.privateKey,
    Accept: 'application/json',
    platform: 'web',
    ...options.headers,
  }

  // Extract locale/currency from client request (needed for localized error messages)
  if (options.event) {
    headers['content-language'] = getHeader(options.event, 'content-language') || 'ar'
    headers['currency'] = getHeader(options.event, 'currency') || 'AED'
  }

  return await $fetch<T>(path, {
    baseURL: config.apiBase,
    method: (options.method as any) || 'GET',
    body: options.body,
    query: options.query,
    headers,
  })
}
```

### 5.2 Auth Helpers

```typescript
// server/utils/auth.ts
import type { BackendAuthResponse } from '~/shared/types/api'
import type { H3Event } from 'h3'

/**
 * Extracts user data from backend response → session.user shape
 */
export function extractUserFromResponse(res: BackendAuthResponse) {
  const d = res.data
  return {
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    countryCode: d.country_code,
    avatar: d.avatar,
    avatarUrl: d.avatar_url,
    emailVerifiedAt: d.email_verified_at,
    phoneVerifiedAt: d.phone_verified_at,
    currency: d.currency?.currency || 'AED',
    currencyId: d.currency?.id || 0,
  }
}

/**
 * Extracts secure data from backend response → session.secure shape
 */
export function extractSecureFromResponse(res: BackendAuthResponse) {
  return {
    token: res.data.token,
    refreshToken: res.data.refresh_token,
    expiresAt: Math.floor(new Date(res.data.token_expired_at).getTime() / 1000),
  }
}

/**
 * Creates a full session from a backend auth response.
 */
export async function createSessionFromResponse(
  event: H3Event,
  res: BackendAuthResponse,
) {
  await setUserSession(event, {
    user: extractUserFromResponse(res),
    secure: extractSecureFromResponse(res),
    loggedInAt: Date.now(),
  })
}

/**
 * Attempts token refresh using the session's refresh token.
 * Returns new tokens on success, null on failure.
 */
export async function attemptTokenRefresh(
  refreshToken: string,
): Promise<{ token: string; refreshToken: string; expiresAt: number } | null> {
  try {
    const res = await backendFetch<{ data: { token: string; refresh_token: string; token_expired_at: string } }>(
      '/refresh-token',
      {
        method: 'POST',
        headers: {
          Authorization: refreshToken, // Raw token, no Bearer prefix — backend contract
        },
      },
    )

    return {
      token: res.data.token,
      refreshToken: res.data.refresh_token,
      expiresAt: Math.floor(new Date(res.data.token_expired_at).getTime() / 1000),
    }
  } catch {
    return null
  }
}
```

---

## 6. Auth Server Routes

### 6.1 Login

Handles initial login AND 2FA retry (client re-submits with `code_2fa`).

```typescript
// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    const res = await backendFetch<BackendAuthResponse>('/login', {
      method: 'POST',
      body,
      event, // Pass event for locale/currency headers
    })

    await createSessionFromResponse(event, res)
    return { success: true, user: extractUserFromResponse(res) }
  } catch (error: any) {
    // Backend returns 302 for "2FA required"
    if (error.statusCode === 302) {
      return { requires2FA: true }
    }

    throw createError({
      statusCode: error.statusCode || 500,
      data: error.data,
    })
  }
})
```

### 6.2 Register

```typescript
// server/api/auth/register.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const res = await backendFetch<BackendAuthResponse>('/register', {
    method: 'POST',
    body,
    event,
  })

  await createSessionFromResponse(event, res)
  return {
    success: true,
    user: extractUserFromResponse(res),
    messageBrideId: res.data.message_bride_id || null, // For HLR phone verification
  }
})
```

### 6.3 Social Login

Same structure as login — handles initial + 2FA retry.

```typescript
// server/api/auth/social-login.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    const res = await backendFetch<BackendAuthResponse>('/login-by-social-media', {
      method: 'POST',
      body,
      event,
    })

    await createSessionFromResponse(event, res)
    return { success: true, user: extractUserFromResponse(res) }
  } catch (error: any) {
    if (error.statusCode === 302) {
      return { requires2FA: true }
    }

    throw createError({
      statusCode: error.statusCode || 500,
      data: error.data,
    })
  }
})
```

### 6.4 Social Register

```typescript
// server/api/auth/social-register.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const res = await backendFetch<BackendAuthResponse>('/register-by-social-media', {
    method: 'POST',
    body,
    event,
  })

  await createSessionFromResponse(event, res)
  return { success: true, user: extractUserFromResponse(res) }
})
```

### 6.5 Refresh

```typescript
// server/api/auth/refresh.post.ts
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const refreshed = await attemptTokenRefresh(session.secure.refreshToken)
  if (!refreshed) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, message: 'Refresh failed' })
  }

  await replaceUserSession(event, {
    user: session.user,
    secure: refreshed,
    loggedInAt: session.loggedInAt,
  })

  return { success: true }
})
```

### 6.6 Logout

```typescript
// server/api/auth/logout.post.ts
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const body = await readBody(event)

  // Tell backend to invalidate tokens (best-effort)
  if (session.secure?.token) {
    try {
      await backendFetch('/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.secure.token}` },
        body: {
          logout_from_all_device: body?.allDevices ? 1 : 0,
        },
        event,
      })
    } catch {
      // Backend logout failed — still clear local session
    }
  }

  // Change online status to offline (best-effort)
  if (session.secure?.token) {
    try {
      await backendFetch('/change-online-status', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.secure.token}` },
        body: { is_online: 0 },
      })
    } catch {
      // Non-critical — don't block logout
    }
  }

  await clearUserSession(event)
  return { success: true }
})
```

### 6.7 2FA Troubleshoot

Returns tokens on success — needs session creation.

```typescript
// server/api/auth/2fa-troubleshoot.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const res = await backendFetch<BackendAuthResponse>('/troubleshoot-2fa', {
    method: 'POST',
    body,
    event,
  })

  // troubleshoot-2fa returns tokens on success
  if (res.data?.token) {
    await createSessionFromResponse(event, res)
  }

  return { success: true, user: res.data ? extractUserFromResponse(res) : null }
})
```

### 6.8 Refresh User Data

Re-fetches user from backend and updates session. Called after profile updates (name, avatar, phone change) to keep session.user in sync.

```typescript
// server/api/auth/refresh-user.post.ts
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const res = await backendFetch<{ data: BackendAuthResponse['data'] }>('/user-information', {
    method: 'GET',
    headers: { Authorization: `Bearer ${session.secure.token}` },
    event,
  })

  const updatedUser = extractUserFromResponse({ data: res.data } as BackendAuthResponse)

  await replaceUserSession(event, {
    user: updatedUser,
    secure: session.secure,
    loggedInAt: session.loggedInAt,
  })

  return { user: updatedUser }
})
```

---

## 7. Catch-All Proxy

Handles every request that doesn't match a specific auth route.

```typescript
// server/api/[...].ts
import {
  getProxyRequestHeaders,
  readBody,
  getQuery,
  getHeader,
  setResponseStatus,
  setResponseHeader,
  readRawBody,
} from 'h3'

// Mutex for token refresh — prevents concurrent refresh attempts
let refreshPromise: Promise<any> | null = null

export default defineEventHandler(async (event) => {
  const path = event.context.params?._ || ''

  // Block direct access to auth routes via catch-all
  if (path.startsWith('auth/') || path.startsWith('_auth/')) {
    throw createError({ statusCode: 404 })
  }

  const session = await getUserSession(event)
  const config = useRuntimeConfig()

  // Build target URL
  const targetUrl = `/${path}`
  const query = getQuery(event)

  // Build headers
  const locale = getHeader(event, 'content-language') || 'ar'
  const currency = getHeader(event, 'currency')
    || session.user?.currency
    || 'AED'

  const headers: Record<string, string> = {
    'private-key': config.privateKey,
    Accept: 'application/json',
    platform: 'web',
    'content-language': locale,
    currency: currency,
  }

  if (session.secure?.token) {
    headers.Authorization = `Bearer ${session.secure.token}`
  }

  // Read body for non-GET requests
  const method = event.method
  let body: any = undefined
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const contentType = getHeader(event, 'content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      // File uploads: forward raw body + original content-type (includes boundary)
      body = await readRawBody(event, false)
      headers['content-type'] = contentType
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // URLEncoded forms (e.g., DELETE with array params): forward raw body
      body = await readRawBody(event)
      headers['content-type'] = contentType
    } else {
      body = await readBody(event)
    }
  }

  // Make the request
  let response = await $fetch.raw(targetUrl, {
    baseURL: config.apiBase,
    method: method as any,
    headers,
    body,
    query: query as Record<string, string>,
    ignoreResponseError: true, // Don't throw on 4xx/5xx
  })

  // Handle 401 — attempt token refresh + retry once
  if (response.status === 401 && session.secure?.refreshToken) {
    const refreshed = await deduplicatedRefresh(session.secure.refreshToken)

    if (refreshed) {
      // Update session with new tokens
      await replaceUserSession(event, {
        user: session.user,
        secure: refreshed,
        loggedInAt: session.loggedInAt,
      })

      // Retry with new token
      headers.Authorization = `Bearer ${refreshed.token}`
      response = await $fetch.raw(targetUrl, {
        baseURL: config.apiBase,
        method: method as any,
        headers,
        body,
        query: query as Record<string, string>,
        ignoreResponseError: true,
      })
    }
  }

  // Pass through response status
  setResponseStatus(event, response.status)

  // Forward relevant response headers
  for (const key of ['content-type', 'content-disposition', 'cache-control']) {
    const value = response.headers.get(key)
    if (value) setResponseHeader(event, key, value)
  }

  return response._data
})

/**
 * Deduplicates concurrent refresh attempts.
 * If a refresh is already in-flight, subsequent calls wait for it.
 */
async function deduplicatedRefresh(refreshToken: string) {
  if (refreshPromise) return refreshPromise

  refreshPromise = attemptTokenRefresh(refreshToken)
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}
```

---

## 8. Session Plugin — SSR Token Refresh

Pre-refreshes expired tokens during SSR so the first page load doesn't trigger a 401.

```typescript
// server/plugins/session.ts
export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    // No session or no token — nothing to do
    if (!session.secure?.token || !session.secure?.expiresAt) return

    const now = Math.floor(Date.now() / 1000)
    const bufferSeconds = 60 // Refresh 60s before expiry

    // Token still valid — no action needed
    if (session.secure.expiresAt - bufferSeconds > now) return

    // Token expired or about to expire — attempt refresh
    if (!session.secure.refreshToken) return

    try {
      const refreshed = await attemptTokenRefresh(session.secure.refreshToken)

      if (refreshed) {
        // Persist refreshed tokens to cookie
        await replaceUserSession(event, {
          user: session.user,
          secure: refreshed,
          loggedInAt: session.loggedInAt,
        })

        // Update in-flight session so this SSR request uses new tokens
        session.secure.token = refreshed.token
        session.secure.refreshToken = refreshed.refreshToken
        session.secure.expiresAt = refreshed.expiresAt
      }
    } catch {
      // Refresh failed during SSR — don't clear session here.
      // Let the client handle re-auth after hydration.
      // This prevents SSR/client hydration mismatch.
    }
  })
})
```

---

## 9. Client Composables

### 9.1 useAuth

```typescript
// app/composables/useAuth.ts

interface LoginResult {
  success?: boolean
  requires2FA?: boolean
  user?: any
}

export function useAuth() {
  const {
    loggedIn,
    user,
    session,
    fetch: refreshSession,
    clear: clearSession,
  } = useUserSession()

  // Temporary state for 2FA flow — survives navigation
  const pendingLogin = useState<{
    credentials: any
    endpoint: '/api/auth/login' | '/api/auth/social-login'
  } | null>('auth-pending-login', () => null)

  // ── Device ID (persistent, generated once) ─────

  function getDeviceId(): string {
    const STORAGE_KEY = 'Doworkss_guest_id'
    let deviceId = localStorage.getItem(STORAGE_KEY)
    if (!deviceId) {
      const raw = `${navigator.userAgent}_${Date.now()}`
      // Simple hash — same pattern as old app
      let hash = 0
      for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0
      }
      deviceId = Math.abs(hash).toString(36)
      localStorage.setItem(STORAGE_KEY, deviceId)
    }
    return deviceId
  }

  // ── Login ──────────────────────────────────────

  async function login(credentials: LoginCredentials): Promise<LoginResult> {
    const result = await $fetch<LoginResult>('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })

    if (result.requires2FA) {
      pendingLogin.value = { credentials, endpoint: '/api/auth/login' }
      return { requires2FA: true }
    }

    await refreshSession()
    return { success: true, user: result.user }
  }

  // ── Social Login ───────────────────────────────

  async function socialLogin(payload: SocialLoginPayload): Promise<LoginResult> {
    const result = await $fetch<LoginResult>('/api/auth/social-login', {
      method: 'POST',
      body: payload,
    })

    if (result.requires2FA) {
      pendingLogin.value = { credentials: payload, endpoint: '/api/auth/social-login' }
      return { requires2FA: true }
    }

    await refreshSession()
    return { success: true, user: result.user }
  }

  // ── 2FA Verify (re-submit login with code) ────

  async function verify2FA(code: string, type: 'mfa' | 'email' = 'mfa'): Promise<LoginResult> {
    const pending = pendingLogin.value
    if (!pending) throw new Error('No pending 2FA login')

    const body = {
      ...pending.credentials,
      code_2fa: code,
      type_2fa: type,
    }

    const result = await $fetch<LoginResult>(pending.endpoint, {
      method: 'POST',
      body,
    })

    pendingLogin.value = null
    await refreshSession()
    return { success: true, user: result.user }
  }

  // ── 2FA Troubleshoot ──────────────────────────

  async function troubleshoot2FA(payload: {
    code: string
    type: 'email' | 'phone'
    email?: string
    phone?: string
    country_code?: string
  }): Promise<LoginResult> {
    const result = await $fetch<LoginResult>('/api/auth/2fa-troubleshoot', {
      method: 'POST',
      body: payload,
    })

    pendingLogin.value = null
    await refreshSession()
    return { success: true, user: result.user }
  }

  // ── Register ──────────────────────────────────

  async function register(payload: any) {
    const result = await $fetch<any>('/api/auth/register', {
      method: 'POST',
      body: payload,
    })

    await refreshSession()
    return result
  }

  // ── Social Register ───────────────────────────

  async function socialRegister(payload: any) {
    const result = await $fetch<any>('/api/auth/social-register', {
      method: 'POST',
      body: payload,
    })

    await refreshSession()
    return result
  }

  // ── Logout ────────────────────────────────────

  async function logout(allDevices = false) {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
        body: { allDevices },
      })
    } catch {
      // Backend logout failed — still clear local session
    }

    // Clean up client-side state
    if (import.meta.client) {
      const userId = user.value?.id
      // Clear 2FA reminder dismissals
      if (userId) {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith(`${userId}_enable2FaReminder_`)) {
            localStorage.removeItem(key)
          }
        }
      }
    }

    await clearSession()
  }

  // ── Refresh User Data (after profile update) ──

  async function refreshUser() {
    await $fetch('/api/auth/refresh-user', { method: 'POST' })
    await refreshSession()
  }

  // ── Refresh Session ───────────────────────────

  async function refresh() {
    await $fetch('/api/auth/refresh', { method: 'POST' })
    await refreshSession()
  }

  return {
    // State (reactive, SSR-hydrated)
    loggedIn,
    user,
    session,
    pendingLogin: readonly(pendingLogin),

    // Methods
    login,
    socialLogin,
    register,
    socialRegister,
    logout,
    refresh,
    refreshUser,
    verify2FA,
    troubleshoot2FA,
    refreshSession,
    getDeviceId,
  }
}
```

### 9.2 useApi

```typescript
// app/composables/useApi.ts

interface RequestOptions extends Omit<Parameters<typeof $fetch>[1], 'baseURL'> {
  showToast?: boolean    // Show error toasts (default: true)
}

export function useApi() {
  const { locale } = useI18n()
  const auth = useAuth()
  const router = useRouter()
  const localePath = useLocalePath()

  async function request<T = any>(
    url: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { showToast = true, ...fetchOptions } = options

    try {
      return await $fetch<T>(`/api${url}`, {
        ...fetchOptions,
        headers: {
          'content-language': locale.value,
          'currency': auth.user.value?.currency || getGuestCurrency(),
          ...fetchOptions.headers,
        },
      })
    } catch (error: any) {
      const status = error?.statusCode || error?.status

      // Route based on business-logic status codes
      switch (status) {
        case 401:
          // Proxy already tried refresh — if still 401, force logout
          await auth.logout()
          navigateTo(localePath('/auth/login'))
          break

        case 406:
          navigateTo(localePath('/auth/verify-email'))
          break

        case 412:
          handlePhoneVerification()
          break

        case 431:
          useGlobalStore().showUpgradePlanModal()
          break

        case 303:
          useGlobalStore().showEmptyWalletModal()
          break

        case 429:
          if (showToast) {
            useToast().error(useI18n().t('errors.too-many-requests'))
          }
          break

        // 403/404/500 — re-throw. Nuxt handles these natively via showError()
        // or the caller can catch them for custom handling.
      }

      // Show validation error toasts (backend returns { message: { field: [errors] } })
      if (showToast && status !== 302 && status !== 412) {
        const errorMsgs = error?.data?.message
        if (errorMsgs) {
          if (typeof errorMsgs === 'object' && !Array.isArray(errorMsgs)) {
            for (const field of Object.values(errorMsgs) as string[][]) {
              field.forEach((msg: string) => useToast().error(msg))
            }
          } else if (typeof errorMsgs === 'string') {
            useToast().error(errorMsgs)
          }
        }
      }

      // Re-throw so callers can handle specific cases
      throw error
    }
  }

  function handlePhoneVerification() {
    const user = auth.user.value
    if (user?.phone && !user.phoneVerifiedAt) {
      navigateTo(localePath({
        name: 'auth-verify-phone-number',
        query: { phone: user.phone, country_code: user.countryCode },
      }))
    } else if (user && !user.phone) {
      navigateTo(localePath({
        name: 'my-profile-change-phone-number',
        query: { add: 'true' },
      }))
    }
  }

  function getGuestCurrency(): string {
    return useCookie('doworkss-currency').value || 'AED'
  }

  return { request }
}
```

---

## 10. Middleware

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useAuth()
  if (!loggedIn.value) {
    return navigateTo(useLocalePath()('/auth/login'))
  }
})
```

```typescript
// app/middleware/guest.ts
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useAuth()
  if (loggedIn.value) {
    return navigateTo(useLocalePath()('/'))
  }
})
```

Usage in pages:

```typescript
// pages/auth/login.vue
definePageMeta({ middleware: 'guest' })

// pages/dashboard/index.vue
definePageMeta({ middleware: 'auth' })
```

---

## 11. Client Plugins

### 11.1 Cross-Tab Auth Sync

```typescript
// app/plugins/broadcast-auth.client.ts
export default defineNuxtPlugin(() => {
  const { loggedIn } = useAuth()
  const channel = new BroadcastChannel('doworkss-auth')

  // Listen for auth events from other tabs
  channel.onmessage = (event) => {
    if (event.data?.type === 'logout' || event.data?.type === 'login') {
      window.location.reload()
    }
  }

  // Broadcast when auth state changes
  watch(loggedIn, (isLoggedIn, wasLoggedIn) => {
    if (wasLoggedIn === undefined) return // Initial load, don't broadcast
    channel.postMessage({ type: isLoggedIn ? 'login' : 'logout' })
  })

  // Cleanup
  if (import.meta.client) {
    window.addEventListener('beforeunload', () => channel.close())
  }
})
```

### 11.2 FCM Push Notifications

```typescript
// app/plugins/fcm.client.ts
export default defineNuxtPlugin(() => {
  const { loggedIn } = useAuth()
  const api = useApi()

  watch(loggedIn, async (isLoggedIn) => {
    if (isLoggedIn) {
      await syncFcmToken()
    }
  }, { immediate: true })

  async function syncFcmToken() {
    try {
      const { getMessaging, getToken } = await import('firebase/messaging')
      const messaging = getMessaging()
      const token = await getToken(messaging, {
        vapidKey: useRuntimeConfig().public.firebaseFcmVapidKey,
      })

      if (token) {
        await api.request('/update-fcm', {
          method: 'POST',
          body: { fcm_token: token },
          showToast: false,
        })
      }
    } catch {
      // FCM not supported or permission denied — silently ignore
    }
  }
})
```

---

## 12. Auth Pages Matrix

| Page | Route | Middleware | Key Actions |
|------|-------|-----------|-------------|
| Login | `/auth/login` | `guest` | `useAuth().login()`, `useAuth().socialLogin()` |
| Sign Up | `/auth/sign-up` | `guest` | `useApi().request('/send-register-otp', ...)` then navigate to OTP page |
| Register OTP | `/auth/register-otp` | `guest` | `useAuth().register()` with OTP code |
| 2FA | `/auth/two-factor-authentication` | none | `useAuth().verify2FA()`, `useAuth().troubleshoot2FA()` |
| Verify Email | `/auth/verify-email` | `auth` | `useApi().request('/send-otp-code', ...)`, `useApi().request('/verify-otp-code', ...)` |
| Verify Phone | `/auth/verify-phone-number` | `auth` | Same OTP pattern |
| Forgot Password | `/auth/forgot-password` | `guest` | `useApi().request('/send-otp-code', { cause: 'password' })` |
| Forgot Email | `/auth/forgot-email` | `guest` | `useApi().request('/forget-email', ...)` |
| Set New Password | `/auth/set-new-password` | `guest` | `useApi().request('/reset-password', ...)` |
| 2FA Settings | `/two-step-verification` | `auth` | `useApi().request('/generate-2fa-qr-code')`, `/enable-2fa`, `/disable-2fa` |
| Delete Account | `/my-profile` (section) | `auth` | `useApi().request('/providers/delete/account', ...)` + OTP verification |
| Change Phone | `/my-profile/change-phone-number` | `auth` | `useApi().request('/change-email-phone', ...)` + OTP + `useAuth().refreshUser()` |

**Note:** OTP send/verify, 2FA management, phone change, delete account — all go through the catch-all proxy because they don't create/destroy sessions. After profile updates that change user data, call `useAuth().refreshUser()` to sync session.

---

## 13. Error Handling Matrix

| HTTP Status | Source | Handler | Action |
|-------------|--------|---------|--------|
| **302** | Login/social-login only | `server/api/auth/login.post.ts` | Returns `{ requires2FA: true }` to client |
| **303** | Any API call | `useApi` | Show empty wallet modal |
| **401** | Any proxied call | `server/api/[...].ts` proxy | Auto-refresh token + retry once. If still 401 → pass to client |
| **401** | After proxy retry | `useApi` | Force logout, redirect to login |
| **403** | Any API call | `useApi` | Show 403 error page |
| **406** | Any API call | `useApi` | Navigate to verify-email |
| **412** | Any API call | `useApi` | Navigate to verify-phone or add-phone |
| **429** | Any API call | `useApi` | Show toast "too many requests" |
| **431** | Any API call | `useApi` | Show upgrade plan modal |
| **404** | Any API call | `useApi` | Show 404 error page |
| **500** | Any API call | `useApi` | Show 500 error page |

---

## 14. Edge Cases & Solutions

### 14.1 Concurrent 401s → Multiple Refresh Attempts

**Problem:** 3 API calls fire, token expires, all 3 get 401, all 3 try to refresh.

**Solution:** `deduplicatedRefresh()` in the proxy (Section 7). Uses a shared promise — first caller triggers the refresh, subsequent callers await the same promise.

### 14.2 SSR Refresh Failure → Hydration Mismatch

**Problem:** Token refresh fails during SSR (backend down). If we clear auth on server but client expects logged-in state → mismatch.

**Solution:** Session `fetch` hook (Section 8) catches the error silently. Session data remains intact for this request. Client will handle re-auth after hydration.

### 14.3 Cookie Size Limit (~4KB)

**Problem:** If session data is too large, the sealed cookie exceeds browser limits.

**Solution:** Session stores only minimal data (~1.5KB estimated):
- `user`: id, name, email, phone, countryCode, avatar, avatarUrl, verified flags, currency (~500 bytes)
- `secure`: token (~800 bytes JWT), refreshToken (~300 bytes), expiresAt (10 bytes)
- Overhead (iron sealing, base64): ~1.5x

Full user profile data is fetched from `/user-information` via the proxy when needed.

### 14.4 File Uploads Through Proxy

**Problem:** Multipart form-data uploads need special handling in the proxy.

**Solution:** Proxy detects `multipart/form-data` content-type, uses `readRawBody()` to forward the binary body as-is, preserving the original content-type header (which includes the boundary).

### 14.5 Token Expires Between SSR Load and Client API Call

**Problem:** SSR loads at T=0 (token valid for 30 more seconds). Client hydrates at T=1, makes API call at T=31 → 401.

**Solution:** Two-layer refresh:
1. Session `fetch` hook refreshes 60 seconds before expiry (proactive)
2. Proxy catches 401 and retries with refreshed token (reactive)

### 14.6 2FA State Lost on Page Navigation

**Problem:** User submits login → gets 302 (2FA) → navigates to 2FA page. Credentials need to survive navigation.

**Solution:** `pendingLogin` in `useAuth` uses `useState()` which survives SSR hydration and client-side navigation. Cleared after successful 2FA or on page leave.

### 14.7 Logout From All Devices

**Problem:** Current app supports multi-device logout.

**Solution:** The logout Nitro route already calls backend `POST /logout`. Add `logout_from_all_device` param to the body. Other devices' next API call will get 401 → proxy refresh fails (backend invalidated all tokens) → client redirects to login.

### 14.8 Guest Currency Header

**Problem:** Unauthenticated users need a `currency` header on API calls.

**Solution:** `useApi` reads currency from `auth.user.currency` (logged in) or `doworkss-currency` cookie (guest). The proxy forwards this header to the backend.

### 14.9 Session User Data Becomes Stale After Profile Update

**Problem:** User updates name/avatar/phone via `/update-auth-information`. Session cookie still has old data.

**Solution:** `useAuth().refreshUser()` calls `POST /api/auth/refresh-user` → Nitro route fetches `GET /user-information` from backend with current token → updates `session.user` → returns fresh data to client. Called explicitly after profile changes.

### 14.10 Online Status on Page Unload (Keepalive)

**Problem:** When user closes the browser tab, the old app sends `POST /change-online-status` with `keepalive: true`. Through the Nitro proxy, this might not complete during page unload.

**Solution:** Use `navigator.sendBeacon()` as primary, `fetch()` with `keepalive: true` as fallback. Both target `/api/change-online-status` (the proxy). Since Nitro is same-origin and fast, the request reaches Nitro before the page dies. Nitro forwards to backend asynchronously.

```typescript
// In chat presence plugin
window.addEventListener('beforeunload', () => {
  const payload = JSON.stringify({ is_online: 0 })
  const sent = navigator.sendBeacon('/api/change-online-status', payload)
  if (!sent) {
    fetch('/api/change-online-status', {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    })
  }
})
```

### 14.11 HLR Phone Verification After Registration

**Problem:** After registration, if backend returns `message_bride_id`, the app polls `GET /check-hlr-status?id={id}` to auto-verify phone via SMS bridge.

**Solution:** Goes through the catch-all proxy (no session management needed). Register route already returns `messageBrideId` (Section 6.2). Client polls via `useApi().request('/check-hlr-status', { query: { id } })`. If successful, phone is auto-verified — call `useAuth().refreshUser()` to update session.

### 14.12 Localized Backend Error Messages

**Problem:** Auth routes (login, register) need `content-language` header so the backend returns error messages in the user's language.

**Solution:** `backendFetch()` accepts an optional `event` parameter. When passed, it extracts `content-language` and `currency` from the client request headers. All auth routes pass `event` to `backendFetch()`. The catch-all proxy reads these headers directly from the incoming request.

---

## 15. Testing Plan

### Integration Tests (Required before page migration)

| Test | What It Verifies |
|------|-----------------|
| Login → session created | Nitro route creates sealed session, `useAuth().loggedIn === true` |
| Login with wrong password | Backend error passed through, no session created |
| Token refresh (manual) | `POST /api/auth/refresh` updates session tokens |
| Token refresh (automatic via proxy) | Proxy catches 401, refreshes, retries, returns data |
| Token refresh (SSR) | Session `fetch` hook refreshes expired token during SSR |
| Logout → session cleared | Session cookie removed, `loggedIn === false` |
| 2FA flow | Login 302 → `requires2FA` returned → verify2FA succeeds → session created |
| Cross-tab sync | Login in tab A → tab B reloads. Logout in tab A → tab B reloads. |
| File upload through proxy | Multipart form-data proxied correctly to backend |
| Error routing | 406 → verify-email, 412 → verify-phone, 431 → modal |
| Concurrent 401s | Multiple calls get 401, only 1 refresh fires, all retry |
| Refresh user data | After profile update, `refreshUser()` updates session.user |
| Multi-device logout | `logout(true)` → other devices get 401 on next request |
| Social login + 2FA | Social login returns 302 → verify2FA works with social credentials |
| Validation error toasts | Backend validation errors displayed as individual toast messages |
| URLEncoded DELETE | DELETE with `application/x-www-form-urlencoded` body proxied correctly |
| Keepalive online status | `sendBeacon` fires on page unload, proxied correctly |

---

## 16. Migration Mapping

Quick reference for rewriting old `$auth` calls:

| Old (Nuxt 2) | New (Nuxt 4) |
|---------------|-------------|
| `this.$auth.loggedIn` | `useAuth().loggedIn.value` |
| `this.$auth.user` | `useAuth().user.value` |
| `this.$auth.loginWith('local', { data })` | `useAuth().login(data)` |
| `this.$auth.logout()` | `useAuth().logout()` |
| `this.$auth.refreshTokens()` | `useAuth().refresh()` |
| `this.$auth.setUserToken(token, refresh)` | N/A — handled server-side |
| `this.$auth.$storage.getCookie('x')` | `useCookie('x').value` |
| `this.$auth.$storage.setCookie('x', v)` | `useCookie('x').value = v` |
| `this.$request({ url, method, data })` | `useApi().request(url, { method, body })` |
| `this.$auth.user.currency.currency` | `useAuth().user.value?.currency` |
| `this.$store.dispatch('user/register')` | `useAuth().register(payload)` |
| `this.$store.dispatch('user/login_by_social_media')` | `useAuth().socialLogin(payload)` |
| `this.$store.dispatch('user/register_by_social_media')` | `useAuth().socialRegister(payload)` |
| `changeOnlineStatus(0)` (logout) | Handled by logout Nitro route automatically |
| `localStorage.getItem("Doworkss_guest_id")` | `useAuth().getDeviceId()` (client-only) |
| Profile update → stale `$auth.user` | `useAuth().refreshUser()` after profile save |
