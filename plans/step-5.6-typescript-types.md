# Step 5.6: TypeScript Type Definitions

## Todos

- [ ] Create `shared/types/auth.ts` — User, LoginDTO, AuthState
- [ ] Create `shared/types/service.ts` — Service, ServiceListItem, ServiceFormData
- [ ] Create `shared/types/deal.ts` — Deal, DealStatus, DealDelivery
- [ ] Create `shared/types/api.ts` — ApiResponse, ApiError, PaginatedResponse
- [ ] Create `shared/types/chat.ts` — Conversation, Message
- [ ] Create `shared/types/user.ts` — Currency, Category, Notification
- [ ] Verify types auto-import in both `app/` and `server/`

> **DEFERRED → Sprint 6:** `shared/types/auth.d.ts` (nuxt-auth-utils `#auth-utils` augmentation) — create when installing nuxt-auth-utils

## shared/types/auth.ts

```typescript
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

export interface LoginDTO {
  email: string
  password: string
  device_id?: string
}

export interface RegisterDTO {
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  account_type: 'individual' | 'business'
}

export interface AuthTokens {
  token: string
  refresh_token: string
}
```

## shared/types/auth.d.ts — DEFERRED → Sprint 6

> Create this file when installing `nuxt-auth-utils` in Sprint 6.
> It augments the `#auth-utils` module with custom User, UserSession, and SecureSessionData types.
> See Sprint 6 plan for the full type augmentation.

## shared/types/service.ts

```typescript
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
  user: ServiceProvider
  reviews_count: number
  average_rating: number
}

export interface ServiceListItem {
  id: number
  slug: string
  name: string
  price: number
  thumbnail: string
  user: { name: string; avatar: string | null }
  reviews_count: number
  average_rating: number
}

export interface ServiceFormData {
  name: string
  description: string
  category_id: number
  budget: number
  currency_id: number
  delivery_time: number
  extra_options: ExtraOptionInput[]
}

export interface ExtraOption {
  id: number
  name: string
  price: number
  description: string
}

export interface ExtraOptionInput {
  name: string
  price: number
  description: string
}

export interface ServiceMedia {
  images: MediaItem[]
  videos: MediaItem[]
  audio: MediaItem[]
  documents: MediaItem[]
}

export interface MediaItem {
  id: number
  url: string
  type: string
  is_main: boolean
}

export interface ServiceProvider {
  id: number
  name: string
  slug: string
  avatar: string | null
}
```

## shared/types/deal.ts

```typescript
export type DealStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'rejected'

export interface Deal {
  id: number
  status: DealStatus
  budget: number
  currency: Currency
  deliveries: DealDelivery[]
  service: ServiceListItem
  buyer: User
  seller: User
  created_at: string
  updated_at: string
}

export interface DealDelivery {
  id: number
  deal_id: number
  description: string
  files: MediaItem[]
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
```

## shared/types/api.ts

```typescript
export interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

export interface ApiError {
  error: true
  details: unknown
  status: number
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  params?: Record<string, string | number>
  showToast?: boolean
  headers?: Record<string, string>
}
```

## shared/types/chat.ts

```typescript
export interface Conversation {
  id: number
  user: User
  last_message: Message | null
  last_message_at: string
  unread_count: number
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  type: 'text' | 'image' | 'audio' | 'file' | 'deal' | 'rating'
  content: string
  media_url: string | null
  created_at: string
  is_read: boolean
}
```

## shared/types/user.ts

```typescript
export interface Currency {
  id: number
  name: string
  code: string
  symbol: string
  rate: number
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  parent_id: number | null
  children: Category[]
}

export interface AppNotification {
  id: number
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export interface Country {
  id: number
  name: string
  code: string
  phone_code: string
}
```

## Notes

- Types in `shared/types/` are auto-imported in both `app/` and `server/` by Nuxt 4
- `auth.d.ts` (`#auth-utils` augmentation) is deferred to Sprint 6 with nuxt-auth-utils
- These types will evolve as pages are migrated — start with core types, add as needed
