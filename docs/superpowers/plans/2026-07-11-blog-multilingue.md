# Blog Multilíngue — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Blog multilíngue (8 idiomas) gerenciado pelo super-admin, com páginas públicas por idioma e integração com a landing.

**Architecture:** Núcleo `BlogPost` independente de idioma + tabela `BlogPostTranslation` (uma linha por locale); categorias com o mesmo padrão de tradução. Rotas públicas sob `app/(marketplace)/blog/[locale]/[slug]`. Admin CRUD sob `app/super-admin/blog/*` com server actions em `actions/admin/blog.ts`, seguindo o padrão `requireAdmin` + Zod + `revalidatePath`.

**Tech Stack:** Next.js 16 (App Router, RSC), Prisma/PostgreSQL, next-intl (só para pt/de do chrome), Tiptap (`RichTextEditor`), Supabase Storage, Zod, Vitest.

## Global Constraints

- **Locales (8):** `pt`, `de`, `en`, `es`, `fr`, `ar`, `it`, `nl`. Fonte única em `lib/blog/locales.ts`.
- **RTL:** apenas `ar` usa `dir="rtl"`.
- **Locale default do blog:** `pt`.
- **Visibilidade:** post público quando `status = PUBLISHED` E `publishedAt <= now()`. Sem cron.
- **Delete de categoria com posts:** bloqueado (`onDelete: Restrict`).
- **Publicar exige ≥1 idioma completo** (título + conteúdo não vazios).
- **Slug:** auto-gerado do título por idioma, editável; único por `(locale, slug)`.
- **Sanitização:** `contentHtml` sanitizado no servidor com `sanitizeHtmlForPreview` de `lib/utils/html-sanitizer.ts` antes de persistir.
- **Auth:** toda server action de escrita chama `requireAdmin()` de `lib/auth.ts`.
- **Testes:** Vitest, arquivos `*.test.ts` co-localizados, `environment: node`, alias `@`. Só lógica pura tem teste unitário; páginas/actions com DB são verificadas por `npx tsc --noEmit` + navegador.

---

### Task 1: Fonte única de locales

**Files:**
- Create: `lib/blog/locales.ts`
- Test: `lib/blog/locales.test.ts`

**Interfaces:**
- Produces:
  - `BLOG_LOCALES: readonly ["pt","de","en","es","fr","ar","it","nl"]`
  - `type BlogLocale = (typeof BLOG_LOCALES)[number]`
  - `DEFAULT_BLOG_LOCALE: BlogLocale` (= `"pt"`)
  - `isBlogLocale(value: string): value is BlogLocale`
  - `isRtlLocale(locale: BlogLocale): boolean`
  - `dirForLocale(locale: BlogLocale): "rtl" | "ltr"`

- [ ] **Step 1: Write the failing test**

```ts
// lib/blog/locales.test.ts
import { describe, it, expect } from "vitest"
import { BLOG_LOCALES, DEFAULT_BLOG_LOCALE, isBlogLocale, isRtlLocale, dirForLocale } from "./locales"

describe("blog locales", () => {
    it("has the 8 supported locales", () => {
        expect(BLOG_LOCALES).toEqual(["pt", "de", "en", "es", "fr", "ar", "it", "nl"])
    })
    it("default is pt", () => {
        expect(DEFAULT_BLOG_LOCALE).toBe("pt")
    })
    it("recognizes valid and invalid locales", () => {
        expect(isBlogLocale("ar")).toBe(true)
        expect(isBlogLocale("xx")).toBe(false)
    })
    it("marks only arabic as RTL", () => {
        expect(isRtlLocale("ar")).toBe(true)
        expect(isRtlLocale("pt")).toBe(false)
        expect(dirForLocale("ar")).toBe("rtl")
        expect(dirForLocale("en")).toBe("ltr")
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/blog/locales.test.ts`
Expected: FAIL — cannot find module `./locales`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/blog/locales.ts
export const BLOG_LOCALES = ["pt", "de", "en", "es", "fr", "ar", "it", "nl"] as const
export type BlogLocale = (typeof BLOG_LOCALES)[number]

export const DEFAULT_BLOG_LOCALE: BlogLocale = "pt"

const RTL_LOCALES = new Set<BlogLocale>(["ar"])

export function isBlogLocale(value: string): value is BlogLocale {
    return (BLOG_LOCALES as readonly string[]).includes(value)
}

export function isRtlLocale(locale: BlogLocale): boolean {
    return RTL_LOCALES.has(locale)
}

export function dirForLocale(locale: BlogLocale): "rtl" | "ltr" {
    return isRtlLocale(locale) ? "rtl" : "ltr"
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/blog/locales.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/blog/locales.ts lib/blog/locales.test.ts
git commit -m "feat(blog): fonte única de locales (8 idiomas)"
```

---

### Task 2: Slugify

**Files:**
- Create: `lib/blog/slug.ts`
- Test: `lib/blog/slug.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `slugify(input: string, fallback?: string): string` — minúsculas, sem acentos, espaços→`-`, remove caracteres não `[a-z0-9-]`, colapsa hífens. Se o resultado ficar vazio (ex.: título só em árabe), retorna `fallback` (default `"post"`).

- [ ] **Step 1: Write the failing test**

```ts
// lib/blog/slug.test.ts
import { describe, it, expect } from "vitest"
import { slugify } from "./slug"

describe("slugify", () => {
    it("normaliza acentos e espaços", () => {
        expect(slugify("Oportunidades para Produtos Orgânicos")).toBe("oportunidades-para-produtos-organicos")
    })
    it("colapsa hífens e remove símbolos", () => {
        expect(slugify("Mercosul: o que & como!")).toBe("mercosul-o-que-como")
    })
    it("cai no fallback quando não sobra nada slugificável", () => {
        expect(slugify("سوق", "post")).toBe("post")
    })
    it("apara hífens das pontas", () => {
        expect(slugify("  --Olá--  ")).toBe("ola")
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/blog/slug.test.ts`
Expected: FAIL — cannot find module `./slug`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/blog/slug.ts
export function slugify(input: string, fallback = "post"): string {
    const base = input
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // remove diacríticos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")

    return base.length > 0 ? base : fallback
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/blog/slug.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/blog/slug.ts lib/blog/slug.test.ts
git commit -m "feat(blog): slugify com fallback para scripts não-latinos"
```

---

### Task 3: Dicionário de rótulos do blog (8 idiomas)

**Files:**
- Create: `lib/blog/i18n.ts`
- Test: `lib/blog/i18n.test.ts`

**Interfaces:**
- Consumes: `BlogLocale`, `BLOG_LOCALES` de Task 1.
- Produces:
  - `type BlogLabels = { readMore: string; publishedOn: string; allCategories: string; otherLanguages: string; empty: string; localeName: Record<BlogLocale, string> }`
  - `getBlogLabels(locale: BlogLocale): BlogLabels`

- [ ] **Step 1: Write the failing test**

```ts
// lib/blog/i18n.test.ts
import { describe, it, expect } from "vitest"
import { BLOG_LOCALES } from "./locales"
import { getBlogLabels } from "./i18n"

describe("blog labels", () => {
    it("retorna rótulos para todos os 8 locales sem chaves vazias", () => {
        for (const locale of BLOG_LOCALES) {
            const labels = getBlogLabels(locale)
            expect(labels.readMore.length).toBeGreaterThan(0)
            expect(labels.publishedOn.length).toBeGreaterThan(0)
            expect(labels.allCategories.length).toBeGreaterThan(0)
            expect(Object.keys(labels.localeName)).toHaveLength(8)
        }
    })
    it("nomeia idiomas no próprio locale", () => {
        expect(getBlogLabels("pt").localeName.de).toBe("Alemão")
        expect(getBlogLabels("de").localeName.de).toBe("Deutsch")
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/blog/i18n.test.ts`
Expected: FAIL — cannot find module `./i18n`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/blog/i18n.ts` with a `LABELS: Record<BlogLocale, BlogLabels>` object filled for the 8 locales. Use the following content (translate the 5 UI strings + the 8 language names per locale):

```ts
// lib/blog/i18n.ts
import type { BlogLocale } from "./locales"

export interface BlogLabels {
    readMore: string
    publishedOn: string
    allCategories: string
    otherLanguages: string
    empty: string
    localeName: Record<BlogLocale, string>
}

// Nomes dos idiomas, cada bloco no próprio idioma.
const NAMES: Record<BlogLocale, Record<BlogLocale, string>> = {
    pt: { pt: "Português", de: "Alemão", en: "Inglês", es: "Espanhol", fr: "Francês", ar: "Árabe", it: "Italiano", nl: "Holandês" },
    de: { pt: "Portugiesisch", de: "Deutsch", en: "Englisch", es: "Spanisch", fr: "Französisch", ar: "Arabisch", it: "Italienisch", nl: "Niederländisch" },
    en: { pt: "Portuguese", de: "German", en: "English", es: "Spanish", fr: "French", ar: "Arabic", it: "Italian", nl: "Dutch" },
    es: { pt: "Portugués", de: "Alemán", en: "Inglés", es: "Español", fr: "Francés", ar: "Árabe", it: "Italiano", nl: "Neerlandés" },
    fr: { pt: "Portugais", de: "Allemand", en: "Anglais", es: "Espagnol", fr: "Français", ar: "Arabe", it: "Italien", nl: "Néerlandais" },
    ar: { pt: "البرتغالية", de: "الألمانية", en: "الإنجليزية", es: "الإسبانية", fr: "الفرنسية", ar: "العربية", it: "الإيطالية", nl: "الهولندية" },
    it: { pt: "Portoghese", de: "Tedesco", en: "Inglese", es: "Spagnolo", fr: "Francese", ar: "Arabo", it: "Italiano", nl: "Olandese" },
    nl: { pt: "Portugees", de: "Duits", en: "Engels", es: "Spaans", fr: "Frans", ar: "Arabisch", it: "Italiaans", nl: "Nederlands" },
}

const UI: Record<BlogLocale, Omit<BlogLabels, "localeName">> = {
    pt: { readMore: "Ler mais", publishedOn: "Publicado em", allCategories: "Todas as categorias", otherLanguages: "Outros idiomas", empty: "Nenhum artigo publicado ainda." },
    de: { readMore: "Weiterlesen", publishedOn: "Veröffentlicht am", allCategories: "Alle Kategorien", otherLanguages: "Andere Sprachen", empty: "Noch keine Artikel veröffentlicht." },
    en: { readMore: "Read more", publishedOn: "Published on", allCategories: "All categories", otherLanguages: "Other languages", empty: "No articles published yet." },
    es: { readMore: "Leer más", publishedOn: "Publicado el", allCategories: "Todas las categorías", otherLanguages: "Otros idiomas", empty: "Aún no hay artículos publicados." },
    fr: { readMore: "Lire la suite", publishedOn: "Publié le", allCategories: "Toutes les catégories", otherLanguages: "Autres langues", empty: "Aucun article publié pour le moment." },
    ar: { readMore: "اقرأ المزيد", publishedOn: "نُشر في", allCategories: "كل الفئات", otherLanguages: "لغات أخرى", empty: "لا توجد مقالات منشورة بعد." },
    it: { readMore: "Leggi di più", publishedOn: "Pubblicato il", allCategories: "Tutte le categorie", otherLanguages: "Altre lingue", empty: "Nessun articolo pubblicato ancora." },
    nl: { readMore: "Lees meer", publishedOn: "Gepubliceerd op", allCategories: "Alle categorieën", otherLanguages: "Andere talen", empty: "Nog geen artikelen gepubliceerd." },
}

export function getBlogLabels(locale: BlogLocale): BlogLabels {
    return { ...UI[locale], localeName: NAMES[locale] }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/blog/i18n.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/blog/i18n.ts lib/blog/i18n.test.ts
git commit -m "feat(blog): dicionário de rótulos nos 8 idiomas"
```

---

### Task 4: Schemas Zod + regra de publicação

**Files:**
- Create: `lib/validations/blog.ts`
- Test: `lib/validations/blog.test.ts`

**Interfaces:**
- Consumes: `BLOG_LOCALES` (Task 1).
- Produces:
  - `blogLocaleSchema` — `z.enum` dos 8 locales.
  - `translationInputSchema` — `{ locale, title, slug, excerpt, contentHtml, metaDescription?, ogImageUrl? }`.
  - `postCoreSchema` — `{ coverImageUrl?, categoryId?, status: "DRAFT"|"PUBLISHED", publishedAt?: Date|null }`.
  - `categoryInputSchema` — `{ key, translations: {locale, name}[] }`.
  - `hasCompleteTranslation(translations: {title:string; contentHtml:string}[]): boolean` — true se ao menos uma tem título e conteúdo (texto não vazio após strip de tags).
  - `assertPublishable(status, translations)` — lança `Error("Publicar exige ao menos um idioma completo")` se `status === "PUBLISHED"` e `!hasCompleteTranslation`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/validations/blog.test.ts
import { describe, it, expect } from "vitest"
import { translationInputSchema, hasCompleteTranslation, assertPublishable } from "./blog"

describe("blog validations", () => {
    it("aceita tradução válida", () => {
        const r = translationInputSchema.safeParse({
            locale: "pt", title: "Olá", slug: "ola", excerpt: "resumo", contentHtml: "<p>oi</p>",
        })
        expect(r.success).toBe(true)
    })
    it("rejeita locale inválido", () => {
        const r = translationInputSchema.safeParse({
            locale: "xx", title: "Olá", slug: "ola", excerpt: "r", contentHtml: "<p>oi</p>",
        })
        expect(r.success).toBe(false)
    })
    it("detecta ao menos um idioma completo (ignora HTML vazio)", () => {
        expect(hasCompleteTranslation([{ title: "T", contentHtml: "<p></p>" }])).toBe(false)
        expect(hasCompleteTranslation([{ title: "T", contentHtml: "<p>corpo</p>" }])).toBe(true)
        expect(hasCompleteTranslation([{ title: "", contentHtml: "<p>corpo</p>" }])).toBe(false)
    })
    it("bloqueia publicação sem idioma completo", () => {
        expect(() => assertPublishable("PUBLISHED", [{ title: "T", contentHtml: "<p></p>" }])).toThrow()
        expect(() => assertPublishable("DRAFT", [{ title: "", contentHtml: "" }])).not.toThrow()
        expect(() => assertPublishable("PUBLISHED", [{ title: "T", contentHtml: "<p>x</p>" }])).not.toThrow()
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/validations/blog.test.ts`
Expected: FAIL — cannot find module `./blog`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/validations/blog.ts
import { z } from "zod"
import { BLOG_LOCALES } from "@/lib/blog/locales"

export const blogLocaleSchema = z.enum(BLOG_LOCALES)

export const translationInputSchema = z.object({
    locale: blogLocaleSchema,
    title: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(1).max(220).regex(/^[a-z0-9-]+$/),
    excerpt: z.string().trim().max(500),
    contentHtml: z.string().max(200_000),
    metaDescription: z.string().trim().max(320).optional(),
    ogImageUrl: z.string().url().max(1000).optional(),
})

export const postCoreSchema = z.object({
    coverImageUrl: z.string().url().max(1000).optional().nullable(),
    categoryId: z.string().min(1).optional().nullable(),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    publishedAt: z.coerce.date().optional().nullable(),
})

export const categoryInputSchema = z.object({
    key: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
    translations: z.array(z.object({
        locale: blogLocaleSchema,
        name: z.string().trim().min(1).max(120),
    })).min(1),
})

function stripTags(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
}

export function hasCompleteTranslation(
    translations: { title: string; contentHtml: string }[]
): boolean {
    return translations.some((t) => t.title.trim().length > 0 && stripTags(t.contentHtml).length > 0)
}

export function assertPublishable(
    status: "DRAFT" | "PUBLISHED",
    translations: { title: string; contentHtml: string }[]
): void {
    if (status === "PUBLISHED" && !hasCompleteTranslation(translations)) {
        throw new Error("Publicar exige ao menos um idioma completo")
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/validations/blog.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/validations/blog.ts lib/validations/blog.test.ts
git commit -m "feat(blog): schemas Zod e regra de publicação (>=1 idioma completo)"
```

---

### Task 5: Modelo Prisma + migração

**Files:**
- Modify: `prisma/schema.prisma` (add enum `BlogPostStatus`, models `BlogPost`, `BlogPostTranslation`, `BlogCategory`, `BlogCategoryTranslation`; add relations no model `User`)
- Create: `prisma/migrations/<timestamp>_add_blog/migration.sql` (via CLI)

**Interfaces:**
- Produces: modelos Prisma `BlogPost`, `BlogPostTranslation`, `BlogCategory`, `BlogCategoryTranslation` e enum `BlogPostStatus` no client gerado.

- [ ] **Step 1: Adicionar o enum e os modelos ao schema**

No fim de `prisma/schema.prisma`, adicionar:

```prisma
enum BlogPostStatus {
  DRAFT
  PUBLISHED
}

model BlogPost {
  id            String                 @id @default(cuid())
  coverImageUrl String?
  status        BlogPostStatus         @default(DRAFT)
  publishedAt   DateTime?
  authorId      String?
  author        User?                  @relation("BlogAuthor", fields: [authorId], references: [id], onDelete: SetNull)
  categoryId    String?
  category      BlogCategory?          @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  translations  BlogPostTranslation[]
  createdAt     DateTime               @default(now())
  updatedAt     DateTime               @updatedAt

  @@index([status, publishedAt])
  @@index([categoryId])
}

model BlogPostTranslation {
  id              String   @id @default(cuid())
  postId          String
  post            BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  locale          String
  title           String
  slug            String
  excerpt         String
  contentHtml     String   @db.Text
  metaDescription String?
  ogImageUrl      String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([postId, locale])
  @@unique([locale, slug])
  @@index([locale])
}

model BlogCategory {
  id           String                     @id @default(cuid())
  key          String                     @unique
  posts        BlogPost[]
  translations BlogCategoryTranslation[]
  createdAt    DateTime                   @default(now())
  updatedAt    DateTime                   @updatedAt
}

model BlogCategoryTranslation {
  id         String       @id @default(cuid())
  categoryId String
  category   BlogCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  locale     String
  name       String

  @@unique([categoryId, locale])
}
```

No `model User { ... }`, adicionar a relação inversa (procure onde estão as outras relações do User e adicione a linha):

```prisma
  blogPosts BlogPost[] @relation("BlogAuthor")
```

- [ ] **Step 2: Validar o schema**

Run: `npx prisma validate`
Expected: "The schema at prisma/schema.prisma is valid".

- [ ] **Step 3: Gerar e aplicar a migração**

Run: `npx prisma migrate dev --name add_blog --create-only`
Depois inspecione o SQL gerado em `prisma/migrations/<timestamp>_add_blog/migration.sql` e confirme que cria as 4 tabelas + enum + índices. Em seguida aplique:
Run: `npx prisma migrate deploy`
(Projeto sem shadow DB — não usar `migrate reset`.)

- [ ] **Step 4: Regenerar o client e typecheck**

Run: `npx prisma generate && npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(blog): modelos Prisma e migração (posts, traduções, categorias)"
```

---

### Task 6: Camada de consultas (queries)

**Files:**
- Create: `lib/blog/queries.ts`
- Test: `lib/blog/queries.test.ts` (apenas o builder puro `publishedWhere`)

**Interfaces:**
- Consumes: `prisma` de `@/lib/prisma`; `BlogLocale` (Task 1).
- Produces:
  - `publishedWhere(now?: Date)` → `{ status: "PUBLISHED", publishedAt: { lte: Date } }` (objeto puro, testável).
  - `getPublishedPostsForLocale(locale, opts?: { categoryKey?: string; page?: number; pageSize?: number })` → `{ posts, total }` — posts publicados com tradução no locale, ordenados por `publishedAt desc`.
  - `getPostBySlug(locale, slug)` → post publicado + a tradução do locale + `availableLocales: BlogLocale[]` (locales que o post tem) + categoria. `null` se não achar.
  - `getLatestPostsForTeaser(locale, limit)` → array leve `{ postId, slug, title, excerpt, coverImageUrl, categoryName }` para a landing.

- [ ] **Step 1: Write the failing test (builder puro)**

```ts
// lib/blog/queries.test.ts
import { describe, it, expect } from "vitest"
import { publishedWhere } from "./queries"

describe("publishedWhere", () => {
    it("filtra por PUBLISHED e publishedAt <= now", () => {
        const now = new Date("2026-07-11T12:00:00Z")
        expect(publishedWhere(now)).toEqual({
            status: "PUBLISHED",
            publishedAt: { lte: now },
        })
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/blog/queries.test.ts`
Expected: FAIL — cannot find module `./queries`.

- [ ] **Step 3: Write implementation**

```ts
// lib/blog/queries.ts
import { prisma } from "@/lib/prisma"
import type { BlogLocale } from "./locales"

export function publishedWhere(now: Date = new Date()) {
    return { status: "PUBLISHED" as const, publishedAt: { lte: now } }
}

export async function getPublishedPostsForLocale(
    locale: BlogLocale,
    opts: { categoryKey?: string; page?: number; pageSize?: number } = {}
) {
    const page = Math.max(1, opts.page ?? 1)
    const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 9))
    const where = {
        ...publishedWhere(),
        translations: { some: { locale } },
        ...(opts.categoryKey ? { category: { key: opts.categoryKey } } : {}),
    }

    const [rows, total] = await Promise.all([
        prisma.blogPost.findMany({
            where,
            orderBy: { publishedAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                translations: { where: { locale } },
                category: { include: { translations: { where: { locale } } } },
            },
        }),
        prisma.blogPost.count({ where }),
    ])

    const posts = rows.map((p) => ({
        id: p.id,
        coverImageUrl: p.coverImageUrl,
        publishedAt: p.publishedAt,
        translation: p.translations[0],
        categoryName: p.category?.translations[0]?.name ?? null,
        categoryKey: p.category?.key ?? null,
    }))

    return { posts, total }
}

export async function getPostBySlug(locale: BlogLocale, slug: string) {
    const translation = await prisma.blogPostTranslation.findUnique({
        where: { locale_slug: { locale, slug } },
        include: {
            post: {
                include: {
                    translations: { select: { locale: true, slug: true } },
                    category: { include: { translations: { where: { locale } } } },
                },
            },
        },
    })

    if (!translation) return null
    const post = translation.post
    const now = new Date()
    if (post.status !== "PUBLISHED" || !post.publishedAt || post.publishedAt > now) {
        return null
    }

    return {
        post,
        translation,
        availableLocales: post.translations.map((t) => t.locale as BlogLocale),
        localeSlugs: Object.fromEntries(post.translations.map((t) => [t.locale, t.slug])) as Record<string, string>,
        categoryName: post.category?.translations[0]?.name ?? null,
    }
}

export async function getLatestPostsForTeaser(locale: BlogLocale, limit = 3) {
    const rows = await prisma.blogPost.findMany({
        where: { ...publishedWhere(), translations: { some: { locale } } },
        orderBy: { publishedAt: "desc" },
        take: limit,
        include: {
            translations: { where: { locale } },
            category: { include: { translations: { where: { locale } } } },
        },
    })
    return rows.map((p) => ({
        postId: p.id,
        slug: p.translations[0]?.slug ?? "",
        title: p.translations[0]?.title ?? "",
        excerpt: p.translations[0]?.excerpt ?? "",
        coverImageUrl: p.coverImageUrl,
        categoryName: p.category?.translations[0]?.name ?? null,
    }))
}
```

Nota: a chave composta do `findUnique` é `locale_slug` (Prisma nomeia a partir do `@@unique([locale, slug])`). Se `npx prisma generate` gerar outro nome, ajuste para o nome real exibido no tipo.

- [ ] **Step 4: Run test + typecheck**

Run: `npx vitest run lib/blog/queries.test.ts && npx tsc --noEmit -p tsconfig.json`
Expected: teste PASS; typecheck exit 0.

- [ ] **Step 5: Commit**

```bash
git add lib/blog/queries.ts lib/blog/queries.test.ts
git commit -m "feat(blog): consultas públicas (índice, post por slug, teaser)"
```

---

### Task 7: Upload de imagem de capa (Supabase Storage)

**Files:**
- Create: `lib/blog/storage.ts`

**Interfaces:**
- Consumes: `createClient` de `@/lib/supabase/client`.
- Produces: `uploadBlogImage(file: File): Promise<{ success: boolean; url?: string; error?: string }>` — valida PNG/JPG/WebP, ≤ 4MB, sobe no bucket `blog` com nome único, retorna URL pública.

- [ ] **Step 1: Implementar (segue o padrão de `lib/supabase/storage.ts`)**

```ts
// lib/blog/storage.ts
import { createClient } from "@/lib/supabase/client"

const BUCKET = "blog"
const MAX = 4 * 1024 * 1024

export interface BlogUploadResult {
    success: boolean
    url?: string
    error?: string
}

export async function uploadBlogImage(file: File): Promise<BlogUploadResult> {
    const allowed = ["image/png", "image/jpeg", "image/webp"]
    if (!allowed.includes(file.type)) {
        return { success: false, error: "Formato inválido. Use PNG, JPG ou WebP." }
    }
    if (file.size > MAX) {
        return { success: false, error: "Arquivo muito grande. Máximo 4MB." }
    }

    const supabase = createClient()
    const ext = file.name.split(".").pop() || "jpg"
    const fileName = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
    })
    if (error) {
        console.error("Blog image upload error:", error)
        return { success: false, error: "Erro ao fazer upload. Tente novamente." }
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    return { success: true, url: data.publicUrl }
}
```

- [ ] **Step 2: Criar o bucket no Supabase**

No painel Supabase (ou via MCP), criar um bucket **público** chamado `blog`. Sem isso o upload falha em runtime. (Ação de infraestrutura, fora do código.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add lib/blog/storage.ts
git commit -m "feat(blog): upload de imagem de capa no Supabase Storage"
```

---

### Task 8: Server actions do admin

**Files:**
- Create: `actions/admin/blog.ts`

**Interfaces:**
- Consumes: `requireAdmin` (`@/lib/auth`), `prisma`, `sanitizeHtmlForPreview` (`@/lib/utils/html-sanitizer`), schemas de Task 4, `slugify` (Task 2).
- Produces (todas server actions):
  - `createCategory(input)`, `updateCategory(id, input)`, `deleteCategory(id)` (bloqueia se tiver posts).
  - `createPost(input)`, `updatePost(id, input)`, `deletePost(id)`.
  - `upsertTranslation(postId, input)`, `deleteTranslation(postId, locale)`.
  - `listPostsAdmin()`, `getPostAdmin(id)`, `listCategoriesAdmin()`.
  - Tipos de input: `PostCoreInput` (= `z.infer<typeof postCoreSchema>` + `translations: TranslationInput[]`), `TranslationInput` (= `z.infer<typeof translationInputSchema>`), `CategoryInput` (= `z.infer<typeof categoryInputSchema>`).

- [ ] **Step 1: Implementar as actions**

```ts
// actions/admin/blog.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { sanitizeHtmlForPreview } from "@/lib/utils/html-sanitizer"
import {
    postCoreSchema,
    translationInputSchema,
    categoryInputSchema,
    assertPublishable,
} from "@/lib/validations/blog"
import { z } from "zod"

const createPostSchema = postCoreSchema.extend({
    translations: z.array(translationInputSchema).default([]),
})

function revalidateBlog() {
    revalidatePath("/super-admin/blog")
    revalidatePath("/blog", "layout")
    revalidatePath("/", "page")
    revalidatePath("/de", "page")
}

function sanitizeTranslations<T extends { contentHtml: string }>(translations: T[]): T[] {
    return translations.map((t) => ({ ...t, contentHtml: sanitizeHtmlForPreview(t.contentHtml) }))
}

// ---------- Categorias ----------
export async function listCategoriesAdmin() {
    await requireAdmin()
    return prisma.blogCategory.findMany({
        orderBy: { createdAt: "asc" },
        include: { translations: true, _count: { select: { posts: true } } },
    })
}

export async function createCategory(input: unknown) {
    await requireAdmin()
    const data = categoryInputSchema.parse(input)
    const category = await prisma.blogCategory.create({
        data: { key: data.key, translations: { create: data.translations } },
    })
    revalidateBlog()
    return category.id
}

export async function updateCategory(id: string, input: unknown) {
    await requireAdmin()
    const data = categoryInputSchema.parse(input)
    await prisma.$transaction([
        prisma.blogCategoryTranslation.deleteMany({ where: { categoryId: id } }),
        prisma.blogCategory.update({
            where: { id },
            data: { key: data.key, translations: { create: data.translations } },
        }),
    ])
    revalidateBlog()
}

export async function deleteCategory(id: string) {
    await requireAdmin()
    const count = await prisma.blogPost.count({ where: { categoryId: id } })
    if (count > 0) {
        throw new Error("Categoria em uso: reatribua os posts antes de excluir")
    }
    await prisma.blogCategory.delete({ where: { id } })
    revalidateBlog()
}

// ---------- Posts ----------
export async function listPostsAdmin() {
    await requireAdmin()
    return prisma.blogPost.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
            translations: { select: { locale: true, title: true } },
            category: { include: { translations: true } },
        },
    })
}

export async function getPostAdmin(id: string) {
    await requireAdmin()
    return prisma.blogPost.findUnique({
        where: { id },
        include: { translations: true },
    })
}

export async function createPost(input: unknown) {
    const admin = await requireAdmin()
    const data = createPostSchema.parse(input)
    const translations = sanitizeTranslations(data.translations)
    assertPublishable(data.status, translations)

    const post = await prisma.blogPost.create({
        data: {
            coverImageUrl: data.coverImageUrl ?? null,
            categoryId: data.categoryId ?? null,
            status: data.status,
            publishedAt: data.publishedAt ?? (data.status === "PUBLISHED" ? new Date() : null),
            authorId: admin.id,
            translations: { create: translations },
        },
    })
    revalidateBlog()
    return post.id
}

export async function updatePost(id: string, input: unknown) {
    await requireAdmin()
    const data = createPostSchema.parse(input)
    const translations = sanitizeTranslations(data.translations)
    assertPublishable(data.status, translations)

    await prisma.$transaction([
        prisma.blogPostTranslation.deleteMany({ where: { postId: id } }),
        prisma.blogPost.update({
            where: { id },
            data: {
                coverImageUrl: data.coverImageUrl ?? null,
                categoryId: data.categoryId ?? null,
                status: data.status,
                publishedAt: data.publishedAt ?? (data.status === "PUBLISHED" ? new Date() : null),
                translations: { create: translations },
            },
        }),
    ])
    revalidateBlog()
}

export async function deletePost(id: string) {
    await requireAdmin()
    await prisma.blogPost.delete({ where: { id } })
    revalidateBlog()
}
```

Nota: `requireAdmin()` retorna `AuthenticatedDbUser` com `.id` (ver `lib/auth.ts`). `upsertTranslation`/`deleteTranslation` não são necessárias porque `updatePost` regrava todas as traduções em transação (mais simples e consistente) — removidas do escopo desta task para evitar código morto.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add actions/admin/blog.ts
git commit -m "feat(blog): server actions do admin (posts, traduções, categorias)"
```

---

### Task 9: Admin — lista de posts e página de categorias

**Files:**
- Create: `app/super-admin/blog/page.tsx` (lista)
- Create: `app/super-admin/blog/categories/page.tsx` (CRUD categorias — client)
- Create: `components/admin/blog/category-manager.tsx` (client)
- Modify: `components/admin/admin-sidebar.tsx` (adicionar item "Blog")

**Interfaces:**
- Consumes: `listPostsAdmin`, `listCategoriesAdmin`, `createCategory`, `updateCategory`, `deleteCategory` (Task 8); `BLOG_LOCALES` (Task 1).

- [ ] **Step 1: Página de lista de posts**

```tsx
// app/super-admin/blog/page.tsx
import Link from "next/link"
import { Plus, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { listPostsAdmin } from "@/actions/admin/blog"

export const dynamic = "force-dynamic"

export default async function AdminBlogPage() {
    const posts = await listPostsAdmin()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Blog</h1>
                    <p className="text-muted-foreground">Gerencie os artigos do blog nos 8 idiomas.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/super-admin/blog/categories"><Tags className="h-4 w-4" /> Categorias</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/super-admin/blog/new"><Plus className="h-4 w-4" /> Novo post</Link>
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left">
                        <tr>
                            <th className="p-3">Título</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Idiomas</th>
                            <th className="p-3">Publicado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.length === 0 && (
                            <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum post ainda.</td></tr>
                        )}
                        {posts.map((post) => {
                            const title = post.translations.find((t) => t.locale === "pt")?.title
                                ?? post.translations[0]?.title ?? "(sem título)"
                            const categoryName = post.category?.translations.find((t) => t.locale === "pt")?.name
                                ?? post.category?.translations[0]?.name ?? "—"
                            return (
                                <tr key={post.id} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="p-3">
                                        <Link href={`/super-admin/blog/${post.id}`} className="font-medium hover:underline">
                                            {title}
                                        </Link>
                                    </td>
                                    <td className="p-3">
                                        <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                                            {post.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                                        </Badge>
                                    </td>
                                    <td className="p-3">{categoryName}</td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1">
                                            {post.translations.map((t) => (
                                                <span key={t.locale} className="rounded bg-muted px-1.5 py-0.5 text-xs uppercase">{t.locale}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("pt-BR") : "—"}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
```

- [ ] **Step 2: Gerenciador de categorias (client) + página**

```tsx
// components/admin/blog/category-manager.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BLOG_LOCALES } from "@/lib/blog/locales"
import { createCategory, deleteCategory } from "@/actions/admin/blog"
import { slugify } from "@/lib/blog/slug"

type CategoryRow = {
    id: string
    key: string
    translations: { locale: string; name: string }[]
    _count: { posts: number }
}

export function CategoryManager({ initial }: { initial: CategoryRow[] }) {
    const router = useRouter()
    const [key, setKey] = useState("")
    const [names, setNames] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    const handleCreate = async () => {
        const translations = BLOG_LOCALES
            .filter((l) => names[l]?.trim())
            .map((l) => ({ locale: l, name: names[l].trim() }))
        if (!key.trim() || translations.length === 0) {
            toast.error("Informe a chave e ao menos um nome traduzido.")
            return
        }
        setSaving(true)
        try {
            await createCategory({ key: slugify(key), translations })
            toast.success("Categoria criada.")
            setKey(""); setNames({})
            router.refresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao criar categoria.")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory(id)
            toast.success("Categoria excluída.")
            router.refresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao excluir.")
        }
    }

    return (
        <div className="space-y-8">
            <div className="rounded-lg border p-4 space-y-4">
                <h2 className="font-semibold">Nova categoria</h2>
                <Input placeholder="chave (ex.: market-analysis)" value={key} onChange={(e) => setKey(e.target.value)} />
                <div className="grid gap-2 sm:grid-cols-2">
                    {BLOG_LOCALES.map((l) => (
                        <Input key={l} placeholder={`Nome (${l.toUpperCase()})`}
                            value={names[l] ?? ""} onChange={(e) => setNames((n) => ({ ...n, [l]: e.target.value }))} />
                    ))}
                </div>
                <Button onClick={handleCreate} disabled={saving}><Plus className="h-4 w-4" /> Criar</Button>
            </div>

            <div className="rounded-lg border divide-y">
                {initial.length === 0 && <p className="p-4 text-muted-foreground">Nenhuma categoria.</p>}
                {initial.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3">
                        <div>
                            <span className="font-medium">{c.translations.find((t) => t.locale === "pt")?.name ?? c.key}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{c.key} · {c._count.posts} post(s)</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} aria-label="Excluir">
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
```

```tsx
// app/super-admin/blog/categories/page.tsx
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listCategoriesAdmin } from "@/actions/admin/blog"
import { CategoryManager } from "@/components/admin/blog/category-manager"

export const dynamic = "force-dynamic"

export default async function BlogCategoriesPage() {
    const categories = await listCategoriesAdmin()
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Categorias do blog</h1>
                <Button variant="outline" asChild>
                    <Link href="/super-admin/blog"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
                </Button>
            </div>
            <CategoryManager initial={categories.map((c) => ({
                id: c.id, key: c.key,
                translations: c.translations.map((t) => ({ locale: t.locale, name: t.name })),
                _count: c._count,
            }))} />
        </div>
    )
}
```

- [ ] **Step 3: Adicionar item "Blog" na sidebar**

Em `components/admin/admin-sidebar.tsx`, no grupo "Leads e vendas" (ou um novo grupo "Conteúdo"), adicionar após a linha de "Vendas":

```tsx
            { title: "Blog", href: "/super-admin/blog", icon: FileText },
```

E garantir o import do ícone no topo do arquivo: adicionar `FileText` à lista de imports de `lucide-react`.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/super-admin/blog/page.tsx app/super-admin/blog/categories/page.tsx components/admin/blog/category-manager.tsx components/admin/admin-sidebar.tsx
git commit -m "feat(blog): admin — lista de posts, categorias e item na sidebar"
```

---

### Task 10: Admin — editor de post (criar/editar)

**Files:**
- Create: `components/admin/blog/post-editor.tsx` (client — abas por idioma, upload, RichTextEditor)
- Create: `app/super-admin/blog/new/page.tsx`
- Create: `app/super-admin/blog/[id]/page.tsx`

**Interfaces:**
- Consumes: `createPost`, `updatePost`, `listCategoriesAdmin`, `getPostAdmin` (Task 8); `uploadBlogImage` (Task 7); `RichTextEditor`; `BLOG_LOCALES`, `dirForLocale` (Task 1); `slugify` (Task 2).

- [ ] **Step 1: Editor (client)**

```tsx
// components/admin/blog/post-editor.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor/rich-text-editor"
import { BLOG_LOCALES, dirForLocale, type BlogLocale } from "@/lib/blog/locales"
import { slugify } from "@/lib/blog/slug"
import { uploadBlogImage } from "@/lib/blog/storage"
import { createPost, updatePost } from "@/actions/admin/blog"

type TranslationState = {
    title: string; slug: string; excerpt: string; contentHtml: string; metaDescription: string
}
const EMPTY: TranslationState = { title: "", slug: "", excerpt: "", contentHtml: "", metaDescription: "" }

export type PostEditorInitial = {
    id?: string
    coverImageUrl: string | null
    categoryId: string | null
    status: "DRAFT" | "PUBLISHED"
    publishedAt: string | null
    translations: Partial<Record<BlogLocale, TranslationState>>
}

export function PostEditor({
    initial,
    categories,
}: {
    initial: PostEditorInitial
    categories: { id: string; name: string }[]
}) {
    const router = useRouter()
    const [cover, setCover] = useState(initial.coverImageUrl)
    const [categoryId, setCategoryId] = useState(initial.categoryId ?? "")
    const [status, setStatus] = useState(initial.status)
    const [publishedAt, setPublishedAt] = useState(initial.publishedAt ?? "")
    const [active, setActive] = useState<BlogLocale>("pt")
    const [tr, setTr] = useState<Partial<Record<BlogLocale, TranslationState>>>(initial.translations)
    const [saving, setSaving] = useState(false)

    const current = tr[active] ?? EMPTY
    const setField = (field: keyof TranslationState, value: string) =>
        setTr((prev) => ({ ...prev, [active]: { ...(prev[active] ?? EMPTY), [field]: value } }))

    const onTitleBlur = () => {
        if (current.title && !current.slug) setField("slug", slugify(current.title))
    }

    const onUpload = async (file: File) => {
        const res = await uploadBlogImage(file)
        if (res.success && res.url) { setCover(res.url); toast.success("Capa enviada.") }
        else toast.error(res.error ?? "Falha no upload.")
    }

    const handleSave = async () => {
        const translations = BLOG_LOCALES
            .map((l) => ({ locale: l, ...(tr[l] ?? EMPTY) }))
            .filter((t) => t.title.trim() || t.contentHtml.trim())
            .map((t) => ({
                locale: t.locale,
                title: t.title.trim(),
                slug: (t.slug.trim() || slugify(t.title || t.locale)),
                excerpt: t.excerpt.trim(),
                contentHtml: t.contentHtml,
                metaDescription: t.metaDescription.trim() || undefined,
            }))

        const payload = {
            coverImageUrl: cover ?? undefined,
            categoryId: categoryId || undefined,
            status,
            publishedAt: publishedAt ? new Date(publishedAt) : undefined,
            translations,
        }

        setSaving(true)
        try {
            if (initial.id) { await updatePost(initial.id, payload); toast.success("Post atualizado.") }
            else { const id = await createPost(payload); toast.success("Post criado."); router.push(`/super-admin/blog/${id}`) }
            router.refresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao salvar.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Núcleo */}
            <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>Categoria</Label>
                    <select className="h-10 w-full rounded-md border bg-background px-3"
                        value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="">— sem categoria —</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Status</Label>
                    <select className="h-10 w-full rounded-md border bg-background px-3"
                        value={status} onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}>
                        <option value="DRAFT">Rascunho</option>
                        <option value="PUBLISHED">Publicado</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Data de publicação (futura = agendado)</Label>
                    <Input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Capa</Label>
                    <Input type="file" accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
                    {cover && <img src={cover} alt="" className="mt-2 h-24 rounded object-cover" />}
                </div>
            </div>

            {/* Abas de idioma */}
            <div className="flex flex-wrap gap-1 border-b">
                {BLOG_LOCALES.map((l) => {
                    const filled = (tr[l]?.title?.trim() || tr[l]?.contentHtml?.trim())
                    return (
                        <button key={l} onClick={() => setActive(l)}
                            className={`px-3 py-2 text-sm uppercase ${active === l ? "border-b-2 border-primary font-semibold" : "text-muted-foreground"}`}>
                            {l}{filled ? " ●" : ""}
                        </button>
                    )
                })}
            </div>

            <div className="space-y-4" dir={dirForLocale(active)}>
                <div className="space-y-2">
                    <Label>Título</Label>
                    <Input value={current.title} onBlur={onTitleBlur} onChange={(e) => setField("title", e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={current.slug} onChange={(e) => setField("slug", e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Resumo</Label>
                    <Input value={current.excerpt} onChange={(e) => setField("excerpt", e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Conteúdo</Label>
                    <RichTextEditor content={current.contentHtml} onChange={(html) => setField("contentHtml", html)} />
                </div>
                <div className="space-y-2">
                    <Label>Meta description (SEO)</Label>
                    <Input value={current.metaDescription} onChange={(e) => setField("metaDescription", e.target.value)} />
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            </div>
        </div>
    )
}
```

- [ ] **Step 2: Páginas new e [id]**

```tsx
// app/super-admin/blog/new/page.tsx
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listCategoriesAdmin } from "@/actions/admin/blog"
import { PostEditor } from "@/components/admin/blog/post-editor"

export const dynamic = "force-dynamic"

export default async function NewBlogPostPage() {
    const categories = await listCategoriesAdmin()
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Novo post</h1>
                <Button variant="outline" asChild><Link href="/super-admin/blog"><ArrowLeft className="h-4 w-4" /> Voltar</Link></Button>
            </div>
            <PostEditor
                categories={categories.map((c) => ({ id: c.id, name: c.translations.find((t) => t.locale === "pt")?.name ?? c.key }))}
                initial={{ coverImageUrl: null, categoryId: null, status: "DRAFT", publishedAt: null, translations: {} }}
            />
        </div>
    )
}
```

```tsx
// app/super-admin/blog/[id]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPostAdmin, listCategoriesAdmin } from "@/actions/admin/blog"
import { PostEditor, type PostEditorInitial } from "@/components/admin/blog/post-editor"
import type { BlogLocale } from "@/lib/blog/locales"

export const dynamic = "force-dynamic"

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const [post, categories] = await Promise.all([getPostAdmin(id), listCategoriesAdmin()])
    if (!post) notFound()

    const translations: PostEditorInitial["translations"] = {}
    for (const t of post.translations) {
        translations[t.locale as BlogLocale] = {
            title: t.title, slug: t.slug, excerpt: t.excerpt,
            contentHtml: t.contentHtml, metaDescription: t.metaDescription ?? "",
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Editar post</h1>
                <Button variant="outline" asChild><Link href="/super-admin/blog"><ArrowLeft className="h-4 w-4" /> Voltar</Link></Button>
            </div>
            <PostEditor
                categories={categories.map((c) => ({ id: c.id, name: c.translations.find((t) => t.locale === "pt")?.name ?? c.key }))}
                initial={{
                    id: post.id,
                    coverImageUrl: post.coverImageUrl,
                    categoryId: post.categoryId,
                    status: post.status,
                    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : null,
                    translations,
                }}
            />
        </div>
    )
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0. (Se `Label` não existir em `components/ui/label`, use `<label className="text-sm font-medium">` inline.)

- [ ] **Step 4: Verificação no navegador**

Iniciar o preview (`preview_start` name `dev`), logar como ADMIN, ir a `/super-admin/blog/new`, criar uma categoria, criar um post com PT+EN preenchidos, status Publicado, e salvar. Confirmar redirect para `/super-admin/blog/[id]` e que o post aparece na lista com badges `PT EN`. Verificar console sem erros.

- [ ] **Step 5: Commit**

```bash
git add app/super-admin/blog/new/page.tsx "app/super-admin/blog/[id]/page.tsx" components/admin/blog/post-editor.tsx
git commit -m "feat(blog): admin — editor de post com abas por idioma"
```

---

### Task 11: Público — índice `/blog/[locale]`

**Files:**
- Create: `app/(marketplace)/blog/[locale]/page.tsx`
- Create: `components/blog/post-card.tsx`
- Modify: `proxy.ts` (adicionar `/blog` às rotas públicas do marketplace)

**Interfaces:**
- Consumes: `getPublishedPostsForLocale` (Task 6); `getBlogLabels` (Task 3); `isBlogLocale`, `BLOG_LOCALES`, `dirForLocale` (Task 1); `listCategoriesAdmin` não (é admin) — em vez disso, buscar categorias públicas via prisma inline ou um helper. Use `prisma.blogCategory.findMany` diretamente na página para o filtro.

- [ ] **Step 1: Tornar `/blog` público no middleware**

Em `proxy.ts`, no array `marketplaceRoutes`, adicionar `"/blog"`:

```ts
    const marketplaceRoutes = [
        "/",
        "/de",
        "/faq",
        "/opengraph-image",
        "/catalog",
        "/list",
        "/my-purchases",
        "/checkout",
        "/cart",
        "/blog",
    ]
```

- [ ] **Step 2: Card de post**

```tsx
// components/blog/post-card.tsx
import Link from "next/link"
import type { BlogLocale } from "@/lib/blog/locales"

export function PostCard({
    locale, slug, title, excerpt, coverImageUrl, categoryName, dateLabel,
}: {
    locale: BlogLocale; slug: string; title: string; excerpt: string
    coverImageUrl: string | null; categoryName: string | null; dateLabel: string
}) {
    return (
        <Link href={`/blog/${locale}/${slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            {coverImageUrl
                ? <img src={coverImageUrl} alt="" className="h-40 w-full object-cover" />
                : <div className="h-40 w-full bg-gradient-to-br from-indigo-100 to-indigo-200" />}
            <div className="flex flex-1 flex-col p-5">
                {categoryName && <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">{categoryName}</p>}
                <h3 className="mt-2 font-semibold leading-snug text-gray-950 group-hover:text-indigo-700">{title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">{excerpt}</p>
                <span className="mt-4 text-xs text-gray-400">{dateLabel}</span>
            </div>
        </Link>
    )
}
```

- [ ] **Step 3: Página de índice**

```tsx
// app/(marketplace)/blog/[locale]/page.tsx
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { isBlogLocale, BLOG_LOCALES, dirForLocale, type BlogLocale } from "@/lib/blog/locales"
import { getBlogLabels } from "@/lib/blog/i18n"
import { getPublishedPostsForLocale } from "@/lib/blog/queries"
import { PostCard } from "@/components/blog/post-card"

export function generateStaticParams() {
    return BLOG_LOCALES.map((locale) => ({ locale }))
}

export default async function BlogIndexPage({
    params, searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ categoria?: string; page?: string }>
}) {
    const { locale } = await params
    if (!isBlogLocale(locale)) notFound()
    const { categoria, page } = await searchParams
    const labels = getBlogLabels(locale)

    const [{ posts }, categories] = await Promise.all([
        getPublishedPostsForLocale(locale, { categoryKey: categoria, page: page ? Number(page) : 1 }),
        prisma.blogCategory.findMany({ include: { translations: { where: { locale } } } }),
    ])

    return (
        <div className="min-h-screen bg-white text-gray-950" dir={dirForLocale(locale)}>
            <div className="container mx-auto px-4 py-14">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Blog</h1>

                <div className="mt-6 flex flex-wrap gap-2">
                    <Link href={`/blog/${locale}`}
                        className={`rounded-full border px-3 py-1 text-sm ${!categoria ? "bg-gray-950 text-white" : "text-gray-600"}`}>
                        {labels.allCategories}
                    </Link>
                    {categories.map((c) => (
                        <Link key={c.id} href={`/blog/${locale}?categoria=${c.key}`}
                            className={`rounded-full border px-3 py-1 text-sm ${categoria === c.key ? "bg-gray-950 text-white" : "text-gray-600"}`}>
                            {c.translations[0]?.name ?? c.key}
                        </Link>
                    ))}
                </div>

                {posts.length === 0 ? (
                    <p className="mt-10 text-gray-500">{labels.empty}</p>
                ) : (
                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                        {posts.map((p) => (
                            <PostCard key={p.id} locale={locale as BlogLocale}
                                slug={p.translation.slug} title={p.translation.title} excerpt={p.translation.excerpt}
                                coverImageUrl={p.coverImageUrl} categoryName={p.categoryName}
                                dateLabel={p.publishedAt ? new Date(p.publishedAt).toLocaleDateString(locale) : ""} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
```

- [ ] **Step 4: Typecheck + navegador**

Run: `npx tsc --noEmit -p tsconfig.json` (exit 0).
No navegador: acessar `/blog/pt` (deslogado) e confirmar que carrega, mostra o post publicado na Task 10 e o filtro de categorias. Testar `/blog/xx` → 404.

- [ ] **Step 5: Commit**

```bash
git add "app/(marketplace)/blog/[locale]/page.tsx" components/blog/post-card.tsx proxy.ts
git commit -m "feat(blog): índice público por idioma com filtro de categoria"
```

---

### Task 12: Público — página do post `/blog/[locale]/[slug]`

**Files:**
- Create: `app/(marketplace)/blog/[locale]/[slug]/page.tsx`
- Create: `components/blog/language-switcher.tsx`

**Interfaces:**
- Consumes: `getPostBySlug` (Task 6); `getBlogLabels` (Task 3); `isBlogLocale`, `dirForLocale` (Task 1).

- [ ] **Step 1: Seletor de idioma do post**

```tsx
// components/blog/language-switcher.tsx
import Link from "next/link"
import { getBlogLabels } from "@/lib/blog/i18n"
import type { BlogLocale } from "@/lib/blog/locales"

export function LanguageSwitcher({
    locale, availableLocales, localeSlugs,
}: {
    locale: BlogLocale; availableLocales: BlogLocale[]; localeSlugs: Record<string, string>
}) {
    if (availableLocales.length <= 1) return null
    const labels = getBlogLabels(locale)
    return (
        <div className="mt-8 border-t pt-6">
            <p className="mb-2 text-sm font-medium text-gray-700">{labels.otherLanguages}</p>
            <div className="flex flex-wrap gap-2">
                {availableLocales.filter((l) => l !== locale).map((l) => (
                    <Link key={l} href={`/blog/${l}/${localeSlugs[l]}`}
                        className="rounded-full border px-3 py-1 text-sm text-gray-600 hover:text-gray-950">
                        {labels.localeName[l]}
                    </Link>
                ))}
            </div>
        </div>
    )
}
```

- [ ] **Step 2: Página do post + metadata**

```tsx
// app/(marketplace)/blog/[locale]/[slug]/page.tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isBlogLocale, dirForLocale, type BlogLocale } from "@/lib/blog/locales"
import { getBlogLabels } from "@/lib/blog/i18n"
import { getPostBySlug } from "@/lib/blog/queries"
import { LanguageSwitcher } from "@/components/blog/language-switcher"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
    const { locale, slug } = await params
    if (!isBlogLocale(locale)) return {}
    const data = await getPostBySlug(locale, slug)
    if (!data) return {}
    const og = data.translation.ogImageUrl ?? data.post.coverImageUrl ?? undefined
    return {
        title: data.translation.title,
        description: data.translation.metaDescription ?? data.translation.excerpt,
        openGraph: {
            title: data.translation.title,
            description: data.translation.metaDescription ?? data.translation.excerpt,
            images: og ? [{ url: og }] : undefined,
            locale,
        },
    }
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>
}) {
    const { locale, slug } = await params
    if (!isBlogLocale(locale)) notFound()
    const data = await getPostBySlug(locale, slug)
    if (!data) notFound()

    const labels = getBlogLabels(locale)
    const { translation, post, availableLocales, localeSlugs, categoryName } = data
    const dateLabel = post.publishedAt
        ? `${labels.publishedOn} ${new Date(post.publishedAt).toLocaleDateString(locale)}`
        : ""

    return (
        <article className="min-h-screen bg-white text-gray-950" dir={dirForLocale(locale)}>
            <div className="mx-auto max-w-3xl px-4 py-14">
                {categoryName && <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">{categoryName}</p>}
                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{translation.title}</h1>
                {dateLabel && <p className="mt-3 text-sm text-gray-500">{dateLabel}</p>}
                {post.coverImageUrl && <img src={post.coverImageUrl} alt="" className="mt-6 w-full rounded-lg object-cover" />}
                <div
                    className="prose prose-indigo mt-8 max-w-none"
                    dangerouslySetInnerHTML={{ __html: translation.contentHtml }}
                />
                <LanguageSwitcher locale={locale as BlogLocale} availableLocales={availableLocales} localeSlugs={localeSlugs} />
            </div>
        </article>
    )
}
```

Nota de segurança: `contentHtml` já foi sanitizado no servidor na escrita (Task 8), então `dangerouslySetInnerHTML` aqui renderiza conteúdo confiável.

- [ ] **Step 3: Typecheck + navegador**

Run: `npx tsc --noEmit -p tsconfig.json` (exit 0).
No navegador: abrir o post publicado via card do índice; confirmar título/conteúdo, o seletor "Outros idiomas" levando à outra tradução, e que um post só-rascunho dá 404. Se houver post em `ar`, confirmar `dir="rtl"`.

- [ ] **Step 4: Commit**

```bash
git add "app/(marketplace)/blog/[locale]/[slug]/page.tsx" components/blog/language-switcher.tsx
git commit -m "feat(blog): página pública do post com seletor de idioma e RTL"
```

---

### Task 13: `/blog` → redirect por Accept-Language

**Files:**
- Create: `app/(marketplace)/blog/page.tsx`

**Interfaces:**
- Consumes: `BLOG_LOCALES`, `DEFAULT_BLOG_LOCALE`, `isBlogLocale` (Task 1).

- [ ] **Step 1: Implementar redirect**

```tsx
// app/(marketplace)/blog/page.tsx
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { BLOG_LOCALES, DEFAULT_BLOG_LOCALE, isBlogLocale } from "@/lib/blog/locales"

export default async function BlogRootPage() {
    const accept = (await headers()).get("accept-language") ?? ""
    const preferred = accept
        .split(",")
        .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
        .find((code) => isBlogLocale(code) && (BLOG_LOCALES as readonly string[]).includes(code))

    redirect(`/blog/${preferred ?? DEFAULT_BLOG_LOCALE}`)
}
```

- [ ] **Step 2: Typecheck + navegador**

Run: `npx tsc --noEmit -p tsconfig.json` (exit 0).
No navegador: acessar `/blog` e confirmar o redirect para `/blog/pt` (ou o idioma do navegador, se suportado).

- [ ] **Step 3: Commit**

```bash
git add "app/(marketplace)/blog/page.tsx"
git commit -m "feat(blog): /blog redireciona pelo idioma do navegador"
```

---

### Task 14: Integrações — teaser da landing + sitemap

**Files:**
- Modify: `components/landing/blog-teaser-section.tsx` (buscar posts reais; cards viram links)
- Modify: `messages/pt.json` e `messages/de.json` (remover `landing.blog.posts` e `_placeholder`; manter `eyebrow`/`title`/`intro`)
- Modify: `app/sitemap.ts` (incluir posts publicados + índices por locale)

**Interfaces:**
- Consumes: `getLatestPostsForTeaser` (Task 6); `LandingLocale` já mapeia para `BlogLocale` (`pt`/`de` são subconjunto).

- [ ] **Step 1: Teaser busca posts reais**

Substituir o corpo de `components/landing/blog-teaser-section.tsx` para buscar do banco; se não houver posts, esconder o grid:

```tsx
// components/landing/blog-teaser-section.tsx
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { getLatestPostsForTeaser } from "@/lib/blog/queries"
import type { LandingLocale } from "./types"

export async function BlogTeaserSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.blog" })
    const posts = await getLatestPostsForTeaser(locale, 3)

    return (
        <section className="bg-gray-50 py-14 md:py-18">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">{t("eyebrow")}</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">{t("title")}</h2>
                    <p className="mt-4 text-sm leading-6 text-gray-600 md:text-base md:leading-7">{t("intro")}</p>
                </div>

                {posts.length > 0 && (
                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                        {posts.map((post) => (
                            <Link key={post.postId} href={`/blog/${locale}/${post.slug}`}
                                className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                {post.coverImageUrl
                                    ? <img src={post.coverImageUrl} alt="" className="h-28 w-full object-cover" />
                                    : <div className="h-28 bg-gradient-to-br from-indigo-100 to-indigo-200" />}
                                <div className="p-5">
                                    {post.categoryName && <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">{post.categoryName}</p>}
                                    <h3 className="mt-2 font-semibold leading-snug text-gray-950 group-hover:text-indigo-700">{post.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-gray-500">{post.excerpt}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link href={`/blog/${locale}`} className="text-sm font-semibold text-indigo-700 hover:underline">
                        {t("title")} →
                    </Link>
                </div>
            </div>
        </section>
    )
}
```

- [ ] **Step 2: Remover placeholders dos message files**

Em `messages/pt.json` e `messages/de.json`, dentro de `landing.blog`, remover as chaves `_placeholder` e `posts` (manter `eyebrow`, `title`, `intro`).

- [ ] **Step 3: Sitemap inclui o blog**

Em `app/sitemap.ts`, antes do `return`, adicionar a busca de posts publicados e mapear para URLs com hreflang. Dentro do `try`, após montar `listRoutes`:

```ts
        const now = new Date()
        const blogPosts = await prisma.blogPost.findMany({
            where: { status: "PUBLISHED", publishedAt: { lte: now } },
            select: { updatedAt: true, translations: { select: { locale: true, slug: true } } },
            take: 2000,
        })

        const blogRoutes = blogPosts.flatMap((post) => {
            const languages = Object.fromEntries(
                post.translations.map((t) => [t.locale, `${BASE_URL}/blog/${t.locale}/${t.slug}`])
            )
            return post.translations.map((t) => ({
                url: `${BASE_URL}/blog/${t.locale}/${t.slug}`,
                lastModified: post.updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.6,
                alternates: { languages },
            }))
        })

        const blogIndexRoutes = ["pt", "de", "en", "es", "fr", "ar", "it", "nl"].map((locale) => ({
            url: `${BASE_URL}/blog/${locale}`,
            lastModified: now,
            changeFrequency: "weekly" as const,
            priority: 0.5,
        }))

        return [...staticRoutes, ...listRoutes, ...blogIndexRoutes, ...blogRoutes]
```

- [ ] **Step 4: Typecheck + navegador**

Run: `npx tsc --noEmit -p tsconfig.json` (exit 0).
No navegador: recarregar `/` e confirmar que a seção de blog mostra o post real criado, com card clicável levando a `/blog/pt/<slug>`; acessar `/sitemap.xml` e confirmar as URLs do blog.

- [ ] **Step 5: Commit**

```bash
git add components/landing/blog-teaser-section.tsx messages/pt.json messages/de.json app/sitemap.ts
git commit -m "feat(blog): teaser da landing com posts reais e sitemap do blog"
```

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura da spec:**
- 8 locales / fonte única → Task 1. Slug/RTL → Tasks 1,2. Rótulos 8 idiomas → Task 3. Schemas + regra publicar → Task 4. Modelo/migração + RESTRICT/SET NULL → Task 5. Visibilidade sem cron → Task 6 (`publishedWhere`) e Task 12 (revalida no fetch). Upload capa → Task 7. Actions admin (CRUD + sanitize + requireAdmin) → Task 8. Admin lista/categorias/sidebar → Task 9. Editor abas por idioma + agendamento → Task 10. Índice público + filtro → Task 11. Post + seletor idioma + RTL + SEO/OG → Task 12. `/blog` Accept-Language → Task 13. Teaser real + proxy público + sitemap hreflang → Tasks 11 (proxy) e 14. Todos os itens da spec têm task.
- **Fora de escopo** (comentários, RSS, busca, chrome além de PT/DE) permanecem fora — ok.

**Placeholders:** nenhum "TBD/TODO"; todo passo de código tem código real.

**Consistência de tipos:** `BlogLocale`, `slugify`, `getBlogLabels`, `getPublishedPostsForLocale`, `getPostBySlug`, `getLatestPostsForTeaser`, `uploadBlogImage`, actions `createPost/updatePost/...` usados com as mesmas assinaturas entre tasks. A chave composta `locale_slug` do Prisma é sinalizada como "confirmar nome gerado".
