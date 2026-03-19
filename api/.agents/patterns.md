# Backend Architecture Guide

Guia genérico de patterns e arquitetura backend NestJS. Use como referência para replicar a estrutura em qualquer feature.

Segue princípios de **Clean Architecture** e **Monolito Modular**.

---

## Stack

| Tecnologia | Uso |
|---|---|
| NestJS 11 | Framework HTTP |
| TypeScript 5 | Linguagem |
| Drizzle ORM | ORM (schema-first, type-safe) |
| PostgreSQL (pg) | Banco de dados |
| better-auth | Autenticação (email/password, bearer, OTP) |
| @thallesp/nestjs-better-auth | Integração NestJS + better-auth |
| class-validator | Validação de DTOs |
| class-transformer | Transformação de respostas |
| @nestjs/swagger | Documentação da API |
| @nestjs/throttler | Rate limiting |
| envalid | Validação de env vars |
| Resend | Envio de emails (API) |
| @react-email/components | Templates de email (JSX) |

---

## Estrutura de Pastas

```
src/
├── main.ts                                    # Bootstrap: Swagger, CORS, ValidationPipe
├── app.module.ts                              # Root module (importa todos os modules)
│
├── config/
│   └── env.ts                                 # Validação de variáveis de ambiente (envalid)
│
├── infra/
│   └── database/
│       ├── schema.ts                          # Drizzle schema (todas as tabelas)
│       └── drizzle.ts                         # Drizzle client instance
│
├── providers/                                 # Providers compartilhados (cross-cutting)
│   ├── better-auth/
│   │   └── better-auth.instance.ts            # Instância do better-auth (plugins, config)
│   ├── resend/
│   │   ├── resend.ts                          # Instância Resend + funções de envio
│   │   └── emails/
│   │       ├── verification-email.tsx         # Template React Email (verificação)
│   │       └── password-reset-email.tsx       # Template React Email (reset senha OTP)
│   └── {provider-name}/
│       └── {provider-name}.service.ts         # Serviço do provider
│
└── modules/
    ├── common/                                # Módulo compartilhado
    │   ├── dto/
    │   │   ├── paginated-response.dto.ts      # PaginatedResponseDto<T> + PaginationMetaDto
    │   │   └── base-query.dto.ts              # Shared query params (pageIndex, perPage)
    │   ├── helpers/
    │   │   ├── pagination.ts                  # calculateSkip(), calculateTotalPages()
    │   │   └── mapping-utils.ts               # Utilitários de mapeamento
    │   ├── constants/
    │   ├── guards/
    │   └── decorators/
    │
    └── {feature}/                             # Feature module
        ├── {feature}.module.ts                # Module agregador
        ├── constants/
        │   ├── index.ts                       # Barrel export
        │   ├── routes.ts                      # {FEATURE}_BASE_ROUTE
        │   └── {feature}-repository-token.ts  # Symbol('{Feature}Repository')
        ├── dto/
        │   ├── {entity}.dto.ts                # Response DTO
        │   ├── {entity}-query.dto.ts          # Query params DTO
        │   └── {entity}-create.dto.ts         # Create/Update body DTO
        ├── repositories/
        │   ├── {entity}.repository.ts         # Interface
        │   └── index.ts
        ├── services/
        │   ├── find-all-{entities}/
        │   │   ├── find-all-{entities}.service.ts
        │   │   └── find-all-{entities}.service.spec.ts
        │   ├── find-{entity}-by-id/
        │   │   ├── find-{entity}-by-id.service.ts
        │   │   └── find-{entity}-by-id.service.spec.ts
        │   ├── create-{entity}/
        │   │   ├── create-{entity}.service.ts
        │   │   └── create-{entity}.service.spec.ts
        │   └── delete-{entity}/
        │       ├── delete-{entity}.service.ts
        │       └── delete-{entity}.service.spec.ts
        ├── providers/
        │   └── {feature}-repository.module.ts # DI: token → implementação
        └── infra/
            ├── drizzle/
            │   └── repositories/
            │       └── drizzle-{entity}.repository.ts   # Implementação com Drizzle
            └── http/
                ├── controllers/
                │   ├── find-all-{entities}.controller.ts
                │   ├── find-{entity}-by-id.controller.ts
                │   ├── create-{entity}.controller.ts
                │   └── delete-{entity}.controller.ts
                └── modules/
                    ├── find-all-{entities}.module.ts
                    ├── create-{entity}.module.ts
                    └── delete-{entity}.module.ts
```

---

## 1. Bootstrap (`main.ts`)

```typescript
import 'dotenv/config'
import { env } from '@config/env'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as bodyParser from 'body-parser'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  })

  // Raw body capture (necessário para webhooks/assinaturas)
  app.use(
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf
      },
    }),
  )

  app.setGlobalPrefix('api')

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  // CORS
  app.enableCors({
    origin: env.NEST_PUBLIC_APP_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  })

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  await app.listen(env.PORT)
}

void bootstrap()
```

**Regras:**
- Prefixo global `/api` — todas as rotas ficam em `/api/{feature}`
- Swagger em `/docs`
- `bodyParser: false` + raw body capture para suportar webhooks
- `whitelist: true` + `forbidNonWhitelisted: true` → rejeita props extras

---

## 2. Validação de Env Vars (`config/env.ts`)

```typescript
import { cleanEnv, num, str } from 'envalid'

const env = cleanEnv(process.env, {
  PORT: num({ desc: 'Application port', default: 3333 }),
  NEST_PUBLIC_APP_URL: str({ desc: 'Frontend app URL' }),
  NEST_PUBLIC_API_URL: str({ desc: 'API base URL' }),
  DATABASE_URL: str({ desc: 'PostgreSQL connection URL' }),
  BETTER_AUTH_SECRET: str({ desc: 'Better Auth secret key' }),
  RESEND_API_KEY: str({ desc: 'Resend API key for emails' }),
})

export { env }
```

---

## 3. Drizzle ORM

### Schema

```typescript
// src/infra/database/schema.ts
import { integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

// --- better-auth tables (gerenciadas pelo better-auth) ---

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

// --- Application tables ---

export const {entity} = pgTable('{entity}', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  // ... campos específicos da entity
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
})
```

### Drizzle Client

```typescript
// src/infra/database/drizzle.ts
import { env } from '@config/env'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

export const db = drizzle(env.DATABASE_URL, { schema })
```

### Drizzle Config

```typescript
// drizzle.config.ts
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/infra/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

**Scripts:**
```bash
npm run db:generate    # Gera migration a partir do schema
npm run db:migrate     # Executa migrations pendentes
```

> **Nota:** O projeto usa `npm`, não `pnpm`.

---

## 4. better-auth

### 4.1 — Instância (server)

```typescript
// src/providers/better-auth/better-auth.instance.ts
import { env } from '@config/env'
import { db } from '@infra/database/drizzle'
import {
  sendPasswordResetOTP,
  sendVerificationEmail,
} from '@providers/resend/resend'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer, emailOTP } from 'better-auth/plugins'

export const auth = betterAuth({
  baseURL: env.NEST_PUBLIC_API_URL,
  basePath: '/api/auth',
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url)
    },
  },
  trustedOrigins: [env.NEST_PUBLIC_APP_URL],
  advanced: {
    database: { generateId: () => crypto.randomUUID() },
  },
  plugins: [
    bearer(),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type === 'forget-password') {
          await sendPasswordResetOTP(email, otp)
        }
      },
    }),
  ],
})

export type Auth = typeof auth
```

### 4.2 — Registro no app.module.ts

```typescript
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { auth } from '@providers/better-auth/better-auth.instance'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule.forRoot({ auth }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    // ... feature modules
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

### 4.3 — Decorators de Auth

```typescript
// Do pacote @thallesp/nestjs-better-auth:

@AllowAnonymous()     // Rota pública (sem auth)
@Session() session    // Injeta sessão do usuário (session.user.id)
@ApiBearerAuth('bearer')  // Swagger: indica que precisa de token
```

**Regra:** Por padrão, todas as rotas exigem auth (via guard global do AuthModule). Use `@AllowAnonymous()` para rotas públicas.

### 4.4 — Drizzle Schema (tabelas do better-auth)

O better-auth gerencia 4 tabelas core. Defina-as no schema do Drizzle:

```typescript
// src/infra/database/schema.ts

// user — gerenciada pelo better-auth
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// session — gerenciada pelo better-auth
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

// account — gerenciada pelo better-auth (OAuth + credential)
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// verification — gerenciada pelo better-auth (email verification + OTP)
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

**Importante:** Após adicionar/alterar plugins no better-auth, re-gere as migrations com `pnpm db:generate`.

### 4.5 — Plugins usados

| Plugin | Import | Uso |
|--------|--------|-----|
| `bearer()` | `better-auth/plugins` | Permite autenticação via `Authorization: Bearer <token>` |
| `admin()` | `better-auth/plugins` | Gerencia roles (admin/member) e expõe endpoints de admin |
| `emailOTP()` | `better-auth/plugins` | Envia código OTP por email (usado para forgot-password) |

### 4.6 — Roles (ADMIN / MEMBER)

O sistema usa roles para controle de acesso. A coluna `role` na tabela `user` é gerenciada pelo plugin `admin()` do better-auth.

**Valores:** `'admin'` | `'member'` (default: `'member'`)

**Guard global:** `RolesGuard` registrado como `APP_GUARD` em `app.module.ts`. Sem `@Roles()`, qualquer role tem acesso.

**Uso em controllers:**
```typescript
import { Roles } from '@decorators/roles.decorator'

@Roles('admin')
@Controller('admin/users')
export class AdminUsersController { ... }
```

**Arquivos:**
- Decorator: `src/modules/common/decorators/roles.decorator.ts`
- Guard: `src/modules/common/guards/roles.guard.ts`
- Plugin: configurado em `src/providers/better-auth/better-auth.instance.ts`

**Regras de plugins:**
- Importar de `better-auth/plugins` (tree-shaking)
- Plugins client-side vão em `createAuthClient({ plugins: [...] })`
- Re-rodar `npx @better-auth/cli@latest generate` após adicionar plugins

### 4.7 — Fluxos de Auth

**Sign Up:**
1. Client chama `authClient.signUp.email({ name, email, password })`
2. better-auth cria user + account no DB
3. `sendVerificationEmail` é chamado automaticamente (`sendOnSignUp: true`)
4. User clica no link → email verificado

**Sign In:**
1. Client chama `authClient.signIn.email({ email, password })`
2. Se `requireEmailVerification: true` e email não verificado → erro + reenvia verificação
3. Se válido → retorna session com token

**Forgot Password (via emailOTP):**
1. Client chama `authClient.emailOtp.sendVerificationOtp({ email, type: 'forget-password' })`
2. `sendVerificationOTP` dispara email com código OTP
3. Client chama `authClient.emailOtp.resetPassword({ email, otp, newPassword })`
4. Senha atualizada

### 4.8 — Config Reference

| Opção | Descrição |
|-------|-----------|
| `baseURL` | URL base da API (ex: `http://localhost:3333/api`) |
| `basePath` | Path dos endpoints de auth (default: `/api/auth`) |
| `database` | Adapter do banco (drizzleAdapter, prismaAdapter, etc.) |
| `emailAndPassword.enabled` | Habilita auth por email/password |
| `emailAndPassword.requireEmailVerification` | Bloqueia login até verificar email |
| `emailVerification.sendOnSignUp` | Envia email de verificação no sign-up |
| `emailVerification.sendVerificationEmail` | Função que envia o email (recebe `{ user, url }`) |
| `trustedOrigins` | Lista de origens permitidas (CSRF whitelist) |
| `advanced.database.generateId` | Função custom de geração de ID |
| `plugins` | Array de plugins (bearer, emailOTP, twoFactor, etc.) |

---

## 5. Resend (Email Provider)

### 5.1 — Instância

```typescript
// src/providers/resend/resend.ts
import { env } from '@config/env'
import { Resend } from 'resend'
import { PasswordResetEmail } from './emails/password-reset-email'
import { VerificationEmail } from './emails/verification-email'

const resend = new Resend(env.RESEND_API_KEY)

const FROM = 'App <onboarding@resend.dev>'

export async function sendVerificationEmail(email: string, url: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verifique sua conta',
    react: VerificationEmail({ url }),
  })
}

export async function sendPasswordResetOTP(email: string, otp: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Código de recuperação',
    react: PasswordResetEmail({ otp }),
  })
}
```

### 5.2 — React Email Templates

Templates ficam em `src/providers/resend/emails/`. Usam `@react-email/components`.

```typescript
// src/providers/resend/emails/verification-email.tsx
import {
  Body, Button, Container, Head, Heading,
  Hr, Html, Link, Preview, Section, Text,
} from '@react-email/components'

interface VerificationEmailProps {
  url: string
}

export function VerificationEmail({ url }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verifique sua conta</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Verifique sua conta</Heading>
          <Text style={paragraph}>
            Clique no botão abaixo para verificar seu email.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>
              Verificar minha conta
            </Button>
          </Section>
          <Text style={paragraph}>
            Ou copie e cole este link no seu navegador:
          </Text>
          <Link href={url} style={link}>{url}</Link>
          <Hr style={hr} />
          <Text style={footer}>
            Se você não criou esta conta, ignore este email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Estilos inline (React Email não suporta CSS externo)
const main = {
  backgroundColor: '#fafaf7',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const container = { margin: '0 auto', padding: '40px 24px', maxWidth: '480px' }
const heading = { fontSize: '24px', fontWeight: 800 as const, color: '#000' }
const paragraph = { fontSize: '14px', lineHeight: '24px', color: '#3f3f46' }
const button = {
  backgroundColor: '#facc15',
  color: '#000',
  fontSize: '14px',
  fontWeight: 800 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  padding: '14px 32px',
  border: '3px solid #000',
  textDecoration: 'none',
}
const link = { fontSize: '12px', color: '#a1a1aa', wordBreak: 'break-all' as const }
const hr = { borderColor: '#e4e4e7', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#a1a1aa' }
```

```typescript
// src/providers/resend/emails/password-reset-email.tsx
import {
  Body, Container, Head, Heading,
  Hr, Html, Preview, Section, Text,
} from '@react-email/components'

interface PasswordResetEmailProps {
  otp: string
}

export function PasswordResetEmail({ otp }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Seu código de recuperação: {otp}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Redefinir senha</Heading>
          <Text style={paragraph}>
            Use o código abaixo para redefinir sua senha:
          </Text>
          <Section style={codeContainer}>
            <Text style={code}>{otp}</Text>
          </Section>
          <Text style={paragraph}>
            Este código expira em alguns minutos.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Se você não solicitou isso, ignore este email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#fafaf7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { margin: '0 auto', padding: '40px 24px', maxWidth: '480px' }
const heading = { fontSize: '24px', fontWeight: 800 as const, color: '#000' }
const paragraph = { fontSize: '14px', lineHeight: '24px', color: '#3f3f46' }
const codeContainer = { textAlign: 'center' as const, margin: '32px 0', padding: '24px', backgroundColor: '#000', border: '3px solid #000' }
const code = { fontSize: '36px', fontWeight: 900 as const, letterSpacing: '0.3em', color: '#facc15', margin: '0', fontFamily: 'monospace' }
const hr = { borderColor: '#e4e4e7', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#a1a1aa' }
```

### 5.3 — Estrutura de pastas

```
src/providers/resend/
├── resend.ts                              # Instância Resend + funções de envio
└── emails/
    ├── verification-email.tsx             # Template de verificação de email
    └── password-reset-email.tsx           # Template de reset de senha (OTP)
```

**Regras:**
- Cada tipo de email = 1 arquivo `.tsx` em `emails/`
- Estilos inline (React Email não suporta CSS externo)
- Funções de envio exportadas de `resend.ts` (chamadas pelo better-auth)
- `FROM` centralizado em `resend.ts`
- Dependências: `resend`, `@react-email/components`, `react`, `react-dom`

### 5.4 — Adicionando novo tipo de email

1. Criar `src/providers/resend/emails/{nome}-email.tsx` com template React Email
2. Exportar função de envio em `src/providers/resend/resend.ts`
3. Chamar a função no hook do better-auth ou no service da feature

---

## 6. App Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { auth } from '@providers/better-auth/better-auth.instance'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule.forRoot({ auth }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    // Feature modules
    {Feature}Module,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

---

## 7. Module Pattern Completo

### 7.1 — Constants

```typescript
// src/modules/{feature}/constants/routes.ts
export const {FEATURE}_BASE_ROUTE = '{entities}'

// src/modules/{feature}/constants/{feature}-repository-token.ts
export const {FEATURE}_REPOSITORY_TOKEN = Symbol('{Feature}Repository')

// src/modules/{feature}/constants/index.ts
export * from './routes'
export * from './{feature}-repository-token'
```

### 7.2 — DTOs

```typescript
// src/modules/{feature}/dto/{entity}.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class {Entity}Dto {
  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiPropertyOptional()
  description?: string

  @ApiProperty()
  createdAt: Date
}
```

```typescript
// src/modules/{feature}/dto/{entity}-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class {Entity}QueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  pageIndex: number = 1

  @ApiPropertyOptional({ default: 25 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  perPage: number = 25
}
```

```typescript
// src/modules/{feature}/dto/{entity}-create.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class Create{Entity}Dto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string
}
```

### 7.3 — Repository Interface

```typescript
// src/modules/{feature}/repositories/{entity}.repository.ts
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto'
import { {Entity}Dto } from '../dto/{entity}.dto'

export interface I{Feature}Repository {
  findAll(
    search: string | undefined,
    pageIndex: number,
    perPage: number,
  ): Promise<PaginatedResponseDto<{Entity}Dto>>

  findOne(id: string): Promise<{Entity}Dto | null>

  create(userId: string, data: {
    name: string
    description?: string
  }): Promise<{Entity}Dto>

  delete(id: string, userId: string): Promise<void>
}
```

### 7.4 — Drizzle Repository (implementação)

```typescript
// src/modules/{feature}/infra/drizzle/repositories/drizzle-{entity}.repository.ts
import { Injectable } from '@nestjs/common'
import { eq, and, ilike, count } from 'drizzle-orm'
import { db } from '@infra/database/drizzle'
import { {entity} } from '@infra/database/schema'
import { PaginatedResponseDto, PaginationMetaDto } from '@common/dto/paginated-response.dto'
import { calculateSkip, calculateTotalPages } from '@common/helpers/pagination'
import { {Entity}Dto } from '../../../dto/{entity}.dto'
import type { I{Feature}Repository } from '../../../repositories/{entity}.repository'

@Injectable()
export class Drizzle{Feature}Repository implements I{Feature}Repository {
  async findAll(
    search: string | undefined,
    pageIndex: number,
    perPage: number,
  ): Promise<PaginatedResponseDto<{Entity}Dto>> {
    const conditions = []
    if (search) {
      conditions.push(ilike({entity}.name, `%${search}%`))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from({entity})
        .where(where)
        .limit(perPage)
        .offset(calculateSkip(pageIndex, perPage))
        .orderBy({entity}.createdAt),
      db
        .select({ total: count() })
        .from({entity})
        .where(where),
    ])

    const meta = new PaginationMetaDto(
      total,
      pageIndex,
      perPage,
      calculateTotalPages(total, perPage),
    )

    return new PaginatedResponseDto(
      items.map((item) => this.toDto(item)),
      meta,
    )
  }

  async findOne(id: string): Promise<{Entity}Dto | null> {
    const [item] = await db
      .select()
      .from({entity})
      .where(eq({entity}.id, id))
      .limit(1)

    return item ? this.toDto(item) : null
  }

  async create(userId: string, data: {
    name: string
    description?: string
  }): Promise<{Entity}Dto> {
    const [created] = await db
      .insert({entity})
      .values({ ...data, userId })
      .returning()

    return this.toDto(created)
  }

  async delete(id: string, userId: string): Promise<void> {
    await db
      .delete({entity})
      .where(and(eq({entity}.id, id), eq({entity}.userId, userId)))
  }

  private toDto(row: typeof {entity}.$inferSelect): {Entity}Dto {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.createdAt,
    }
  }
}
```

### 7.5 — Repository Module (DI)

```typescript
// src/modules/{feature}/providers/{feature}-repository.module.ts
import { Module } from '@nestjs/common'
import { {FEATURE}_REPOSITORY_TOKEN } from '../constants'
import { Drizzle{Feature}Repository } from '../infra/drizzle/repositories/drizzle-{entity}.repository'

@Module({
  providers: [
    {
      provide: {FEATURE}_REPOSITORY_TOKEN,
      useClass: Drizzle{Feature}Repository,
    },
  ],
  exports: [{FEATURE}_REPOSITORY_TOKEN],
})
export class {Feature}RepositoryModule {}
```

### 7.6 — Service

```typescript
// src/modules/{feature}/services/find-all-{entities}/find-all-{entities}.service.ts
import { Inject, Injectable } from '@nestjs/common'
import { {FEATURE}_REPOSITORY_TOKEN } from '../../constants'
import type { I{Feature}Repository } from '../../repositories/{entity}.repository'

@Injectable()
export class FindAll{Entities}Service {
  constructor(
    @Inject({FEATURE}_REPOSITORY_TOKEN)
    private readonly repository: I{Feature}Repository,
  ) {}

  execute(search: string | undefined, pageIndex: number, perPage: number) {
    return this.repository.findAll(search, pageIndex, perPage)
  }
}
```

```typescript
// src/modules/{feature}/services/create-{entity}/create-{entity}.service.ts
import { Inject, Injectable } from '@nestjs/common'
import { {FEATURE}_REPOSITORY_TOKEN } from '../../constants'
import type { I{Feature}Repository } from '../../repositories/{entity}.repository'

@Injectable()
export class Create{Entity}Service {
  constructor(
    @Inject({FEATURE}_REPOSITORY_TOKEN)
    private readonly repository: I{Feature}Repository,
  ) {}

  execute(userId: string, data: { name: string; description?: string }) {
    return this.repository.create(userId, data)
  }
}
```

### 7.7 — Controller

```typescript
// src/modules/{feature}/infra/http/controllers/find-all-{entities}.controller.ts
import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { createPaginatedDto } from '@common/dto/paginated-response.dto'
import { {FEATURE}_BASE_ROUTE } from '../../../constants'
import { {Entity}Dto } from '../../../dto/{entity}.dto'
import { {Entity}QueryDto } from '../../../dto/{entity}-query.dto'
import { FindAll{Entities}Service } from '../../../services/find-all-{entities}/find-all-{entities}.service'

@ApiTags({FEATURE}_BASE_ROUTE)
@AllowAnonymous()
@Controller({FEATURE}_BASE_ROUTE)
export class FindAll{Entities}Controller {
  constructor(private readonly findAll: FindAll{Entities}Service) {}

  @Get()
  @ApiOkResponse({ type: createPaginatedDto({Entity}Dto) })
  handle(@Query() query: {Entity}QueryDto) {
    return this.findAll.execute(query.search, query.pageIndex, query.perPage)
  }
}
```

```typescript
// src/modules/{feature}/infra/http/controllers/create-{entity}.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Session } from '@thallesp/nestjs-better-auth'
import { {FEATURE}_BASE_ROUTE } from '../../../constants'
import { Create{Entity}Dto } from '../../../dto/{entity}-create.dto'
import { Create{Entity}Service } from '../../../services/create-{entity}/create-{entity}.service'

@ApiTags({FEATURE}_BASE_ROUTE)
@ApiBearerAuth('bearer')
@Controller({FEATURE}_BASE_ROUTE)
export class Create{Entity}Controller {
  constructor(private readonly createService: Create{Entity}Service) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create {entity}' })
  @ApiResponse({ status: 201, description: '{Entity} created successfully.' })
  handle(
    @Session() session: { user: { id: string } },
    @Body() dto: Create{Entity}Dto,
  ) {
    return this.createService.execute(session.user.id, dto)
  }
}
```

### 7.8 — Feature Module (HTTP sub-module)

```typescript
// src/modules/{feature}/infra/http/modules/find-all-{entities}.module.ts
import { Module } from '@nestjs/common'
import { {Feature}RepositoryModule } from '../../../providers/{feature}-repository.module'
import { FindAll{Entities}Service } from '../../../services/find-all-{entities}/find-all-{entities}.service'
import { FindAll{Entities}Controller } from '../controllers/find-all-{entities}.controller'

@Module({
  imports: [{Feature}RepositoryModule],
  providers: [FindAll{Entities}Service],
  controllers: [FindAll{Entities}Controller],
})
export class FindAll{Entities}Module {}
```

### 7.9 — Module Agregador

```typescript
// src/modules/{feature}/{feature}.module.ts
import { Module } from '@nestjs/common'
import { FindAll{Entities}Module } from './infra/http/modules/find-all-{entities}.module'
import { Create{Entity}Module } from './infra/http/modules/create-{entity}.module'
import { Delete{Entity}Module } from './infra/http/modules/delete-{entity}.module'

@Module({
  imports: [
    FindAll{Entities}Module,
    Create{Entity}Module,
    Delete{Entity}Module,
  ],
})
export class {Feature}Module {}
```

---

## 8. Paginated Response (DTO compartilhado)

```typescript
// src/modules/common/dto/paginated-response.dto.ts
import { ApiProperty } from '@nestjs/swagger'

export class PaginationMetaDto {
  @ApiProperty() total: number
  @ApiProperty() pageIndex: number
  @ApiProperty() perPage: number
  @ApiProperty() totalPages: number

  constructor(total: number, pageIndex: number, perPage: number, totalPages: number) {
    this.total = total
    this.pageIndex = pageIndex
    this.perPage = perPage
    this.totalPages = totalPages
  }
}

export class PaginatedResponseDto<T> {
  data: T[]
  meta: PaginationMetaDto

  constructor(data: T[], meta: PaginationMetaDto) {
    this.data = data
    this.meta = meta
  }
}

// Factory para Swagger type generation
export function createPaginatedDto<T>(itemType: new () => T) {
  class PaginatedDto extends PaginatedResponseDto<T> {
    @ApiProperty({ type: [itemType] })
    declare data: T[]

    @ApiProperty({ type: PaginationMetaDto })
    declare meta: PaginationMetaDto
  }
  return PaginatedDto
}
```

---

## 9. Pagination Helpers

```typescript
// src/modules/common/helpers/pagination.ts
export function calculateSkip(pageIndex: number, perPage: number): number {
  return (pageIndex - 1) * perPage
}

export function calculateTotalPages(total: number, perPage: number): number {
  return Math.ceil(total / perPage)
}

export function buildEmptyPaginatedResponse<T>(): PaginatedResponseDto<T> {
  return new PaginatedResponseDto([], new PaginationMetaDto(0, 1, 25, 0))
}
```

---

## 10. Fluxo de uma Request

```
1. HTTP Request chega
       │
2. ─── Global Prefix (/api) ──────────────────────────────────
       │
3. ─── ThrottlerGuard (60 req/60s default) ────────────────────
       │
4. ─── AuthModule Guard (better-auth) ────────────────────────
       │  Se @AllowAnonymous() → pula
       │  Senão → valida Bearer token via better-auth
       │  Injeta session (user.id) no request
       │
5. ─── ValidationPipe (global) ───────────────────────────────
       │  whitelist: true       → remove props extras
       │  forbidNonWhitelisted  → rejeita props desconhecidas
       │  transform: true       → converte para instância do DTO
       │
6. ─── Controller ────────────────────────────────────────────
       │  Recebe: @Body() dto, @Query() query, @Session() session
       │  Chama service.execute(...)
       │
7. ─── Service (Use Case) ────────────────────────────────────
       │  Recebe repositório via @Inject(TOKEN)
       │  Executa lógica de negócio
       │  Lança HttpException em caso de erro
       │
8. ─── Repository ────────────────────────────────────────────
       │  Drizzle ORM → PostgreSQL
       │
9. ─── Response JSON ─────────────────────────────────────────
```

---

## 11. Rate Limiting

```typescript
// Global: 60 req/60s (configurado no app.module.ts)

// Override por endpoint:
import { Throttle } from '@nestjs/throttler'

@Throttle({ default: { ttl: 60000, limit: 10 } })
@Post('toggle')
handle() { ... }
```

---

## 12. Path Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@modules/*":    ["src/modules/*"],
      "@providers/*":  ["src/providers/*"],
      "@common/*":     ["src/modules/common/*"],
      "@helpers/*":    ["src/modules/common/helpers/*"],
      "@decorators/*": ["src/modules/common/decorators/*"],
      "@guards/*":     ["src/modules/common/guards/*"],
      "@types/*":      ["src/modules/common/types/*"],
      "@infra/*":      ["src/infra/*"],
      "@config/*":     ["src/config/*"]
    }
  }
}
```

---

## Resumo dos Patterns

| Pattern | Descrição |
|---------|-----------|
| **1 feature = 1 module agregador** | Agrupa sub-modules de cada operação (CRUD) |
| **1 operação = controller + service + module** | Cada ação HTTP é um sub-module isolado |
| **Repository interface + Symbol token** | DI com inversão de dependência |
| **Drizzle Repository (implementação)** | Implementa interface, usa `db` diretamente |
| **DTOs com class-validator** | Validação declarativa + Swagger automático |
| **@AllowAnonymous()** | Rotas públicas (default = autenticado) |
| **@Session()** | Injeta sessão do usuário (better-auth) |
| **PaginatedResponseDto<T>** | Resposta paginada genérica |
| **better-auth + bearer plugin** | Auth gerenciada pelo better-auth, bearer token para API |
| **emailOTP plugin** | Forgot password via código OTP por email |
| **Resend + React Email** | Emails transacionais com templates JSX |
| **Drizzle schema inclui tabelas do better-auth** | user, session, account, verification |
| **envalid** | Falha no boot se env var faltando |
| **ThrottlerGuard global** | Rate limiting com override por rota |
| **Schema-first (Drizzle)** | Schema em TypeScript → gera migrations |
| **Global prefix /api** | Todas as rotas em `/api/{feature}` |
| **PATCH para reorder** | Reordenação de itens com array de IDs, retorna 204 |

---

## 13. Operações de Reordenação (PATCH)

Para endpoints que reordenam itens dentro de uma coleção (ex: tracks dentro de playlist):

### DTO

```typescript
// src/modules/{feature}/dto/reorder-{items}.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator'
import { Type } from 'class-transformer'

export class Reorder{Items}Dto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  {item}Ids: number[]
}
```

### Controller

```typescript
@Patch(':id/{items}/reorder')
@HttpCode(HttpStatus.NO_CONTENT)
@Throttle({ default: { ttl: 60000, limit: 30 } })
handle(
  @Session() session: { user: { id: string } },
  @Param('id') id: string,
  @Body() dto: Reorder{Items}Dto,
) {
  return this.service.execute(id, dto.{item}Ids, session.user.id)
}
```

**Regras:**
- Usar `PATCH` (não PUT) para operações de reordenação parcial
- Retornar `204 No Content`
- Rate limit mais restritivo (30 req/60s) — reorder pode ser chamado muitas vezes
- Validar que `{item}Ids` é array não-vazio de inteiros

---

## 14. Upstream Repository Pattern

Módulos que consomem dados de API externa (ex: Beatport) usam um repositório alternativo que implementa a **mesma interface** do Drizzle, mas faz fetch HTTP.

### Estrutura de pastas

```
modules/{feature}/
├── repositories/
│   └── {entity}.repository.ts          # Interface (mesma do Drizzle)
├── providers/
│   └── {feature}-repository.module.ts   # Token → Upstream ou Drizzle
└── infra/
    ├── drizzle/repositories/            # Implementação local (DB)
    └── upstream/repositories/           # Implementação externa (HTTP)
```

### Upstream Repository

```typescript
// src/modules/{feature}/infra/upstream/repositories/upstream-{entity}.repository.ts
import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { UpstreamAuthService } from '@providers/upstream-auth/upstream-auth.service'
import type { I{Feature}Repository } from '../../../repositories/{entity}.repository'

@Injectable()
export class Upstream{Feature}Repository implements I{Feature}Repository {
  constructor(
    private readonly httpService: HttpService,
    private readonly upstreamAuth: UpstreamAuthService,
  ) {}

  async findAll(/* params */): Promise<PaginatedResponseDto<{Entity}Dto>> {
    const token = await this.upstreamAuth.getAccessToken()
    const { data } = await this.httpService.axiosRef.get('/endpoint', {
      headers: { Authorization: `Bearer ${token}` },
      params: { /* ... */ },
    })
    return this.mapResponse(data)
  }
}
```

### Repository Module (alternando implementação)

```typescript
// Módulos com dados externos:
{ provide: {FEATURE}_REPOSITORY_TOKEN, useClass: Upstream{Feature}Repository }

// Módulos com dados locais:
{ provide: {FEATURE}_REPOSITORY_TOKEN, useClass: Drizzle{Feature}Repository }
```

**Regras:**
- A interface é a mesma — controller e service não sabem a origem dos dados
- Upstream repos mapeiam resposta da API externa para DTOs locais
- Erros de API externa devem ser tratados com graceful fallback (log + retorno vazio)

---

## 15. Upstream Auth Provider

Provider global para autenticação com APIs externas via OAuth2 PKCE.

**Localização:** `src/providers/upstream-auth/`

```typescript
@Global()
@Module({
  imports: [HttpModule],
  providers: [UpstreamAuthService],
  exports: [UpstreamAuthService],
})
export class UpstreamAuthModule {}
```

**Padrões:**
- `@Global()` — disponível em todos os módulos sem import
- `OnModuleInit` — carrega/renova credenciais automaticamente no boot
- File-based credential storage: lê/escreve em arquivo JSON local
- OAuth2 PKCE flow com code challenge/verifier
- Exponential backoff em falhas de auth (base 5s, max 5min)
- Token refresh automático — fallback para login completo se refresh falhar

---

## 16. Stripe Provider

**Localização:** `src/providers/stripe/stripe.ts`

```typescript
import { env } from '@config/env'
import Stripe from 'stripe'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY)

const CREDIT_PACKAGES = [
  { id: '10', credits: 10, amount: 1500, name: 'DRPZONE — 10 Credits' },
  { id: '25', credits: 25, amount: 3000, name: 'DRPZONE — 25 Credits' },
  { id: '50', credits: 50, amount: 5000, name: 'DRPZONE — 50 Credits' },
  { id: '100', credits: 100, amount: 7500, name: 'DRPZONE — 100 Credits' },
] as const

const resolvedPrices = new Map<string, string>()

export async function syncStripeProducts() { /* ... */ }
export function getStripePriceId(packageId: string): string { /* ... */ }
```

**Padrões:**
- Singleton Stripe client exportado
- `CREDIT_PACKAGES` define pacotes de créditos com preço em centavos (BRL)
- `syncStripeProducts()` chamado no bootstrap (`main.ts`) — cria/sincroniza produtos e preços no Stripe
- `resolvedPrices` Map cacheia price IDs por package ID
- `lookup_key` no formato `credits_{id}` para sync idempotente
- `getStripePriceId()` retorna price ID cacheado (throws se sync não executou)

---

## 17. Webhook Handling

Webhooks de serviços externos (Stripe, etc.) seguem um pattern específico:

```typescript
// src/modules/{feature}/infra/http/controllers/{provider}-webhook.controller.ts
interface RawBodyRequest extends Request {
  rawBody: Buffer
}

@ApiExcludeController()      // Oculta do Swagger
@AllowAnonymous()            // Webhook é público
@SkipThrottle()              // Sem rate limiting
@Controller(BASE_ROUTE)
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name)

  constructor(private readonly fulfillService: FulfillService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handle(@Req() req: RawBodyRequest) {
    const signature = req.headers['stripe-signature'] as string

    let event
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody, signature, env.STRIPE_WEBHOOK_SECRET,
      )
    } catch (err) {
      this.logger.warn(`Webhook signature verification failed: ${err}`)
      return { received: false }
    }

    if (event.type === 'checkout.session.completed') {
      await this.fulfillService.execute(session.id)
    }

    return { received: true }
  }
}
```

**Regras:**
- `@ApiExcludeController()` — webhooks não aparecem no Swagger
- `@AllowAnonymous()` — sem autenticação (verificação via signature)
- `@SkipThrottle()` — sem rate limiting para webhooks
- `RawBodyRequest` com `rawBody: Buffer` — necessário para verificação de assinatura
- Raw body capturado no `main.ts` via `bodyParser.json({ verify })` (já documentado na seção 1)
- Sempre retornar `{ received: true/false }` — nunca lançar exceção para o webhook caller
- Logger para falhas de verificação de assinatura

---

## 18. WebSocket Gateway (Real-time)

Para funcionalidades que requerem comunicação real-time (ex: progresso de download):

**Localização:** `src/modules/{feature}/infra/ws/`

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  namespace: '/{feature}',
  cors: {
    origin: env.NEST_PUBLIC_APP_URL,
    credentials: true,
  },
})
export class {Feature}ProgressGateway {
  @WebSocketServer()
  server: Server

  private lastEvents = new Map<string, ProgressEvent>()

  setEmitCallback() {
    return (id: string, event: ProgressEvent) => {
      this.lastEvents.set(id, event)
      this.server.to(id).emit('progress', event)
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { id: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.id)
    const lastEvent = this.lastEvents.get(data.id)
    if (lastEvent) {
      client.emit('progress', lastEvent)
    }
  }
}
```

**Padrões:**
- Namespace dedicado por feature (`/downloads`, etc.)
- CORS com mesma origem do frontend + credentials
- Room-based messaging — clients entram em rooms por ID
- `lastEvents` Map para replay do último evento para late joiners
- `setEmitCallback()` — callback fornecido ao service para emitir eventos
- Eventos de progresso com stages: `'queued'` → `'downloading'` → `'converting'` → `'zipping'` → `'completed'` | `'error'`

---

## 19. Database Transactions

Para operações que precisam de atomicidade (ex: créditos + registro de transação):

```typescript
import { db } from '@infra/database/drizzle'

await db.transaction(async (tx) => {
  // Todas as operações dentro da transaction usam `tx` em vez de `db`
  await tx.update(userTable).set({
    credits: sql`${userTable.credits} + ${amount}`,
  }).where(eq(userTable.id, userId))

  await tx.insert(creditTransactionTable).values({
    userId,
    amount,
    type: 'purchase',
    description: 'Credit purchase via Stripe',
  })
})
```

**Regras:**
- Usar `db.transaction()` quando múltiplas operações devem ser atômicas
- Dentro da transaction, usar o argumento `tx` (não `db` global)
- SQL expressions para operações de incremento: `sql\`${col} + ${val}\``
- Casos comuns: atualização de créditos + log, fulfillment de checkout + comissão

---

## 20. SafeAuthGuard

Guard customizado que estende o comportamento do AuthModule com tratamento gracioso de falhas.

**Localização:** `src/modules/common/guards/safe-auth.guard.ts`

```typescript
@Injectable()
export class SafeAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('PUBLIC', [...])
    const isOptional = this.reflector.getAllAndOverride<boolean>('OPTIONAL', [...])

    // Verifica cookie antes de chamar auth service
    const hasSessionCookie = cookieHeader.includes('better-auth.session_token')

    if (!hasSessionCookie) {
      request.session = null
      request.user = null
      if (isPublic || isOptional) return true
      throw new UnauthorizedException()
    }

    // Tenta validar session via better-auth
    try {
      const session = await auth.api.getSession({ headers })
      request.session = session
      request.user = session?.user ?? null
    } catch {
      request.session = null
      request.user = null
    }

    if (isPublic || isOptional) return true
    if (!request.session) throw new UnauthorizedException()
    return true
  }
}
```

**Regras:**
- Verifica cookie `better-auth.session_token` antes de chamar API de auth (evita chamadas desnecessárias)
- Usa Reflector para `'PUBLIC'` e `'OPTIONAL'` metadata
- Rotas públicas/opcionais sempre passam, mesmo com auth falhando
- `request.session` e `request.user` sempre definidos (null ou session válida)
- Registrado como `APP_GUARD` no `app.module.ts`

---

## 21. Better-Auth Database Hooks

Hooks que executam lógica customizada durante operações do better-auth.

**Localização:** `src/providers/better-auth/`

### assign-referral-code (user.create.after)

Gera código de referral único no signup:

```typescript
export async function assignReferralCode(userId: string) {
  const maxRetries = 3
  for (let i = 0; i < maxRetries; i++) {
    const code = crypto.randomBytes(6).toString('hex') // 12 chars
    try {
      await db.update(userTable).set({ referralCode: code }).where(eq(userTable.id, userId))
      return
    } catch (error: any) {
      if (error.code === '23505') continue // unique constraint violation
      throw error
    }
  }
}
```

### grant-signup-credits (user.create.after)

Concede créditos iniciais ao novo usuário:

```typescript
export async function grantSignupCredits(userId: string) {
  await db.transaction(async (tx) => {
    await tx.update(userTable).set({
      credits: sql`${userTable.credits} + ${INITIAL_CREDITS}`,
    }).where(eq(userTable.id, userId))

    await tx.insert(creditTransactionTable).values({
      userId, amount: INITIAL_CREDITS,
      type: 'signup_bonus', description: 'Welcome bonus credits',
    })
  })
}
```

### grant-referral-credits (user.update.after — email verified)

Concede créditos de referral quando email é verificado:

- **Affiliate referrer:** Apenas o usuário referido recebe `REFERRAL_CREDITS` (5)
- **Member referrer:** Ambos (referrer + referido) recebem 5 créditos cada
- Usa `UPDATE ... RETURNING` atômico para claim do referral pendente

**Configuração no better-auth:**

```typescript
databaseHooks: {
  user: {
    create: { after: async (user) => {
      await assignReferralCode(user.id)
      await grantSignupCredits(user.id)
    }},
    update: { after: async (_, after) => {
      if (after?.emailVerified) {
        await grantReferralCredits(after.id)
      }
    }},
  },
}
```

---

## 22. Email Localization

Templates de email suportam múltiplos idiomas:

```typescript
// src/providers/resend/resend.ts
function extractLocaleFromUrl(url: string): 'en' | 'pt-BR' {
  try {
    const parsed = new URL(url)
    const callbackUrl = parsed.searchParams.get('callbackURL') || ''
    if (callbackUrl.includes('/en/')) return 'en'
  } catch {}
  return 'pt-BR' // default
}

function getSubject(locale: 'en' | 'pt-BR', type: 'verification' | 'reset'): string {
  const subjects = {
    verification: { en: 'Verify your account', 'pt-BR': 'Verifique sua conta' },
    reset: { en: 'Recovery code', 'pt-BR': 'Código de recuperação' },
  }
  return subjects[type][locale]
}

const FROM = `App <noreply@${env.RESEND_FROM_DOMAIN}>`
```

**Regras:**
- Templates recebem `locale` como prop: `VerificationEmail({ url, locale })`
- `extractLocaleFromUrl()` detecta locale a partir da `callbackURL` no link de verificação
- `getSubject()` retorna assunto traduzido
- `FROM` usa `RESEND_FROM_DOMAIN` do env (default: `resend.dev`)

---

## 23. Credit System

Sistema de créditos com ledger de transações.

### Schema

```typescript
// Extensão na tabela user:
credits: integer('credits').notNull().default(0)

// Tabela de transações:
export const creditTransaction = pgTable('credit_transaction', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  amount: integer('amount').notNull(),
  type: text('type').notNull(),         // 'signup_bonus' | 'referral_bonus' | 'purchase' | 'download'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

### Constants

```typescript
// src/config/constants.ts
export const INITIAL_CREDITS = 5
export const REFERRAL_CREDITS = 5
```

**Regras:**
- Toda alteração de créditos cria um registro em `creditTransaction`
- Tipos: `'signup_bonus'`, `'referral_bonus'`, `'purchase'`, `'download'`
- Operações de crédito sempre dentro de transaction (credit update + log atômicos)
- Downloads deduzem créditos; re-download do mesmo track não deduz
- Admins podem baixar sem dedução de créditos

---

## 24. Affiliate Commission System

Sistema de comissões para afiliados.

### Schema

```typescript
export const affiliateCommission = pgTable('affiliate_commission', {
  id: uuid('id').defaultRandom().primaryKey(),
  affiliateId: text('affiliate_id').notNull().references(() => user.id),
  checkoutId: text('checkout_id').notNull(),
  amount: integer('amount').notNull(),          // em centavos
  paid: boolean('paid').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

### Cálculo de comissão (no fulfillment de checkout)

```typescript
const commission = Math.floor(amountTotal * commissionPercent / 100)

await db.insert(affiliateCommission).values({
  affiliateId: referrer.id,
  checkoutId,
  amount: commission,
}).onConflictDoNothing()  // previne duplicatas
```

**Regras:**
- Usuário com `role === 'affiliate'` e `commissionPercent` configurado
- Comissão gerada automaticamente no fulfillment do checkout
- `onConflictDoNothing()` para idempotência
- Admin endpoints para: listar afiliados, marcar comissão como paga, revogar, alterar percentual

---

## 25. Referral System

Sistema de indicação de novos usuários.

### Schema

```typescript
export const referral = pgTable('referral', {
  id: uuid('id').defaultRandom().primaryKey(),
  referrerId: text('referrer_id').notNull().references(() => user.id),
  referredId: text('referred_id').references(() => user.id),
  referredEmail: text('referred_email').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'completed'
  creditsGranted: boolean('credits_granted').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [unique().on(t.referrerId, t.referredId)])
```

**Fluxo:**
1. Usuário recebe `referralCode` no signup (via `assignReferralCode` hook)
2. Novo usuário se registra usando o código → `RegisterReferralService` cria referral com status `'pending'`
3. Quando email é verificado → `grantReferralCredits` transiciona para `'completed'` e concede créditos
4. Unique constraint em `(referrerId, referredId)` previne duplicatas

---

## 26. Download Pipeline

Processamento de downloads com progresso real-time.

### Stages de progresso

```
'queued' → 'downloading' → 'converting' → 'zipping' → 'completed' | 'error'
```

### Padrões

- **Child process:** `spawn()` para executar binário externo (`beatportdl-{platform}`)
- **Progress parsing:** Regex `(\d+)\s*%` no stdout para percentual
- **Format conversion:** FFmpeg com args condicionais (MP3 128k/320k, WAV, FLAC)
- **Temporary files:** Extensão `.tmp` durante conversão, rename on success
- **Credit deduction:** Deduz antes do download, refund em caso de erro
- **Re-download:** Tracks já baixados não deduzem créditos novamente
- **Zip:** Múltiplos arquivos zippados com `archiver`, arquivo único servido diretamente
- **File serving:** UUID para filename obfuscation, `Content-Disposition: attachment`
- **Auto-deletion:** Arquivo deletado após streaming para o client
- **Admin bypass:** Admins baixam sem dedução de créditos
- **WebSocket:** Progresso emitido via gateway (seção 18)

---

## 27. Testing (Vitest)

Testes usam **Vitest** com convenção `.spec.ts`.

### Estrutura

```
services/
├── find-all-{entities}/
│   ├── find-all-{entities}.service.ts
│   └── find-all-{entities}.service.spec.ts
```

### Padrão de teste

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('ServiceName', () => {
  let service: ServiceClass
  let mockRepository: MockType<IRepository>

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn(),
      // ...
    }
    service = new ServiceClass(mockRepository)
  })

  it('should return paginated results', async () => {
    mockRepository.findAll.mockResolvedValue(expected)
    const result = await service.execute(params)
    expect(result).toEqual(expected)
  })
})
```

**Regras:**
- 1 arquivo `.spec.ts` por service
- Mock do repositório via `vi.fn()` — não testa DB diretamente no unit test
- Nomear describes com nome do service

---

## 28. Admin Modules

Módulos de administração seguem padrões adicionais:

### Route prefix

```typescript
export const ADMIN_{FEATURE}_BASE_ROUTE = 'admin/{feature}'
```

### Proteção

```typescript
@Roles(['admin'])           // Somente admins
@ApiBearerAuth('bearer')   // Swagger: requer token
@Controller(ADMIN_{FEATURE}_BASE_ROUTE)
```

### Operações comuns

- **add-member-credits** — POST para adicionar créditos + registro de transação
- **set-affiliate-role** — PATCH para alterar role do usuário
- **update-commission-percent** — PATCH para definir percentual de comissão
- **mark-commission-paid** — PATCH para marcar comissão como paga
- **revoke-affiliate** — PATCH para revogar status de afiliado
- **admin-dashboard** — GET com stats agregados (não paginado)

---

## Checklist para Nova Feature

1. **Schema** — Adicionar tabela em `src/infra/database/schema.ts`
2. **Migration** — `npm run db:generate` + `npm run db:migrate`
3. **Constants** — Criar `constants/` com routes, repository token, enums
4. **DTOs** — Criar DTOs de response, query e create/update
5. **Repository Interface** — Criar interface em `repositories/`
6. **Drizzle Repository** (ou Upstream) — Implementar em `infra/drizzle/repositories/` ou `infra/upstream/repositories/`
7. **Repository Module** — Registrar token → implementação em `providers/`
8. **Services** — Criar services (1 por operação)
9. **Controllers** — Criar controllers com Swagger + auth decorators
10. **HTTP Modules** — Criar sub-modules (imports RepositoryModule, providers Service, controllers Controller)
11. **Module Agregador** — Criar `{feature}.module.ts` que importa todos os sub-modules
12. **App Module** — Importar o module agregador no `app.module.ts`
13. **Tests** — Criar `.spec.ts` para cada service com mocks do repositório
14. **WebSocket** (se real-time) — Criar gateway em `infra/ws/` com namespace dedicado
15. **Transactions** (se operações atômicas) — Usar `db.transaction()` para operações multi-step
