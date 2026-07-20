# Task 7: Aposentar a resolução por cookie — Relatório

## Resumo

Removida a resolução de idioma por cookie (`NEXT_LOCALE`), obsoleta desde que o
idioma passou a vir do segmento de URL `[locale]`. O `lang`/`dir` do `<html>`
agora são resolvidos no root layout via `getLocale()` (next-intl) + as funções
de `lib/i18n/locales.ts`, e o wrapper `<div dir={...}>` redundante no layout
do funil foi removido.

## Arquivos removidos

- `components/marketplace/sync-locale-cookie.tsx`
- `components/marketplace/html-lang.tsx`
- `actions/locale.ts`
- `lib/i18n/resolve-locale.ts`
- `lib/i18n/resolve-locale.test.ts`

Confirmado por grep antes da remoção: `setLocaleCookie` não tinha nenhum
chamador fora da própria `actions/locale.ts` (o seletor de idioma já havia
parado de usá-lo na Task 6).

## Arquivos modificados

- `app/layout.tsx`: troca `toHtmlLang` (de `resolve-locale.ts`, removido) por
  `htmlLangFor`/`dirForLocale` de `lib/i18n/locales.ts`; `<html>` agora define
  tanto `lang` quanto `dir` a partir do locale resolvido pelo middleware via
  `getLocale()`.
- `app/[locale]/layout.tsx`: removido o wrapper `<div dir={dirForLocale(...)}>`
  (redundante agora que o `dir` vive no `<html>`), preservando todos os filhos
  (`CartProvider`, header, main, footer, cart drawer). Import de `dirForLocale`
  removido; `Locale` passou a ser `import type`.
- `app/[locale]/page.tsx`: removidos o import e o uso de `<SyncLocaleCookie
  locale="pt" />` (único consumidor restante do componente).

## Verificação

- `npx tsc --noEmit` → saída vazia, exit 0.
- `npx vitest run` → 15 arquivos de teste, 66 testes, todos passando.
- `npm run lint` → 5 problemas, 0 erros (mesma baseline do projeto; todos
  warnings pré-existentes de `<img>` e do React Compiler, não relacionados a
  esta task).
- `npm run build` → build de produção concluído com sucesso (Prisma generate +
  `next build`), sem erros de TypeScript nem de compilação.
- Grep de varredura (`NEXT_LOCALE|resolveSiteLocale|SITE_LOCALES|
  setLocaleCookie|SyncLocaleCookie|HtmlLang`) em `app`, `components`, `lib`,
  `actions` → nenhuma ocorrência.
- Grep `dirForLocale` em `app/[locale]/layout.tsx` → nenhuma ocorrência
  (wrapper removido).
- Dev server na porta 3001:
  - `curl -s localhost:3001/de | grep -o '<html[^>]*>'` →
    `<html lang="de-DE" dir="ltr">`
  - `curl -s localhost:3001/ar/blog | grep -o '<html[^>]*>'` →
    `<html lang="ar" dir="rtl">`
  - `curl -s localhost:3001/ | grep -o '<html[^>]*>'` →
    `<html lang="pt-BR" dir="ltr">`
  - Status HTTP: `/ /faq /de /de/faq /catalog /de/catalog /cart /blog
    /de/blog /privacy /terms /sign-in` → todos 200; `/crm /checkout
    /my-purchases /super-admin` → todos 307.

## Preocupações

- `proxy.ts` não foi tocado; a política fail-closed do `try/catch` de
  autenticação permanece intacta (confirmado por leitura do arquivo).
- Nenhuma URL existente mudou — a remoção foi só de mecanismo interno de
  resolução de idioma, sem alterar rotas.
