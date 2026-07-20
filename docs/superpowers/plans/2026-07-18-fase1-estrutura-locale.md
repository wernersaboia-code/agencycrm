# Fase 1 — Unificação de locales e rotas por idioma

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar os dois sistemas de locale do projeto e mover funil e blog para `app/[locale]/`, sem alterar nenhuma URL existente nem o comportamento visível.

**Architecture:** `lib/blog/locales.ts` (que já declara os 8 idiomas e resolve RTL) é promovido a `lib/i18n/locales.ts` e passa a servir blog e funil. O next-intl assume o roteamento via `defineRouting` com `localePrefix: "as-needed"`, o middleware de auth passa a reconhecer rotas com prefixo de idioma, e a resolução por cookie é aposentada em favor do segmento de URL.

**Tech Stack:** Next.js 16 (App Router, Turbopack), next-intl, Prisma, Supabase Auth, Vitest, Tailwind v4.

## Global Constraints

- Locales, em ordem: `pt` (padrão), `de`, `en`, `es`, `fr`, `ar`, `it`, `nl` — valores exatos de `lib/blog/locales.ts`.
- `localePrefix: "as-needed"` — o locale padrão (`pt`) **não** recebe prefixo. `/catalog` continua PT; `/de/catalog` é a versão alemã.
- **Nenhuma URL existente pode mudar** nesta fase: `/`, `/faq`, `/de`, `/de/faq`, `/catalog`, `/cart`, `/checkout`, `/list/[slug]`, `/my-purchases`. A única migração de URL permitida é a do blog (`/blog/de` → `/de/blog`), segura porque o blog está vazio.
- Fase 1 **não adiciona idioma novo ao funil**: `messages/` continua com `pt.json` e `de.json`. Um locale sem arquivo de mensagens deve cair no padrão, não quebrar.
- `app/(crm)`, `app/super-admin` e `app/api` ficam fora do segmento `[locale]` e intocados.
- Comentários e mensagens de commit em português, seguindo o repositório.

---

### Task 1: Promover o módulo de locales

Hoje há duas fontes de verdade: `lib/blog/locales.ts` (8 locales, com RTL) e `lib/i18n/resolve-locale.ts` (2 locales, type guard manual). Esta task cria a fonte única sem quebrar os ~10 arquivos que já importam do caminho do blog.

**Files:**
- Create: `lib/i18n/locales.ts`
- Create: `lib/i18n/locales.test.ts`
- Modify: `lib/blog/locales.ts` (vira reexport)
- Test: `lib/blog/locales.test.ts` (deve continuar passando sem alteração)

**Interfaces:**
- Consumes: nada (primeira task)
- Produces: `LOCALES: readonly Locale[]`, `type Locale`, `DEFAULT_LOCALE: Locale`, `isLocale(v: string): v is Locale`, `isRtlLocale(l: Locale): boolean`, `dirForLocale(l: Locale): "rtl" | "ltr"`, `htmlLangFor(l: Locale): string`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/i18n/locales.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
    LOCALES,
    DEFAULT_LOCALE,
    isLocale,
    isRtlLocale,
    dirForLocale,
    htmlLangFor,
} from "./locales"

describe("locales", () => {
    it("declara os 8 idiomas do projeto, com pt primeiro", () => {
        expect(LOCALES).toEqual(["pt", "de", "en", "es", "fr", "ar", "it", "nl"])
        expect(DEFAULT_LOCALE).toBe("pt")
    })

    it("reconhece locale válido e rejeita desconhecido", () => {
        expect(isLocale("ar")).toBe(true)
        expect(isLocale("pt-BR")).toBe(false)
        expect(isLocale("")).toBe(false)
    })

    it("marca apenas o árabe como RTL", () => {
        expect(isRtlLocale("ar")).toBe(true)
        expect(dirForLocale("ar")).toBe("rtl")
        for (const l of LOCALES.filter((x) => x !== "ar")) {
            expect(dirForLocale(l)).toBe("ltr")
        }
    })

    it("devolve tag BCP 47 com região para Intl", () => {
        expect(htmlLangFor("pt")).toBe("pt-BR")
        expect(htmlLangFor("de")).toBe("de-DE")
        expect(htmlLangFor("ar")).toBe("ar")
    })
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run lib/i18n/locales.test.ts`
Expected: FAIL — `Cannot find module './locales'`

- [ ] **Step 3: Implementar o módulo**

Criar `lib/i18n/locales.ts`:

```ts
export const LOCALES = ["pt", "de", "en", "es", "fr", "ar", "it", "nl"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "pt"

const RTL_LOCALES = new Set<Locale>(["ar"])

// Tags BCP 47 para o atributo `lang` e para as APIs Intl, que precisam da
// região — "pt" sozinho não define separador decimal nem formato de data.
const HTML_LANG: Record<Locale, string> = {
    pt: "pt-BR",
    de: "de-DE",
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    ar: "ar",
    it: "it-IT",
    nl: "nl-NL",
}

export function isLocale(value: string): value is Locale {
    return (LOCALES as readonly string[]).includes(value)
}

export function isRtlLocale(locale: Locale): boolean {
    return RTL_LOCALES.has(locale)
}

export function dirForLocale(locale: Locale): "rtl" | "ltr" {
    return isRtlLocale(locale) ? "rtl" : "ltr"
}

export function htmlLangFor(locale: Locale): string {
    return HTML_LANG[locale]
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npx vitest run lib/i18n/locales.test.ts`
Expected: PASS — 4 testes

- [ ] **Step 5: Converter `lib/blog/locales.ts` em reexport**

Substituir todo o conteúdo por:

```ts
// Mantido como reexport para não quebrar de uma vez os arquivos do blog que
// importam daqui. A fonte única é lib/i18n/locales.ts.
export {
    LOCALES as BLOG_LOCALES,
    DEFAULT_LOCALE as DEFAULT_BLOG_LOCALE,
    isLocale as isBlogLocale,
    isRtlLocale,
    dirForLocale,
} from "@/lib/i18n/locales"

export type { Locale as BlogLocale } from "@/lib/i18n/locales"
```

- [ ] **Step 6: Confirmar que o teste antigo do blog continua verde**

Run: `npx vitest run lib/blog/locales.test.ts lib/i18n/locales.test.ts`
Expected: PASS nos dois arquivos

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 8: Commit**

```bash
git add lib/i18n/locales.ts lib/i18n/locales.test.ts lib/blog/locales.ts
git commit -m "refactor(i18n): promove locales do blog a fonte única do projeto"
```

---

### Task 2: Configurar o roteamento do next-intl

**Files:**
- Create: `lib/i18n/routing.ts`
- Create: `lib/i18n/navigation.ts`
- Create: `lib/i18n/routing.test.ts`
- Modify: `i18n/request.ts`

**Interfaces:**
- Consumes: `LOCALES`, `DEFAULT_LOCALE`, `isLocale` de `lib/i18n/locales.ts`
- Produces: `routing` (objeto de `defineRouting`); `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname` de `lib/i18n/navigation.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/i18n/routing.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { routing } from "./routing"

describe("routing", () => {
    it("usa pt como padrão sem prefixo", () => {
        expect(routing.defaultLocale).toBe("pt")
        expect(routing.localePrefix).toBe("as-needed")
    })

    it("expõe os 8 locales", () => {
        expect(routing.locales).toEqual(["pt", "de", "en", "es", "fr", "ar", "it", "nl"])
    })
})
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run lib/i18n/routing.test.ts`
Expected: FAIL — módulo inexistente

- [ ] **Step 3: Implementar o routing**

Criar `lib/i18n/routing.ts`:

```ts
import { defineRouting } from "next-intl/routing"
import { LOCALES, DEFAULT_LOCALE } from "./locales"

export const routing = defineRouting({
    locales: LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    // O locale padrão não recebe prefixo: "/catalog" é PT, "/de/catalog" é DE.
    // Preserva todas as URLs já indexadas.
    localePrefix: "as-needed",
})
```

Criar `lib/i18n/navigation.ts`:

```ts
import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

// Wrappers cientes de locale: Link e redirect preservam o idioma atual sem
// que cada chamada precise montar o prefixo à mão.
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing)
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run: `npx vitest run lib/i18n/routing.test.ts`
Expected: PASS — 2 testes

- [ ] **Step 5: Reescrever `i18n/request.ts` para resolver por rota**

Substituir todo o conteúdo de `i18n/request.ts` por:

```ts
import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { routing } from "@/lib/i18n/routing"

// O locale agora vem do segmento de rota ([locale]), não mais de cookie.
// Locale ausente ou desconhecido cai no padrão em vez de quebrar a página.
export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale
    const locale = hasLocale(routing.locales, requested)
        ? requested
        : routing.defaultLocale

    // Fase 1: só pt e de têm arquivo de mensagens. Os demais locales existem
    // no roteamento (o blog já os usa) mas ainda não têm tradução do funil —
    // até a fase 3, caem no padrão em vez de estourar no import.
    const messagesLocale = locale === "de" ? "de" : "pt"

    return {
        locale,
        messages: (await import(`../messages/${messagesLocale}.json`)).default,
    }
})
```

- [ ] **Step 6: Typecheck e suíte**

Run: `npx tsc --noEmit && npx vitest run`
Expected: exit 0; todos os testes passando

- [ ] **Step 7: Commit**

```bash
git add lib/i18n/routing.ts lib/i18n/navigation.ts lib/i18n/routing.test.ts i18n/request.ts
git commit -m "feat(i18n): configura roteamento por locale com as-needed"
```

---

### Task 3: Compor o middleware de locale com o de autenticação

`proxy.ts` casa rotas públicas por caminho literal (`"/"`, `"/de"`, `"/catalog"`, `"/blog"`…). Com prefixo de idioma, `/de/catalog` deixaria de ser reconhecida como rota de marketplace e cairia no gate de auth. Esta task torna o casamento ciente de locale e encadeia o middleware do next-intl.

**Files:**
- Create: `lib/i18n/strip-locale.ts`
- Create: `lib/i18n/strip-locale.test.ts`
- Modify: `proxy.ts`

**Interfaces:**
- Consumes: `LOCALES`, `isLocale` de `lib/i18n/locales.ts`; `routing` de `lib/i18n/routing.ts`
- Produces: `stripLocale(pathname: string): { locale: Locale; pathname: string }`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/i18n/strip-locale.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { stripLocale } from "./strip-locale"

describe("stripLocale", () => {
    it("remove o prefixo de idioma e devolve o locale", () => {
        expect(stripLocale("/de/catalog")).toEqual({ locale: "de", pathname: "/catalog" })
        expect(stripLocale("/ar/blog")).toEqual({ locale: "ar", pathname: "/blog" })
    })

    it("trata a raiz do idioma como caminho raiz", () => {
        expect(stripLocale("/de")).toEqual({ locale: "de", pathname: "/" })
    })

    it("assume o padrão quando não há prefixo", () => {
        expect(stripLocale("/catalog")).toEqual({ locale: "pt", pathname: "/catalog" })
        expect(stripLocale("/")).toEqual({ locale: "pt", pathname: "/" })
    })

    it("não confunde segmento parecido com locale", () => {
        // "/list" começa com "l" mas não é locale; "/it" é.
        expect(stripLocale("/list/abc")).toEqual({ locale: "pt", pathname: "/list/abc" })
        expect(stripLocale("/it/list/abc")).toEqual({ locale: "it", pathname: "/list/abc" })
    })
})
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run lib/i18n/strip-locale.test.ts`
Expected: FAIL — módulo inexistente

- [ ] **Step 3: Implementar**

Criar `lib/i18n/strip-locale.ts`:

```ts
import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales"

/**
 * Separa o prefixo de idioma do restante do caminho.
 *
 * O middleware de auth casa rotas públicas por caminho literal; sem isto,
 * "/de/catalog" não seria reconhecida como a mesma rota que "/catalog".
 */
export function stripLocale(pathname: string): { locale: Locale; pathname: string } {
    const segments = pathname.split("/")
    const first = segments[1] ?? ""

    if (!isLocale(first)) {
        return { locale: DEFAULT_LOCALE, pathname }
    }

    const rest = "/" + segments.slice(2).join("/")
    return { locale: first, pathname: rest === "/" ? "/" : rest.replace(/\/$/, "") }
}
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run: `npx vitest run lib/i18n/strip-locale.test.ts`
Expected: PASS — 4 testes

- [ ] **Step 5: Encadear o middleware do next-intl em `proxy.ts`**

No topo de `proxy.ts`, adicionar aos imports existentes:

```ts
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "@/lib/i18n/routing"
import { stripLocale } from "@/lib/i18n/strip-locale"

const intlMiddleware = createIntlMiddleware(routing)
```

Logo após `const pathname = request.nextUrl.pathname` (linha 7), inserir:

```ts
    // Rotas públicas e gates de auth são avaliados sobre o caminho sem o
    // prefixo de idioma — senão "/de/catalog" cairia no gate de sessão.
    const { pathname: pathForMatching } = stripLocale(pathname)
```

Trocar **todos** os usos subsequentes de `pathname` no casamento de rotas por `pathForMatching`. Os pontos são: o `isMarketplaceRoute` (linha ~57), o `isAuthRoute`, a lista `allowedRedirects` e o fallback do `catch` que testa `pathname.startsWith('/crm')`.

Manter `pathname` (com prefixo) nos lugares onde a URL real importa: a construção de `originalTarget` para o parâmetro `redirect`.

- [ ] **Step 6: Delegar ao middleware de locale antes de devolver**

Substituir o `return supabaseResponse` final (última linha da função `proxy`) por:

```ts
    // O middleware de locale precisa rodar por último: ele pode reescrever a
    // URL (prefixo as-needed) e precisa dos cookies de sessão já aplicados.
    const intlResponse = intlMiddleware(request)
    for (const cookie of supabaseResponse.cookies.getAll()) {
        intlResponse.cookies.set(cookie)
    }
    return intlResponse
```

- [ ] **Step 7: Ampliar o matcher para excluir o que não deve passar**

Substituir o bloco `export const config` no fim de `proxy.ts` por:

```ts
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
}
```

(inalterado — registrado aqui para deixar explícito que `api` e estáticos continuam fora do roteamento de locale)

- [ ] **Step 8: Typecheck e suíte**

Run: `npx tsc --noEmit && npx vitest run`
Expected: exit 0; todos os testes passando

- [ ] **Step 9: Commit**

```bash
git add lib/i18n/strip-locale.ts lib/i18n/strip-locale.test.ts proxy.ts
git commit -m "feat(i18n): middleware reconhece rotas com prefixo de idioma"
```

---

### Task 4: Mover o funil para `app/[locale]/`

Movimentação mecânica. O risco é esquecer um arquivo, então a verificação é o build.

**Files:**
- Move: todo o conteúdo de `app/(marketplace)/` para `app/[locale]/`
- Delete: `app/de/page.tsx`, `app/de/faq/page.tsx`, `app/de/layout.tsx`
- Modify: `app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `routing` (Task 2), `dirForLocale`/`htmlLangFor` (Task 1)
- Produces: rotas `app/[locale]/*` servindo os 8 locales

- [ ] **Step 1: Mover a árvore do marketplace**

```bash
git mv "app/(marketplace)" "app/[locale]"
```

- [ ] **Step 2: Remover a árvore alemã duplicada**

As páginas de `app/de/` existiam só para dar rota própria ao alemão; o segmento `[locale]` cobre isso.

```bash
git rm -r app/de
```

- [ ] **Step 3: Fazer o layout receber e validar o locale**

Em `app/[locale]/layout.tsx`, substituir a assinatura e o corpo do componente. O layout hoje chama `getLocale()`; passa a receber `params`:

```tsx
import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { routing } from "@/lib/i18n/routing"
import type { Locale } from "@/lib/i18n/locales"

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }))
}

export default async function MarketplaceLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    if (!hasLocale(routing.locales, locale)) notFound()

    // Sem isto as páginas do segmento viram dinâmicas e perdem o ISR.
    setRequestLocale(locale)

    const messages = await getMessages()

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {/* restante do JSX atual do layout, inalterado:
                CartProvider > div.min-h-screen > Suspense/MarketplaceHeader,
                main#main-content, MarketplaceFooter, CartDrawer */}
        </NextIntlClientProvider>
    )
}
```

Ajustar `MarketplaceFooter` para receber `locale={locale as Locale}` em vez do valor de `getLocale()`.

- [ ] **Step 4: Aplicar `lang` e `dir` no root layout**

Em `app/layout.tsx`, o `<html>` hoje fixa `lang="pt-BR"`. Como o root layout não recebe `params` do segmento, a direção passa a ser aplicada no layout do locale. Adicionar, no `app/[locale]/layout.tsx`, um wrapper dentro do provider:

```tsx
<div dir={dirForLocale(locale)}>
```

com `import { dirForLocale } from "@/lib/i18n/locales"`.

O atributo `lang` do `<html>` fica como está nesta task; a Task 7 remove o `HtmlLang` e resolve o `lang` corretamente.

- [ ] **Step 5: Build para achar imports quebrados**

Run: `npm run build`
Expected: pode falhar. Cada erro aponta um import relativo que mudou de profundidade ou uma referência a `app/de`. Corrigir e repetir até exit 0.

- [ ] **Step 6: Verificar que as URLs não mudaram**

```bash
npm run dev &
sleep 8
for p in / /faq /de /de/faq /catalog /de/catalog /cart; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001$p)  $p"
done
```

Expected: `200` em todas. `/de/catalog` é nova e deve responder 200 — antes era 404.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(i18n): move funil para app/[locale]"
```

---

### Task 5: Mover o blog para `app/[locale]/blog/`

Resolve a colisão de parâmetro duplicado. Seguro porque o blog está vazio.

**Files:**
- Move: `app/[locale]/blog/[locale]/page.tsx` → `app/[locale]/blog/page.tsx`
- Move: `app/[locale]/blog/[locale]/[slug]/page.tsx` → `app/[locale]/blog/[slug]/page.tsx`
- Delete: `app/[locale]/blog/page.tsx` (o redirecionador por `accept-language`)
- Modify: `components/blog/language-switcher.tsx`

**Interfaces:**
- Consumes: `Locale`, `dirForLocale` (Task 1); segmento `[locale]` (Task 4)
- Produces: rotas `/{locale}/blog` e `/{locale}/blog/{slug}`

- [ ] **Step 1: Remover o redirecionador por accept-language**

Após a Task 4 ele vive em `app/[locale]/blog/page.tsx` e existia só para escolher um idioma quando a URL não trazia nenhum. O segmento `[locale]` agora sempre traz.

```bash
git rm "app/[locale]/blog/page.tsx"
```

- [ ] **Step 2: Promover as páginas do segmento interno**

```bash
git mv "app/[locale]/blog/[locale]/page.tsx" "app/[locale]/blog/page.tsx"
git mv "app/[locale]/blog/[locale]/[slug]/page.tsx" "app/[locale]/blog/[slug]/page.tsx"
rmdir "app/[locale]/blog/[locale]"
```

- [ ] **Step 3: Ajustar as páginas para o novo formato de params**

Em `app/[locale]/blog/page.tsx`, o `params` agora vem do segmento externo — a assinatura não muda (continua `{ locale: string }`), mas o `generateStaticParams` local deve ser **removido**, porque o layout do locale já o define. Apagar:

```tsx
export function generateStaticParams() {
    return BLOG_LOCALES.map((locale) => ({ locale }))
}
```

Em `app/[locale]/blog/[slug]/page.tsx`, o `params` passa a ser `Promise<{ locale: string; slug: string }>` — verificar se já é, e ajustar se não for.

- [ ] **Step 4: Apontar o seletor de idioma do blog para as novas URLs**

Em `components/blog/language-switcher.tsx`, trocar a montagem de href de `/blog/${locale}` para `/${locale}/blog` — e, para o locale padrão, `/blog` (sem prefixo, por causa do `as-needed`). Usar o helper:

```tsx
import { DEFAULT_LOCALE } from "@/lib/i18n/locales"

const hrefFor = (locale: string, slug?: string) => {
    const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`
    return slug ? `${prefix}/blog/${slug}` : `${prefix}/blog`
}
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: exit 0. Se acusar "You cannot have two parallel pages that resolve to the same path", sobrou um arquivo em `app/[locale]/blog/[locale]/`.

- [ ] **Step 6: Verificar as rotas do blog**

```bash
npm run dev &
sleep 8
for p in /blog /de/blog /ar/blog; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001$p)  $p"
done
```

Expected: `200` nas três. Listagem vazia é o esperado — não há posts.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(i18n): move blog para app/[locale]/blog"
```

---

### Task 6: Trocar de idioma por substituição de segmento

Aposenta os mapas par a par.

**Files:**
- Modify: `components/marketplace/locale-switcher.tsx`
- Delete: `lib/i18n/locale-routes.ts`, `lib/i18n/locale-routes.test.ts`

**Interfaces:**
- Consumes: `usePathname`/`useRouter` de `lib/i18n/navigation.ts` (Task 2); `LOCALES` (Task 1)
- Produces: nenhum export novo

- [ ] **Step 1: Reescrever o seletor**

Substituir o corpo de `components/marketplace/locale-switcher.tsx`. Os imports de `setLocaleCookie` e `localeTargetPath` saem; entram os wrappers de navegação:

```tsx
"use client"

import { Globe2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/lib/i18n/navigation"
import { LOCALES, type Locale } from "@/lib/i18n/locales"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LocaleSwitcher() {
    const locale = useLocale()
    // usePathname do wrapper devolve o caminho SEM o prefixo de idioma, então
    // trocar de idioma é só re-renderizar a mesma rota no outro locale.
    const pathname = usePathname()
    const router = useRouter()
    const t = useTranslations("nav")

    const switchTo = (target: Locale) => {
        if (target === locale) return
        router.replace(pathname, { locale: target })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label={t("language")}>
                    <Globe2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase">{locale}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {LOCALES.map((l) => (
                    <DropdownMenuItem key={l} onClick={() => switchTo(l)}>
                        {l.toUpperCase()}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
```

- [ ] **Step 2: Remover os mapas par a par**

```bash
git rm lib/i18n/locale-routes.ts lib/i18n/locale-routes.test.ts
```

- [ ] **Step 3: Confirmar que nada mais importa o módulo removido**

Run: `grep -rn "locale-routes\|localeTargetPath" app components lib --include=*.ts --include=*.tsx`
Expected: nenhuma saída

- [ ] **Step 4: Typecheck e suíte**

Run: `npx tsc --noEmit && npx vitest run`
Expected: exit 0; testes passando

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(i18n): troca de idioma por segmento, remove mapas par a par"
```

---

### Task 7: Aposentar a resolução por cookie

O cookie era o mecanismo de idioma quando não havia locale na URL. Agora há.

**Files:**
- Delete: `components/marketplace/sync-locale-cookie.tsx`, `components/marketplace/html-lang.tsx`, `actions/locale.ts`, `lib/i18n/resolve-locale.ts`, `lib/i18n/resolve-locale.test.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `htmlLangFor` (Task 1)
- Produces: nenhum export novo

- [ ] **Step 1: Localizar todos os consumidores**

Run: `grep -rn "SyncLocaleCookie\|HtmlLang\|setLocaleCookie\|resolveSiteLocale\|SITE_LOCALES\|NEXT_LOCALE" app components lib actions --include=*.ts --include=*.tsx`

Anotar cada ocorrência: todas serão removidas nos passos seguintes.

- [ ] **Step 2: Remover os componentes e a action**

```bash
git rm components/marketplace/sync-locale-cookie.tsx components/marketplace/html-lang.tsx actions/locale.ts lib/i18n/resolve-locale.ts lib/i18n/resolve-locale.test.ts
```

- [ ] **Step 3: Remover as referências restantes**

Apagar os imports e usos de `<SyncLocaleCookie />` e `<HtmlLang />` nos layouts e páginas que a busca do Step 1 apontou.

- [ ] **Step 4: Resolver `lang` e `dir` no root layout**

`app/layout.tsx` fixa `lang="pt-BR"`. O root layout não recebe o segmento `[locale]`, então lê o locale resolvido pelo middleware:

```tsx
import { getLocale } from "next-intl/server"
import { htmlLangFor, dirForLocale, type Locale } from "@/lib/i18n/locales"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const locale = (await getLocale()) as Locale

    return (
        <html lang={htmlLangFor(locale)} dir={dirForLocale(locale)} suppressHydrationWarning>
            {/* restante inalterado */}
        </html>
    )
}
```

- [ ] **Step 5: Remover o wrapper de direção da Task 4**

Com `dir` no `<html>`, o `<div dir={...}>` que a Task 4 adicionou em `app/[locale]/layout.tsx` vira redundante. Remover esse wrapper, mantendo os filhos.

Run: `grep -n "dirForLocale" "app/[locale]/layout.tsx"`
Expected: nenhuma saída

- [ ] **Step 6: Confirmar que o cookie sumiu do código**

Run: `grep -rn "NEXT_LOCALE" app components lib actions --include=*.ts --include=*.tsx`
Expected: nenhuma saída

- [ ] **Step 7: Typecheck, suíte e build**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: exit 0 nos três

- [ ] **Step 8: Verificar `lang` e `dir` no navegador**

```bash
npm run dev &
sleep 8
curl -s http://localhost:3001/de | grep -o '<html[^>]*>' | head -1
curl -s http://localhost:3001/ar/blog | grep -o '<html[^>]*>' | head -1
```

Expected: `lang="de-DE" dir="ltr"` na primeira; `lang="ar" dir="rtl"` na segunda.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(i18n): aposenta resolução de idioma por cookie"
```

---

### Task 8: Metadados de SEO por idioma

O ganho que motiva o projeto. Sem isto, as URLs novas existem mas o buscador não sabe que são traduções umas das outras.

**Files:**
- Create: `lib/i18n/alternates.ts`
- Create: `lib/i18n/alternates.test.ts`
- Modify: `app/sitemap.ts`
- Modify: `app/[locale]/page.tsx`, `app/[locale]/faq/page.tsx`, `app/[locale]/catalog/page.tsx`

**Interfaces:**
- Consumes: `LOCALES`, `DEFAULT_LOCALE`, `htmlLangFor` (Task 1)
- Produces: `alternatesFor(path: string): { canonical: string; languages: Record<string, string> }`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/i18n/alternates.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { alternatesFor } from "./alternates"

describe("alternatesFor", () => {
    it("gera uma entrada por idioma mais x-default", () => {
        const { languages } = alternatesFor("/catalog")
        expect(Object.keys(languages)).toHaveLength(9) // 8 idiomas + x-default
        expect(languages["x-default"]).toMatch(/\/catalog$/)
    })

    it("não prefixa o idioma padrão", () => {
        const { languages } = alternatesFor("/catalog")
        expect(languages["pt-BR"]).toMatch(/\/catalog$/)
        expect(languages["pt-BR"]).not.toMatch(/\/pt\//)
        expect(languages["de-DE"]).toMatch(/\/de\/catalog$/)
    })

    it("canonical aponta para o próprio idioma", () => {
        expect(alternatesFor("/catalog", "de").canonical).toMatch(/\/de\/catalog$/)
        expect(alternatesFor("/catalog", "pt").canonical).toMatch(/\/catalog$/)
    })

    it("trata a raiz sem barra dupla", () => {
        const { languages } = alternatesFor("/")
        expect(languages["de-DE"]).toMatch(/\/de$/)
        expect(languages["de-DE"]).not.toMatch(/\/\/$/)
    })
})
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run lib/i18n/alternates.test.ts`
Expected: FAIL — módulo inexistente

- [ ] **Step 3: Implementar**

Criar `lib/i18n/alternates.ts`:

```ts
import { LOCALES, DEFAULT_LOCALE, htmlLangFor, type Locale } from "./locales"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://easyprospect.com"

function urlFor(path: string, locale: Locale): string {
    const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`
    const clean = path === "/" ? "" : path
    return `${BASE_URL}${prefix}${clean}` || BASE_URL
}

/**
 * hreflang de mão dupla: cada idioma lista todos os outros, e x-default
 * aponta para o padrão. Sem isto o Google trata as traduções como páginas
 * concorrentes em vez de variantes.
 */
export function alternatesFor(path: string, current: Locale = DEFAULT_LOCALE) {
    const languages: Record<string, string> = {}
    for (const locale of LOCALES) {
        languages[htmlLangFor(locale)] = urlFor(path, locale)
    }
    languages["x-default"] = urlFor(path, DEFAULT_LOCALE)

    return { canonical: urlFor(path, current), languages }
}
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run: `npx vitest run lib/i18n/alternates.test.ts`
Expected: PASS — 4 testes

- [ ] **Step 5: Emitir os alternates nas páginas principais**

Em `app/[locale]/page.tsx`, `app/[locale]/faq/page.tsx` e `app/[locale]/catalog/page.tsx`, dentro do `generateMetadata` existente, adicionar ao objeto retornado:

```ts
alternates: alternatesFor("/", locale),   // "/faq" e "/catalog" nas outras
```

com `import { alternatesFor } from "@/lib/i18n/alternates"`. O `locale` vem de `params`, já disponível nessas funções após a Task 4.

- [ ] **Step 6: Gerar o sitemap com as 8 variantes**

Substituir o array `staticRoutes` de `app/sitemap.ts` por geração a partir da lista de rotas:

```ts
import type { MetadataRoute } from "next"
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/locales"
import { alternatesFor } from "@/lib/i18n/alternates"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://easyprospect.com"

const ROUTES: { path: string; changeFrequency: "daily" | "weekly" | "monthly"; priority: number }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/catalog", changeFrequency: "daily", priority: 0.9 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    return ROUTES.flatMap((route) =>
        LOCALES.map((locale) => {
            const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`
            const clean = route.path === "/" ? "" : route.path
            return {
                url: `${BASE_URL}${prefix}${clean}` || BASE_URL,
                lastModified: new Date(),
                changeFrequency: route.changeFrequency,
                priority: route.priority,
                alternates: { languages: alternatesFor(route.path).languages },
            }
        })
    )
}
```

Preservar quaisquer rotas dinâmicas que o sitemap atual gere abaixo do bloco estático.

- [ ] **Step 7: Verificar o sitemap gerado**

```bash
npm run dev &
sleep 8
curl -s http://localhost:3001/sitemap.xml | grep -c "<url>"
curl -s http://localhost:3001/sitemap.xml | grep -o 'hreflang="[^"]*"' | sort -u
```

Expected: 32 entradas (4 rotas × 8 idiomas); hreflangs cobrindo os 8 idiomas mais `x-default`.

- [ ] **Step 8: Verificação final da fase**

Run: `npx tsc --noEmit && npm run lint && npx vitest run && npm run build`
Expected: exit 0 em todos; lint sem erros novos (os 5 warnings pré-existentes permanecem)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(seo): hreflang e sitemap por idioma"
```

---

## Verificação de aceite da fase

Antes de abrir o PR, confirmar cada item:

- [ ] `/`, `/faq`, `/de`, `/de/faq`, `/catalog`, `/cart`, `/list/<slug>` respondem 200 e mostram o mesmo conteúdo de antes
- [ ] `/de/catalog`, `/de/cart` respondem 200 (rotas novas)
- [ ] `/blog`, `/de/blog`, `/ar/blog` respondem 200
- [ ] `/ar/blog` traz `dir="rtl"` no HTML
- [ ] `/de` traz `lang="de-DE"`
- [ ] O seletor de idioma no header troca de idioma mantendo a rota
- [ ] `/checkout` e `/my-purchases` continuam exigindo sessão, com e sem prefixo de idioma
- [ ] `grep -rn "NEXT_LOCALE\|locale-routes" app components lib actions` não retorna nada
- [ ] `curl -s localhost:3001/sitemap.xml | grep -c "<url>"` retorna 32
