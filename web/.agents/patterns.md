# Frontend Architecture Guide

Guia genérico de patterns e arquitetura frontend. Use como referência para replicar a estrutura em qualquer feature.

---

## Stack

| Lib | Uso |
|-----|-----|
| Next.js 16 | App Router, SSR, RSC |
| React 19 | UI |
| TypeScript 5 | Tipagem |
| TanStack React Query 5 | Data fetching & cache |
| TanStack Form | Formulários (com Zod validator) |
| Zustand 5 | Estado global (modais, players, estados efêmeros) |
| nuqs | Estado na URL (pagination, search, filters) |
| Axios | HTTP client (client-side) |
| Tailwind CSS v4 | Estilos |
| shadcn/ui + Radix UI | Componentes base |
| better-auth | Autenticação |
| Zod 4 | Validação |
| Sonner | Toasts |
| Lucide React | Ícones |
| next-intl | Internacionalização (i18n) com URL prefix |
| @t3-oss/env-nextjs | Validação de env vars |

---

## Estrutura de Pastas

```
src/
├── app/                          # App Router (pages, layouts)
│   ├── layout.tsx                # Root layout mínimo (sem <html>/<body>)
│   ├── [locale]/                 # Locale prefix (next-intl)
│   │   ├── layout.tsx            # Layout com NextIntlClientProvider
│   │   ├── (app)/                # Layout principal (nav, sidebar)
│   │   │   ├── layout.tsx
│   │   │   ├── (public)/         # Páginas públicas (sem auth)
│   │   │   │   └── {entity}/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── content.tsx
│   │   │   │       └── [slug]/
│   │   │   │           ├── page.tsx
│   │   │   │           └── content.tsx
│   │   │   └── (authenticate)/   # Páginas protegidas (com auth)
│   │   │       └── {feature}/
│   │   ├── (auth)/               # Auth standalone (login, sign-up)
│   │   └── (marketing)/          # Landing page
│
├── modules/                      # Feature modules
│   └── {feature}/
│       ├── model.ts              # Type alias
│       ├── queries/
│       │   ├── find-{entities}.ts          # Lista paginada (client)
│       │   ├── find-{entity}-by-id.ts      # Detalhe (client)
│       │   └── find-{entity}-by-id.server.ts  # Detalhe (server)
│       ├── mutations/
│       │   └── use-delete-{entity}.ts
│       └── schemas/
│           └── create-{entity}.schema.ts   # Zod schema para forms
│
├── components/                   # Componentes reutilizáveis
│   ├── ui/                       # shadcn/ui primitivos (button, card, dialog...)
│   ├── {component-name}/
│   │   └── index.tsx
│   └── ...
│
├── hooks/                        # Custom hooks
│   ├── use-modal.ts
│   ├── use-search.ts
│   ├── search-params.pagination.ts
│   ├── search-params.filters.ts
│   └── ...
│
├── stores/                       # Zustand stores
│   └── {feature}-store.ts
│
├── providers/                    # Context providers
│   ├── index.tsx                 # Composição de todos providers
│   ├── react-query/
│   └── theme/
│
├── service/                      # Camada HTTP
│   ├── api.ts                    # Axios client-side (interceptors)
│   └── apiServer.ts              # Fetch server-side (RSC)
│
├── lib/                          # Utilitários core
│   ├── auth-client.ts            # better-auth client
│   ├── auth-server.ts            # getServerSession()
│   ├── session.ts                # Cache de session
│   ├── utils.ts                  # cn() tailwind merge
│   ├── toast-helpers.tsx          # Toasts padronizados
│   └── axios-error.ts
│
├── helpers/                      # Tipos/interfaces base
│   ├── base-entity.ts            # IBaseEntity
│   └── paginated.ts              # Paginated.Response<T>, Paginated.Meta
│
├── types/                        # Tipos globais
│   ├── models.ts                 # Domain models com relations
│   ├── queryKeyProps.ts          # QueryKeyProps type
│   └── modal.ts
│
├── utils/                        # Funções utilitárias
│   ├── constants.ts
│   ├── pagination.ts
│   └── ...
│
├── styles/
│   └── globals.css               # Tailwind + CSS vars
│
└── env/
    └── index.ts                  # Validação de env vars (t3-oss)
```

---

## 1. Module Pattern

Cada feature tem seu próprio módulo com `model.ts`, `queries/`, `mutations/` e opcionalmente `schemas/`.

### model.ts — Tipo principal do módulo

```typescript
// src/modules/{feature}/model.ts
import type { {Entity}WithRelations } from '@/types/models'

export type {Entity} = {Entity}WithRelations
```

### queries/ — Hook de listagem paginada

```typescript
// src/modules/{feature}/queries/find-{entities}.ts
import { useQuery } from '@tanstack/react-query'
import type { Paginated } from '@/helpers/paginated'
import { api } from '@/service/api'
import type { UseQueryHookParams } from '@/types/queryKeyProps'
import { {Entity} } from '../model'

export type Find{Entities}Params = {
  pageIndex: number
  perPage: number
  search?: string
  // ...filtros específicos da entity
}

// Função pura de fetch (reutilizável)
export const find{Entities} = async (
  params: Find{Entities}Params,
): Promise<Paginated.Response<{Entity}>> => {
  const response = await api.get('/{entities}', { params })
  return response.data
}

// Hook React Query — sempre recebe um único objeto como parâmetro
export type UseFind{Entities}Params = UseQueryHookParams<Find{Entities}Params, Paginated.Response<{Entity}>>

export const useFind{Entities} = ({ params, options }: UseFind{Entities}Params) => {
  const queryKey = ['{entities}', params]
  const query = useQuery({
    queryKey,
    queryFn: () => find{Entities}(params),
    ...options,
  })
  return { ...query, queryKey }
}
```

### queries/ — Hook de detalhe

```typescript
// src/modules/{feature}/queries/find-{entity}-by-id.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/service/api'
import type { UseIdQueryHookParams } from '@/types/queryKeyProps'
import { {Entity} } from '../model'

export const find{Entity}ByIdOrSlug = async (idOrSlug: string): Promise<{Entity}> => {
  const response = await api.get(`/{entities}/${idOrSlug}`)
  return response.data
}

export type UseFind{Entity}ByIdOrSlugParams = UseIdQueryHookParams<{Entity}>

export const useFind{Entity}ByIdOrSlug = ({
  idOrSlug,
  options,
}: UseFind{Entity}ByIdOrSlugParams) => {
  const queryKey = ['{entities}', idOrSlug]
  const query = useQuery({
    queryKey,
    queryFn: () => find{Entity}ByIdOrSlug(idOrSlug),
    ...options,
  })
  return { ...query, queryKey }
}
```

### queries/ — Server-side fetch (para generateMetadata e RSC)

```typescript
// src/modules/{feature}/queries/find-{entity}-by-id.server.ts
import { getServerSession } from '@/lib/auth-server'
import { apiServer } from '@/service/apiServer'
import type { {Entity}WithRelations } from '@/types/models'

export const find{Entity}ByIdOrSlugServer = async (
  idOrSlug: string,
): Promise<{Entity}WithRelations | null> => {
  const session = await getServerSession()
  const token = session?.session.token
  const headers: HeadersInit = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return apiServer<{Entity}WithRelations>(`/{entities}/${idOrSlug}`, { headers })
}
```

### mutations/ — Mutation com invalidação de cache

```typescript
// src/modules/{feature}/mutations/use-delete-{entity}.ts
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { showEntityDeletedToast, showErrorToast } from '@/lib/toast-helpers'
import { api } from '@/service/api'

// Tipos de mutation sempre nomeados e exportados
export type Delete{Entity}Params = { id: string; name: string }

async function remove({ id }: Delete{Entity}Params): Promise<void> {
  await api.delete(`/{entities}/${id}`)
}

export type UseDelete{Entity}Params = {
  queryKeys?: QueryKey[]
}

export function useDelete{Entity}({ queryKeys }: UseDelete{Entity}Params = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: remove,
    onSuccess: (_, { name }) => {
      showEntityDeletedToast(name, '{Entity}')
      queryKeys?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey })
      })
    },
    onError: () => {
      showErrorToast('Error deleting {entity}')
    },
  })
}
```

### Convenções de tipos para hooks

| Tipo | Naming | Exemplo |
|------|--------|---------|
| Params do hook (query) | `Use{HookName}Params` | `UseFindTracksParams` |
| Params do hook (mutation) | `Use{HookName}Params` | `UseDeleteTrackParams` |
| Params do mutationFn | `{Action}Params` | `DeleteTrackParams`, `AddTrackToPlaylistParams` |
| Params de fetch | `Find{Entities}Params` | `FindTracksParams` |

**Regras:**
- Hooks sempre recebem **um único objeto** como parâmetro (nunca args posicionais)
- Tipos de params sempre **nomeados e exportados** (nunca inline)
- Usar os **generic base types** de `@/types/queryKeyProps` em vez de definir tipos manuais:
  - `UseQueryHookParams<TParams, TData>` — query com params (maioria dos hooks)
  - `UseIdQueryHookParams<TData>` — query por `idOrSlug`
  - `UseNoParamsQueryHookParams<TData>` — query sem params (só options)
  - `UseInfiniteQueryHookParams<TParams>` — infinite query (Omit pageIndex automático)
- Imports de tipos usam `import type` (e.g. `import type { UseQueryHookParams }`)
- Mutations com primitivos usam wrapper objeto: `mutate({ trackId })` (nunca `mutate(42)`)
- Queries sem params: default `= {}` no destructuring (e.g. `({ options }: UseFindPlaylistsParams = {})`)
- Infinite queries usam `UseInfiniteQueryHookParams` que aplica `Omit<TParams, 'pageIndex'>` automaticamente

---

## 2. Page Pattern

Toda page segue: **Server Component (`page.tsx`) + Client Component (`content.tsx`)**.

### page.tsx — Server Component (metadata + Suspense)

```typescript
// src/app/(app)/(public)/{entities}/page.tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Content } from './content'

export const metadata: Metadata = {
  title: '{Entities}',
  description: 'Browse all {entities}.',
}

export default function {Entities}Page() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  )
}
```

**Regras:**
- `page.tsx` é **sempre** Server Component
- Exporta `metadata` para SEO
- Wrapa `<Content />` em `<Suspense>` (necessário para `nuqs` e hooks de URL)
- Zero lógica, zero hooks

### content.tsx — Client Component (hooks + render)

```typescript
// src/app/(app)/(public)/{entities}/content.tsx
'use client'

import { usePaginationSearchParams } from '@/hooks/search-params.pagination'
import { useSearch } from '@/hooks/use-search'
import { useFind{Entities} } from '@/modules/{feature}/queries/find-{entities}'
import { PageContainer, PageHeader, PageTitle, PageDescription } from '@/components/layout/page-container'

export function Content() {
  const [pagination, setPagination] = usePaginationSearchParams({
    pageIndex: 0,
    perPage: 10,
  })
  const { searchResult } = useSearch()

  const { data, isLoading, queryKey } = useFind{Entities}({
    params: {
      pageIndex: pagination.pageIndex,
      perPage: pagination.perPage,
      search: searchResult || undefined,
    },
  })

  const items = data?.data || []
  const meta = data?.meta

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>{t('title')}</PageTitle>
          <PageDescription>{t('description')}</PageDescription>
        </div>
        {/* Ações opcionais (botão criar, etc.) */}
      </PageHeader>
      {/* Lista, loading, empty state, paginação */}
    </PageContainer>
  )
}
```

### Detail Page — com generateMetadata dinâmico

```typescript
// src/app/(app)/(public)/{entities}/[slug]/page.tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { find{Entity}ByIdOrSlugServer } from '@/modules/{feature}/queries/find-{entity}-by-id.server'
import { Content } from './content'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const item = await find{Entity}ByIdOrSlugServer(slug)
  if (!item) return { title: 'Not Found' }
  return {
    title: item.name,
    description: `Details for ${item.name}.`,
  }
}

export default async function DetailPage({ params }: PageProps) {
  const { slug } = await params
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Content slug={slug} />
    </Suspense>
  )
}
```

### _components/ — Componentes privados da rota

```
app/(app)/(public)/{entities}/[slug]/
├── page.tsx
├── content.tsx
└── _components/
    ├── {entity}-header.tsx
    └── {entity}-details.tsx
```

> `_components/` = privado da rota, não importado de fora.

---

## 3. Form Pattern (TanStack Form + Zod)

### Schema (Zod)

```typescript
// src/modules/{feature}/schemas/create-{entity}.schema.ts
import { z } from 'zod'

export const create{Entity}Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email'),
  description: z.string().optional(),
})

export type Create{Entity}Input = z.infer<typeof create{Entity}Schema>
```

### Form Component (TanStack Form + zodValidator)

```typescript
// src/app/(app)/(authenticate)/{feature}/create/content.tsx
'use client'

import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/form/form-field'
import { create{Entity}Schema } from '@/modules/{feature}/schemas/create-{entity}.schema'
import { useCreate{Entity} } from '@/modules/{feature}/mutations/use-create-{entity}'

export function Content() {
  const { mutate: create{Entity}, isPending } = useCreate{Entity}()

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      description: '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: create{Entity}Schema,
    },
    onSubmit: async ({ value }) => {
      create{Entity}(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="name"
        children={(field) => (
          <FormField
            label="Name"
            htmlFor={field.name}
            errors={field.state.meta.errors.map((e) => e?.message).filter(Boolean) as string[]}
          >
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </FormField>
        )}
      />

      <form.Field
        name="email"
        children={(field) => (
          <FormField
            label="Email"
            htmlFor={field.name}
            errors={field.state.meta.errors.map((e) => e?.message).filter(Boolean) as string[]}
          >
            <Input
              id={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </FormField>
        )}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting || isPending}>
            {isPending ? 'Creating...' : 'Create'}
          </Button>
        )}
      />
    </form>
  )
}
```

**Regras do Form Pattern:**
- Schema Zod separado em `modules/{feature}/schemas/`
- `validatorAdapter: zodValidator()` + `validators.onSubmit` para validação
- `form.Field` renderiza cada campo com acesso a `field.state.meta.errors`
- `form.Subscribe` para observar `canSubmit` / `isSubmitting`
- Mutation separada em `modules/{feature}/mutations/`

---

## 4. Component Composition Patterns

### Children Pattern (wrapper genérico)

```typescript
interface CardWrapperProps {
  children: React.ReactNode
  className?: string
}

export function CardWrapper({ children, className }: CardWrapperProps) {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      {children}
    </div>
  )
}
```

### Slot Pattern (áreas nomeadas)

```typescript
interface PageLayoutProps {
  header: React.ReactNode
  content: React.ReactNode
  sidebar?: React.ReactNode
  footer?: React.ReactNode
}

export function PageLayout({ header, content, sidebar, footer }: PageLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>{header}</div>
      <div className="flex gap-8">
        <div className="flex-1">{content}</div>
        {sidebar && <aside className="w-80">{sidebar}</aside>}
      </div>
      {footer && <div>{footer}</div>}
    </div>
  )
}

// Uso:
// <PageLayout
//   header={<PageHeader title="Items" />}
//   content={<ItemList items={items} />}
//   sidebar={<Filters />}
// />
```

### Compound Components (componentes que compartilham contexto)

```typescript
import { createContext, useContext, type PropsWithChildren } from 'react'

// Context interno (não exportado)
const DataTableContext = createContext<{ isEmpty: boolean } | null>(null)
function useDataTableContext() {
  const ctx = useContext(DataTableContext)
  if (!ctx) throw new Error('Must be used inside DataTable')
  return ctx
}

// Root
export function DataTable({ children, data }: PropsWithChildren<{ data: unknown[] }>) {
  return (
    <DataTableContext value={{ isEmpty: data.length === 0 }}>
      <div className="space-y-4">{children}</div>
    </DataTableContext>
  )
}

// Sub-components
DataTable.Header = function Header({ children }: PropsWithChildren) {
  return <div className="flex items-center justify-between">{children}</div>
}

DataTable.Body = function Body({ children }: PropsWithChildren) {
  const { isEmpty } = useDataTableContext()
  if (isEmpty) return <EmptyState />
  return <div>{children}</div>
}

DataTable.Pagination = function Pagination(props: PaginationProps) {
  return <PaginationComponent {...props} />
}

// Uso:
// <DataTable data={items}>
//   <DataTable.Header>...</DataTable.Header>
//   <DataTable.Body>...</DataTable.Body>
//   <DataTable.Pagination meta={meta} />
// </DataTable>
```

### Props explícitas, sem context abuse

Componentes recebem tudo via props. Sem React Context desnecessário.

```typescript
interface EntityCardProps {
  title: string
  description: string
  items: Item[]
  isLoading: boolean
  emptyStateMessage?: string
  meta?: Paginated.Meta
  onPaginationChange?: (params: { pageIndex?: number; perPage?: number }) => void
  queryKeys?: QueryKey[]
}
```

---

## 5. Hooks

### use-modal — Genérico para qualquer modal/dialog

```typescript
// src/hooks/use-modal.ts
import { useState } from 'react'

export interface ModalHookData<T> {
  isOpen: boolean
  target: T | null
  actions: {
    open: (data?: T) => void
    close: () => void
    toggle: () => void
  }
}

export function useModal<T>(): ModalHookData<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [target, setTarget] = useState<T | null>(null)

  const actions = {
    close: () => { setTarget(null); setIsOpen(false) },
    open: (data?: T) => { if (data) setTarget(data); setIsOpen(true) },
    toggle: () => setIsOpen((s) => !s),
  }

  return { isOpen, actions, target }
}

// Uso:
// const deleteModal = useModal<Item>()
// deleteModal.actions.open(item)
// deleteModal.target  → item selecionado
// deleteModal.actions.close()
```

### search-params.pagination — Estado de paginação na URL

```typescript
// src/hooks/search-params.pagination.ts
import { parseAsIndex, parseAsInteger, useQueryStates } from 'nuqs'
import { useMemo } from 'react'

export function usePaginationSearchParams({
  pageIndex,
  perPage,
}: {
  pageIndex: number
  perPage: number
}) {
  const paginationParsers = useMemo(
    () => ({
      pageIndex: parseAsIndex.withDefault(pageIndex),
      perPage: parseAsInteger.withDefault(perPage),
    }),
    [pageIndex, perPage],
  )

  return useQueryStates(paginationParsers, {
    urlKeys: { pageIndex: 'page', perPage: 'perPage' },
  })
}
```

### use-search — Busca com debounce na URL

```typescript
// src/hooks/use-search.ts
'use client'
import { useSearchParams } from 'next/navigation'
import { debounce, useQueryState } from 'nuqs'

export function useSearch() {
  const searchParams = useSearchParams()
  const searchResult = searchParams.get('search')
  const [searchValue, setSearchValue] = useQueryState('search', {
    limitUrlUpdates: debounce(400),
  })

  return { searchValue, setSearchValue, searchResult }
}

// searchValue → valor do input (atualiza imediato)
// searchResult → valor na URL (debounced, usa esse pro fetch)
```

---

## 6. State Management

> **Regra:** Server state = React Query. Client state global = Zustand. URL state = nuqs.

### React Query — Server state

- Toda query retorna `{ ...query, queryKey }` para facilitar invalidação
- Mutations recebem `queryKeys` via props e invalidam no `onSuccess`

### Zustand — Estado global efêmero

Zustand **só** para estado que não faz sentido na URL (player de mídia, modais globais, estado transiente).

```typescript
// src/stores/{feature}-store.ts
import { create } from 'zustand'

interface {Feature}State {
  isOpen: boolean
  data: SomeData | null
  open: (data: SomeData) => void
  close: () => void
}

export const use{Feature}Store = create<{Feature}State>((set) => ({
  isOpen: false,
  data: null,
  open: (data) => set({ isOpen: true, data }),
  close: () => set({ isOpen: false, data: null }),
}))
```

### nuqs — URL state

Paginação, busca, filtros — tudo na URL para ser shareable e bookmarkable.

---

## 7. Service Layer

### api.ts — Client-side (Axios com interceptors)

```typescript
// src/service/api.ts
import axios, { AxiosError } from 'axios'
import { env } from '@/env'
import { authClient } from '@/lib/auth-client'
import { clearSessionCache, getSessionToken } from '@/lib/session'

export const baseURL = env.NEXT_PUBLIC_API_URL

export const api = axios.create({
  baseURL,
  paramsSerializer: { indexes: null }, // arrays: ?genres=1&genres=2
})

// Interceptor REQUEST: injeta token automaticamente
api.interceptors.request.use(async (config) => {
  const token = await getSessionToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor RESPONSE: 401 → logout e redirect
api.interceptors.response.use(
  (response) => response,
  async function (error: AxiosError) {
    if (error?.response?.status === 401) {
      clearSessionCache()
      await authClient.signOut()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
```

### apiServer.ts — Server-side (Fetch puro para RSC)

```typescript
// src/service/apiServer.ts
export async function apiServer<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${input}`, init)
  if (!data.ok) return null
  return (await data.json()) as T
}
```

---

## 8. Tipos Base

### IBaseEntity

```typescript
// src/helpers/base-entity.ts
export interface IBaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date | null
}
```

### Paginated

```typescript
// src/helpers/paginated.ts
export namespace Paginated {
  export type Meta = {
    pageIndex: number
    perPage: number
    total: number
    totalPages: number
  }

  export type Params = {
    pageIndex?: number
    perPage?: number
    search?: string | null
    sort?: string[]
    filters?: string[]
  }

  export type Response<T> = {
    data: T[]
    meta: Meta
  }
}
```

### QueryKeyProps & Generic Hook Types

```typescript
// src/types/queryKeyProps.ts
import { UseQueryOptions } from '@tanstack/react-query'

export type QueryKeyProps<TData = unknown, TError = Error> = Partial<
  Omit<
    UseQueryOptions<TData, TError, TData, readonly unknown[]>,
    'queryKey' | 'queryFn'
  >
>

// Query com params (80% dos hooks)
export type UseQueryHookParams<TParams, TData, TError = Error> = {
  params: TParams
  options?: QueryKeyProps<TData, TError>
}

// Query por ID/slug
export type UseIdQueryHookParams<TData, TError = Error> = {
  idOrSlug: string
  options?: QueryKeyProps<TData, TError>
}

// Query sem params (só options)
export type UseNoParamsQueryHookParams<TData, TError = Error> = {
  options?: QueryKeyProps<TData, TError>
}

// Infinite query (Omit pageIndex, options simplificado)
export type UseInfiniteQueryHookParams<TParams, TKey extends keyof TParams = 'pageIndex' & keyof TParams> = {
  params: Omit<TParams, TKey>
  options?: { enabled?: boolean }
}
```

---

## 9. Providers

```typescript
// src/providers/index.tsx
'use client'

import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { type PropsWithChildren } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ReactQueryProvider } from './react-query'
import { ThemeProvider } from './theme'

export function Providers({ children }: PropsWithChildren) {
  return (
    <NuqsAdapter>
      <ReactQueryProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </ReactQueryProvider>
    </NuqsAdapter>
  )
}
```

---

## 10. Layouts & Route Groups

### Root Layout

```typescript
// src/app/layout.tsx
import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'App', template: '%s | App' },
  description: 'App description.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Route Groups

| Group | Uso |
|-------|-----|
| `(app)` | Layout com navegação (nav, sidebar) |
| `(app)/(public)` | Páginas sem auth |
| `(app)/(authenticate)` | Páginas com auth required |
| `(auth)` | Layout limpo para login, sign-up, etc. |
| `(landing-page)` | Landing page |

---

## 11. Auth (better-auth)

### Client-side

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'
import { env } from '@/env'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
})
```

### Server-side

```typescript
// src/lib/auth-server.ts
import { headers } from 'next/headers'
import { authClient } from './auth-client'

export async function getServerSession() {
  const { data: session } = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  })
  return session
}
```

### Session Cache (client-side)

```typescript
// src/lib/session.ts
import { authClient, type SessionData } from './auth-client'

let sessionPromise: Promise<SessionData | null> | null = null
let sessionExpiresAt: number = 0
const CACHE_DURATION = 1000 * 60 * 5  // 5 minutos

export async function getSession(): Promise<SessionData | null> {
  const now = Date.now()
  if (sessionPromise && sessionExpiresAt > now) {
    return sessionPromise
  }
  sessionPromise = authClient.getSession().then(({ data }) => data)
  sessionExpiresAt = now + CACHE_DURATION
  return sessionPromise
}

export function clearSessionCache() {
  sessionPromise = null
  sessionExpiresAt = 0
}

export async function getSessionToken(): Promise<string | null> {
  const session = await getSession()
  return session?.session?.token ?? null
}
```

---

## 12. Utils & Helpers

### cn() — Tailwind class merge

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Toast helpers centralizados

```typescript
// src/lib/toast-helpers.tsx
import { toast } from 'sonner'

export function showErrorToast(message: string) {
  toast.error(message)
}

export function showEntityDeletedToast(name: string, entity: string) {
  toast.success(`${entity} "${name}" deleted successfully`)
}

export function showSuccessToast(message: string) {
  toast.success(message)
}
```

### Env validation

```typescript
// src/env/index.ts
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
})
```

---

## 13. Internationalization (next-intl)

O projeto usa `next-intl` com URL prefix (`/pt-BR/...`, `/en/...`, `/es/...`). Locale default: `pt-BR`. Locales suportados: `pt-BR`, `en`, `es`.

### Arquivos de configuração

| Arquivo | Função |
|---------|--------|
| `src/i18n/config.ts` | Constantes de locale (`locales`, `defaultLocale`) |
| `src/i18n/navigation.ts` | `Link`, `useRouter`, `usePathname`, `redirect` locale-aware |
| `src/i18n/request.ts` | Config server-side (carrega JSON de traduções) |
| `messages/pt-BR.json` | Traduções em português |
| `messages/en.json` | Traduções em inglês |
| `messages/es.json` | Traduções em espanhol |

### Imports — NUNCA use `next/link` ou `next/navigation`

```typescript
// ❌ ERRADO
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

// ✅ CORRETO
import { Link, useRouter, usePathname } from '@/i18n/navigation'

// ⚠️ EXCEÇÃO: useSearchParams continua de next/navigation
import { useSearchParams } from 'next/navigation'
```

### Client Components — useTranslations()

```typescript
'use client'
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('namespace')
  return <h1>{t('key')}</h1>
}

// Com interpolação:
t('greeting', { name: 'João' })  // "Olá, {name}" → "Olá, João"
```

### Server Components — getTranslations()

```typescript
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('metadata')
  return { title: t('title') }
}
```

### Estrutura de rotas

Todas as rotas ficam sob `src/app/[locale]/`:
```
src/app/
├── layout.tsx              ← Minimal (sem <html>/<body>)
├── [locale]/
│   ├── layout.tsx          ← Root layout com NextIntlClientProvider
│   ├── (app)/
│   ├── (auth)/
│   └── (marketing)/
```

### Regras

1. **Toda string visível ao usuário** deve vir dos arquivos de tradução
2. **Hrefs não mudam** — continue usando `/home`, `/tracks/123`. O `Link` do next-intl adiciona o prefix automaticamente
3. **Arrays estáticos** (como NAV_LINKS) devem ser computados dentro do componente com `t()`, não como constantes de módulo
4. **Toast messages** — o caller traduz, o helper (`showSuccessToast`, `showErrorToast`) recebe strings já traduzidas
5. **Language switcher** — componente `LanguageSwitcher` no TopNav

---

## 14. Dialog Pattern (Radix Dialog)

Ao criar dialogs que contenham componentes Radix portaled (Select, Combobox, etc.), usar `Dialog` do Radix com `modal={false}` para evitar conflitos de z-index e focus trap.

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

<Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }} modal={false}>
  <DialogContent className="max-w-[420px]">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>
    <div>
      {/* content */}
    </div>
  </DialogContent>
</Dialog>
```

**Regras:**
- Sempre usar o Radix `Dialog` de `@/components/ui/dialog`
- `modal={false}` quando o dialog contém Select, Combobox ou outros componentes portaled
- Estilizar via className no `DialogContent` conforme design system do projeto

---

## 15. Drag & Drop (Sortable Lists)

Para listas reordenáveis, usar `@dnd-kit`:

```typescript
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
```

**Pattern:**
- Estado local sincronizado com props (só atualiza quando itens são adicionados/removidos, não no reorder)
- `DragOverlay` para feedback visual durante arraste
- Callback `onReorder` emite array de IDs na nova ordem
- Cada item sortable usa `useSortable` hook com drag handle dedicado

---

## 16. Quota/Limit Checks em Dialogs

Quando uma ação depende de quota/créditos, o dialog deve:

1. Buscar quota via query dedicada (ex: `useFindDownloadQuota`)
2. Calcular custo da operação
3. Mostrar warning se quota insuficiente (banner com `AlertTriangle`)
4. Mostrar info de remaining quando há quota suficiente
5. Desabilitar botão de ação quando quota insuficiente

```typescript
const { data: quota } = useFindDownloadQuota({ enabled: open })
const hasActivePlan = quota?.active === true
const isQuotaInsufficient = hasActivePlan && remaining < cost
```

---

## 17. Código Limpo em JSX

**Sem comentários JSX** — nunca usar `{/* ... */}` nos arquivos `.tsx`. O código deve ser autoexplicativo. Se precisar de clareza, use nomes descritivos de variáveis e componentes.

---

## Resumo dos Patterns

| Pattern | Descrição |
|---------|-----------|
| **Module = model + queries + mutations + schemas** | Cada feature isolada |
| **page.tsx = Server, content.tsx = Client** | Separação clara de SSR e interatividade |
| **queryKey retornado pelo hook** | Facilita invalidação de cache |
| **Mutations recebem queryKeys** | Invalidam as queries corretas no onSuccess |
| **TanStack Form + Zod + zodValidator** | Forms tipados com validação declarativa |
| **Estado na URL (nuqs)** | Paginação, busca e filtros persistem na URL |
| **Zustand só para estado global efêmero** | Modais globais, player, estados que não cabem na URL |
| **Composition: children, slots, compound** | Componentes flexíveis e reutilizáveis |
| **Props explícitas, sem context abuse** | Componentes recebem tudo via props |
| **Optimistic updates** | State local → mutation → rollback on error |
| **Server fetch com .server.ts** | Para generateMetadata e Server Components |
| **Interceptors no Axios** | Token automático + logout em 401 |
| **Session cache** | Evita chamadas repetidas de auth |
| **Toast helpers centralizados** | Feedback consistente (sonner) |
| **Env validation (t3-oss)** | Falha no build se env var faltando |
| **Route groups** | `(public)`, `(authenticate)`, `(auth)` |
| **_components/ e _hooks/** | Componentes e hooks privados da rota |
| **next-intl i18n** | Todas as strings vêm de `messages/*.json`, imports de `@/i18n/navigation` |
| **Radix Dialog com modal={false}** | Para dialogs com Select/Combobox portaled |
| **@dnd-kit para sortable lists** | Drag & drop com DndContext + SortableContext |
| **Quota checks em dialogs** | Buscar quota, calcular custo, warning/disable |
| **Sem comentários JSX** | Nunca usar `{/* */}` nos .tsx |
| **Middleware route protection** | Rotas protegidas via cookie check no middleware |
| **OG images dinâmicas** | `next/og` ImageResponse em edge runtime |
| **JSON-LD structured data** | Schema.org para SEO em detail pages |
| **Player store (Zustand)** | Audio playback com queue, WaveSurfer |
| **Socket.IO para real-time** | Download progress via WebSocket |
| **Infinite scroll** | IntersectionObserver + useInfiniteQuery |
| **useRequireAuth** | Auth dialog inline para ações protegidas |
| **TrackProvider context** | Compound component para track state/actions |
| **Query cache config** | `UPSTREAM_CACHE_TIME` centralizado |

---

## 18. useEffect Policy — NO DIRECT useEffect

**Raw `useEffect` is banned** in `src/components/` and `src/app/` files. This is enforced by ESLint (`no-restricted-imports`) and a CI verification script.

### Replacement Hooks (from `src/hooks/`)

| Hook | Replaces | Signature |
|------|----------|-----------|
| `useMountEffect` | `useEffect(fn, [])` | `useMountEffect(fn)` |
| `useClickOutside` | Click-outside listener pattern | `useClickOutside(ref, handler, enabled?)` |
| `useOverlayLock` | Escape key + body overflow lock | `useOverlayLock(open, onClose)` |
| `useCanScroll` | ResizeObserver scroll check | `useCanScroll(ref)` → `boolean` |

### How to Handle useEffect

1. **Extract to a custom hook** — move the effect into `src/hooks/use-*.ts` (preferred)
2. **Use an existing hook** — check if one of the 4 hooks above covers your case
3. **Tag as audited** — if the effect is truly unique and can't be extracted:
   - Add `// effect:audited — <reason>` on the line immediately above the `useEffect(` call
   - Add `// eslint-disable-next-line no-restricted-imports -- effect:audited (see tags below)` on the import line

### Five Patterns That Replace useEffect

| Pattern | Instead of useEffect... | Use... |
|---------|------------------------|--------|
| Mount-only | `useEffect(fn, [])` | `useMountEffect(fn)` |
| Click outside | `useEffect` with mousedown listener | `useClickOutside(ref, handler)` |
| Overlay lock | `useEffect` with keydown + body overflow | `useOverlayLock(open, onClose)` |
| Scroll detection | `useEffect` with ResizeObserver | `useCanScroll(ref)` |
| Derived state | `useEffect` to sync state from props | Compute inline or `useMemo` |

### Exempt Directories

- `src/hooks/` — custom hooks can use `useEffect` freely
- `_hooks/` directories inside routes — route-scoped hooks are exempt

---

## 19. Middleware Route Protection

O middleware protege rotas que requerem autenticação e redireciona usuários logados de rotas de auth.

**Localização:** `src/middleware.ts`

```typescript
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'

const protectedRoutes = ['/likes', '/playlists', '/downloads']
const authRoutes = ['/login', '/sign-up']

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Strip locale prefix para match
  const pathnameWithoutLocale = pathname.replace(/^\/(pt-BR|en|es)/, '')

  const sessionCookie = request.cookies.get('better-auth.session_token')
    || request.cookies.get('auth_token')
  const isAuthenticated = !!sessionCookie

  // Rota protegida sem auth → redirect para login com callbackUrl
  if (protectedRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) && !isAuthenticated) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, request.url))
  }

  // Rota de auth com auth → redirect para home
  if (authRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // next-intl middleware para i18n
  return createMiddleware(routing)(request)
}
```

**Regras:**
- Verificação via cookies: `better-auth.session_token` ou `auth_token`
- Strip locale prefix antes de comparar rotas
- `callbackUrl` preserva destino original para redirect pós-login
- next-intl middleware encadeado para locale handling

---

## 20. Audio Player & WaveSurfer

### Player Store (Zustand)

**Localização:** `src/stores/player.store.ts`

```typescript
import { create } from 'zustand'

interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  volume: number
  isMuted: boolean

  play: (track: Track, queue?: Track[]) => void
  pause: () => void
  resume: () => void
  togglePlay: () => void
  stop: () => void
  next: () => void
  prev: () => void
  setVolume: (v: number) => void
  toggleMute: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // ...state e actions
}))
```

**Padrões:**
- Estado global do player via Zustand (não URL — é estado efêmero)
- `play()` define track e opcionalmente queue inteira
- `next()`/`prev()` navegam dentro da queue por `queueIndex`
- `stop()` reseta tudo para estado inicial

### WaveSurfer Integration

**Localização:** `src/components/player/player-waveform.tsx`

- WaveSurfer para renderizar waveform e controlar playback
- Refs para track loading state (`loadedTrackIdRef`, `isLoadingTrackRef`)
- Safe play com retry logic e AbortError handling
- Todos os `useEffect` tagados com `// effect:audited` (isentos por complexidade de sync com WaveSurfer)

---

## 21. Socket.IO (Real-time Progress)

Para funcionalidades que requerem progresso em tempo real (ex: downloads).

**Localização:** `src/modules/downloads/hooks/use-download-progress.ts`

```typescript
import { io } from 'socket.io-client'
import { env } from '@/env'

type DownloadStage = 'queued' | 'downloading' | 'converting' | 'zipping' | 'completed' | 'error'

interface ProgressEvent {
  stage: DownloadStage
  progress: number
  message: string
  downloadUrl?: string
  fileName?: string
  quota?: { credits: number }
}

export function useDownloadProgress(
  downloadId: string | null,
  onProgress: (event: ProgressEvent) => void,
) {
  // Conecta ao namespace /downloads via socket.io
  // Emite 'subscribe' com { downloadId }
  // Escuta 'progress' events
  // Cleanup: disconnect on unmount
}
```

**Padrões:**
- Socket.IO client conecta ao namespace `/downloads` do backend
- `subscribe` event para entrar na room do download
- Eventos de progresso com stages sequenciais
- Callback pattern com `useRef` para evitar stale closures
- `triggerFileDownload()` helper cria `<a>` element para download do arquivo final

---

## 22. Infinite Query Hooks

Para listas com scroll infinito (carrosséis, feeds):

```typescript
// src/modules/{feature}/queries/find-{entities}.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import type { UseInfiniteQueryHookParams } from '@/types/queryKeyProps'

export type UseFind{Entities}Params = UseInfiniteQueryHookParams<Find{Entities}Params>

export const useFind{Entities} = ({ params, options }: UseFind{Entities}Params) => {
  const queryKey = ['{entities}', 'infinite', params]
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => find{Entities}({ ...params, pageIndex: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pageIndex, totalPages } = lastPage.meta
      return pageIndex < totalPages ? pageIndex + 1 : undefined
    },
    ...options,
  })
  return { ...query, queryKey }
}

// Acesso aos dados:
const items = data?.pages.flatMap((page) => page.data) ?? []
```

### useInfiniteScroll Hook

**Localização:** `src/hooks/use-infinite-scroll.ts`

```typescript
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: InfiniteScrollParams) {
  // IntersectionObserver no sentinelRef
  // Dispara fetchNextPage quando sentinel entra no viewport
  // ResizeObserver para detectar se scroll é possível (canScroll)
  return { scrollRef, sentinelRef, canScroll }
}
```

**Regras:**
- `UseInfiniteQueryHookParams<TParams>` aplica `Omit<TParams, 'pageIndex'>` automaticamente
- `initialPageParam: 1` — paginação começa em 1
- `getNextPageParam` calcula próxima página a partir do `meta`
- Usar junto com `useInfiniteScroll` para carrosséis horizontais
- `sentinelRef` é um div invisível no final da lista

---

## 23. OG Image Generation

Geração dinâmica de Open Graph images via Route Handler.

**Localização:** `src/app/api/og/route.tsx`

```typescript
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') ?? 'DRPZONE'
  const subtitle = searchParams.get('subtitle')
  const image = searchParams.get('image')
  const type = searchParams.get('type')

  // Carrega Inter Bold font
  const fontData = await fetch(googleFontsUrl).then((r) => r.arrayBuffer())

  return new ImageResponse(
    (<div style={/* 1200x630 layout */}>
      {/* Image/artwork placeholder (300x300) */}
      {/* Title + subtitle */}
      {/* DRPZONE branding */}
    </div>),
    {
      width: 1200, height: 630,
      fonts: [{ name: 'Inter', data: fontData, weight: 700 }],
    },
  )
}
```

**Regras:**
- Edge runtime para performance
- Aceita query params: `title`, `subtitle`, `image`, `type`
- Resolução 1200x630 (padrão OG)
- Font Inter Bold via Google Fonts
- Estilizar conforme design system do projeto

---

## 24. JSON-LD Structured Data

Builders de Schema.org para SEO em páginas de detalhe.

**Localização:** `src/lib/json-ld.ts`

```typescript
export function buildTrackJsonLd(track: Track): MusicRecording { /* ... */ }
export function buildArtistJsonLd(artist: Artist): MusicGroup { /* ... */ }
export function buildReleaseJsonLd(release: Release): MusicAlbum { /* ... */ }
export function buildGenreJsonLd(genre: Genre): CollectionPage { /* ... */ }
export function buildWebsiteJsonLd(): WebSite { /* ... */ }
```

**Uso em detail pages:**

```typescript
// Em page.tsx (Server Component)
const jsonLd = buildTrackJsonLd(track)

return (
  <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <Suspense><Content slug={slug} /></Suspense>
  </>
)
```

**Regras:**
- JSON-LD injetado no `<head>` via `<script type="application/ld+json">`
- 1 builder por tipo de entidade
- Apenas em detail pages (não em listagens)

---

## 25. SEO Utils

**Localização:** `src/lib/seo-utils.ts`

```typescript
// Constrói URL da OG image com params
export function buildOgImageUrl(params: {
  title: string
  subtitle?: string
  image?: string
  type?: string
}): string {
  const url = new URL('/api/og', env.NEXT_PUBLIC_APP_URL)
  url.searchParams.set('title', params.title)
  // ...
  return url.toString()
}

// Constrói alternates i18n + canonical para metadata
export function buildAlternates(path: string) {
  return {
    canonical: `${env.NEXT_PUBLIC_APP_URL}/pt-BR${path}`,
    languages: {
      'pt-BR': `${env.NEXT_PUBLIC_APP_URL}/pt-BR${path}`,
      en: `${env.NEXT_PUBLIC_APP_URL}/en${path}`,
      es: `${env.NEXT_PUBLIC_APP_URL}/es${path}`,
    },
  }
}
```

**Uso em generateMetadata:**

```typescript
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const item = await findItemServer(slug)
  return {
    title: item.name,
    openGraph: {
      images: [buildOgImageUrl({ title: item.name, image: item.artwork })],
    },
    alternates: buildAlternates(`/tracks/${slug}`),
  }
}
```

---

## 26. Image & Track Utils

### Image Utils

**Localização:** `src/lib/image-utils.ts`

```typescript
const BEATPORT_CDN = 'https://geo-media.beatport.com/image'

export function resolveImageUrl(src?: string | null, size = '100x100'): string {
  if (!src) return '/placeholder.png'
  if (src.startsWith('http')) return src
  return `${BEATPORT_CDN}/${size}/${src}`
}
```

### Track Utils

**Localização:** `src/lib/track-utils.ts`

```typescript
export function getTrackArtwork(track: Track): string { /* resolve artwork via release ou track */ }
export function getTrackTitle(track: Track): string { /* title (mix name) */ }
export function getTrackArtistNames(track: Track): string { /* join artist names */ }
export function getTrackDuration(track: Track): number { /* ms → seconds */ }
export function getTrackLabel(track: Track): string { /* label from release or track */ }
export function getTrackReleaseDate(track: Track): string { /* formatted date */ }
export function extractArtistsFromTracks(tracks: Track[], limit?: number): Artist[] { /* dedup */ }
export function computeTopGenres(tracks: Track[]): Genre[] { /* aggregate by count */ }
```

**Regras:**
- `resolveImageUrl()` prefixa URLs não-HTTP com CDN Beatport
- Track utils são funções puras — sem side effects
- Usados em componentes de track, player, detail pages

---

## 27. Query Cache Config

**Localização:** `src/lib/query-config.ts`

```typescript
export const UPSTREAM_CACHE_TIME = 1000 * 60 * 60 * 24 // 24 hours
```

**Uso em queries:**

```typescript
export const useFind{Entities} = ({ params, options }: UseFind{Entities}Params) => {
  const query = useQuery({
    queryKey: ['{entities}', params],
    queryFn: () => find{Entities}(params),
    staleTime: UPSTREAM_CACHE_TIME,
    ...options,
  })
  return { ...query, queryKey }
}
```

**Regras:**
- Queries que buscam dados do upstream (Beatport) usam `UPSTREAM_CACHE_TIME`
- Queries locais (playlists, likes) usam staleTime default do React Query
- Constante centralizada — alterar em um lugar afeta todas as queries

---

## 28. useRequireAuth Hook

Hook para proteger ações que requerem autenticação, com dialog inline.

**Localização:** `src/hooks/use-require-auth.tsx`

```typescript
export function useRequireAuth() {
  const { isAuthenticated } = useAuth()
  const [showDialog, setShowDialog] = useState(false)
  const pendingCallback = useRef<(() => void) | null>(null)

  function requireAuth(callback: () => void) {
    if (isAuthenticated) {
      callback()
    } else {
      pendingCallback.current = callback
      setShowDialog(true)
    }
  }

  function AuthDialog() {
    return (
      <AuthRequiredDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onAuthenticated={() => {
          setShowDialog(false)
          pendingCallback.current?.()
        }}
      />
    )
  }

  return { requireAuth, AuthDialog, isAuthenticated }
}
```

**Uso:**

```typescript
const { requireAuth, AuthDialog } = useRequireAuth()

function handleLike() {
  requireAuth(() => toggleLike.mutate({ trackId }))
}

return (
  <>
    <button onClick={handleLike}>Like</button>
    <AuthDialog />
  </>
)
```

**Regras:**
- `requireAuth(callback)` — executa callback se autenticado, senão mostra dialog
- `<AuthDialog />` deve ser renderizado no JSX do componente
- Usado em ações como like, download, add to playlist

---

## 29. TrackProvider Context

Compound component pattern para estado e ações de cada track.

**Localização:** `src/components/track/track-provider.tsx`, `src/components/track/track-context.ts`

```typescript
interface TrackContextValue {
  state: {
    track: Track
    artwork: string
    title: string
    label: string
    duration: number
    isCurrentTrack: boolean
    isThisPlaying: boolean
    liked: boolean
    showDownloadDialog: boolean
    showPlaylistDialog: boolean
  }
  actions: {
    handlePlay: () => void
    handleLike: () => void
    handleDownload: () => void
    handleOpenPlaylist: () => void
    setShowDownloadDialog: (v: boolean) => void
    setShowPlaylistDialog: (v: boolean) => void
  }
  meta: {
    requireAuth: (cb: () => void) => void
    AuthDialog: () => JSX.Element
  }
}
```

**Regras:**
- `TrackProvider` wrapa cada track row/card
- Sub-components acessam context: `TrackPlayButton`, `TrackActions`, `TrackInfo`
- Integra com `useRequireAuth`, `usePlayerStore`, like mutation
- Pattern similar para `ReleaseProvider`, `MultiSelectProvider`

---

## 30. Route-Scoped _hooks/ Directories

Hooks privados que só são usados dentro de uma rota específica ficam em `_hooks/`.

```
app/[locale]/(app)/(public)/home/
├── page.tsx
├── content.tsx
├── _hooks/
│   ├── use-featured-artists.ts
│   └── use-home-data.ts
└── _components/
    └── home-carousel.tsx
```

**Regras:**
- `_hooks/` é **iseneto** da política de useEffect (pode usar `useEffect` livremente)
- Não importar hooks de `_hooks/` fora da rota que os contém
- Convenção: prefixo `use-` no nome do arquivo
- Padrões permitidos dentro de `_hooks/`:
  - localStorage caching com TTL e fingerprint
  - Effects complexos de data fetching/aggregation
  - Hooks que dependem de dados específicos da rota

### Exemplo: localStorage cache com TTL

```typescript
// src/app/[locale]/(app)/(public)/home/_hooks/use-featured-artists.ts
const CACHE_KEY = 'featured-artists'
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24h

function useFeaturedArtists(releases: Release[]) {
  const fingerprint = computeFingerprint(releases)
  const cached = readCache(CACHE_KEY, fingerprint)
  if (cached) return cached

  const artists = extractArtistsFromTracks(/* ... */)
  const shuffled = deterministicShuffle(artists)
  writeCache(CACHE_KEY, shuffled, fingerprint)
  return shuffled
}
```

---

## 31. Debounced Search Variants

Além do `useSearch()` genérico, existem variantes de busca para entidades específicas com params na URL:

**Localização:** `src/hooks/use-*.ts`

```typescript
// src/hooks/use-album-search.ts
export function useAlbumSearch() {
  const searchParams = useSearchParams()
  const searchResult = searchParams.get('albumSearch')
  const [searchValue, setSearchValue] = useQueryState('albumSearch', {
    limitUrlUpdates: debounce(400),
  })
  return { searchValue, setSearchValue, searchResult }
}

// Variantes similares:
// use-label-search.ts  → param 'labelSearch'
// use-genre-search.ts  → param 'genreSearch'
```

**Regras:**
- Cada search hook usa um query param diferente na URL
- Todas seguem o mesmo pattern: `searchValue` (imediato) + `searchResult` (debounced)
- Debounce de 400ms para evitar excesso de requests
- `searchResult` é o que vai para o fetch, `searchValue` é o que bind no input

---

## 32. Design System (Jira-Inspired)

### Design Tokens (`src/design-system/tokens.ts`)

Paletas OKLCH disponíveis: `blue`, `neutral`, `red`, `green`, `amber`, `teal`.

Também exporta: `spacing`, `borderRadius`, `shadows`, `typography` scales.

### Theme (`src/design-system/theme.ts`)

`lightTheme` e `darkTheme` mapeiam tokens → CSS vars.

Semântica das cores:
- `--primary` → blue (ações principais, focus rings, sidebar ativa)
- `--success` → green
- `--warning` → amber
- `--info` → blue
- `--destructive` → red

### CSS Variables (`src/styles/globals.css`)

Variáveis disponíveis: `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--warning`, `--info`, `--border`, `--input`, `--ring`, `--sidebar-*`.

Light e dark themes aplicados automaticamente.

### Componentes UI disponíveis

| Componente | Path | Quando usar |
|---|---|---|
| `Button` | `ui/button` | Variantes: default (blue), outline, secondary, ghost, **subtle**, destructive, link |
| `Badge` | `ui/badge` | Variantes: default, secondary, outline, ghost, **success**, **warning**, **info**, destructive |
| `Card` | `ui/card` | Container com `border border-border` (sem ring/shadow) |
| `Input` | `ui/input` | Focus ring azul automático |
| `Textarea` | `ui/textarea` | Mesmo styling do Input |
| `Checkbox` | `ui/checkbox` | Base UI, checked azul |
| `Switch` | `ui/switch` | Base UI, checked azul |
| `Spinner` | `ui/spinner` | Sizes: sm, md, lg. Cor: primary |
| `Breadcrumb` | `ui/breadcrumb` | Compound: Breadcrumb > BreadcrumbList > BreadcrumbItem > BreadcrumbLink/BreadcrumbPage |
| `EmptyState` | `ui/empty-state` | Props: icon, title, description, action? |
| `Table` | `ui/table` | Header com bg-muted/50, heads uppercase tracking-wider |

### Componentes de Layout

| Componente | Path | Quando usar |
|---|---|---|
| `PageContainer` | `layout/page-container` | Wrapper de página: max-w-6xl, space-y-6 |
| `PageHeader` | `layout/page-container` | Flex row between (título + ações) |
| `PageTitle` | `layout/page-container` | `text-2xl font-semibold` (NÃO text-3xl bold) |
| `PageDescription` | `layout/page-container` | `text-sm text-muted-foreground` |
| `Stack` | `layout/stack` | Flex col, gap variants: xs/sm/md/lg/xl |
| `Inline` | `layout/inline` | Flex row, gap + align + justify |
| `Grid` | `layout/grid` | CSS grid, columns: 1/2/3/4 responsivo |

### FormField (`components/form/form-field.tsx`)

Substitui `<div className="space-y-2">` + Label + Input + error `<p>`.

Props: `label`, `htmlFor`, `errors`, `description`, `children`.

**Uso obrigatório em novos forms.**

```tsx
<form.Field
  name="email"
  children={(field) => (
    <FormField
      label={t('email')}
      htmlFor={field.name}
      errors={field.state.meta.errors.map((e) => e?.message).filter(Boolean) as string[]}
    >
      <Input
        id={field.name}
        type="email"
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
    </FormField>
  )}
/>
```

### Regras do Design System

1. **Títulos de página**: `PageTitle` (`text-2xl font-semibold`), nunca `text-3xl font-bold`
2. **Containers de página**: sempre `PageContainer` + `PageHeader`
3. **Empty states**: usar `EmptyState` de `ui/empty-state`, nunca inline
4. **Campos de form**: usar `FormField` de `components/form/form-field`, nunca `div.space-y-2` manual
5. **Badges semânticos**: OWNER → `warning`, ADMIN → `info`, MEMBER → `secondary`
6. **Cards**: `border border-border` flat, sem ring/shadow
7. **Botões primários**: azuis (via CSS var), variant `subtle` para ações terciárias
8. **Focus rings**: azuis automáticos via `--ring`
9. **Sidebar ativa**: indicador azul à esquerda via pseudo-element

---

## Checklist para Nova Feature

1. Criar `src/modules/{feature}/model.ts` com type alias
2. Criar `src/modules/{feature}/queries/` com hooks de listagem e detalhe
3. Criar `src/modules/{feature}/mutations/` com hooks de mutação
4. Criar `src/modules/{feature}/schemas/` se tiver forms (Zod schemas)
5. Criar `page.tsx` (Server) + `content.tsx` (Client) na rota
6. Usar `_components/` e `_hooks/` para artefatos privados da rota
7. Componentizar peças reutilizáveis em `src/components/{nome}/index.tsx`
8. Hooks de URL state em `src/hooks/search-params.{feature}.ts`
9. Zustand store em `src/stores/{feature}-store.ts` (se necessário)
10. Adicionar metadata para SEO no `page.tsx` (usar `buildOgImageUrl` e `buildAlternates`)
11. Adicionar JSON-LD em detail pages (usar builders de `src/lib/json-ld.ts`)
12. Adicionar chaves i18n nos 3 arquivos de tradução (`en.json`, `pt-BR.json`, `es.json`)
13. Não usar `{/* */}` comentários nos arquivos `.tsx`
14. Usar `useRequireAuth` para ações que requerem auth
15. Se tiver infinite scroll, usar `useInfiniteQuery` + `useInfiniteScroll`
16. Se buscar dados upstream, usar `staleTime: UPSTREAM_CACHE_TIME`
17. Usar `PageContainer`/`PageHeader`/`PageTitle` para layout de página
18. Usar `FormField` para campos de formulário (nunca `div.space-y-2` manual)
19. Usar `EmptyState` para estados vazios (nunca inline)
