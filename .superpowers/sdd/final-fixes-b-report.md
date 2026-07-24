# Final fixes B — report

Branch: `feat/seo-geo-fundacoes`. Four review fixes applied.

## FIX 1 — breadcrumb on the list page ignores the locale

`app/[locale]/list/[slug]/page.tsx` built its `BreadcrumbList` by hand with an
unprefixed `${BASE_URL}/catalog` / `${BASE_URL}/list/${slug}` and a hardcoded
Portuguese label ("Catálogo").

- Extracted a new pure helper `buildListBreadcrumbTrail` in `lib/seo/schema.ts`
  (same pattern as `buildProductSchema`/`buildBlogPostingSchema`): takes
  `{ catalogLabel, listName, slug, locale }` and returns the two-item trail
  with both URLs built via `getPathname({ href, locale })`, so they always
  carry the correct locale prefix.
- `page.tsx` now calls `buildBreadcrumbSchema(buildListBreadcrumbTrail({...}))`
  with `catalogLabel: t("breadcrumbCatalog")` instead of the literal string.
- Added `listing.breadcrumbCatalog` to all 7 `messages/*.json` files, matching
  the existing `nav.catalog` label per locale (pt/es "Catálogo", de "Katalog",
  en "Catalog", fr "Catalogue", it "Catalogo", nl "Catalogus").
- Added tests in `lib/seo/schema.test.ts` (`describe("buildListBreadcrumbTrail")`):
  pt has no prefix, de gets `/de/catalog` and `/de/list/<slug>`, and the last
  breadcrumb item's URL matches the page's own canonical (the exact rule
  Google enforces before it will render/trust a BreadcrumbList).

## FIX 2 — list pages have no canonical/hreflang

- `generateMetadata` in `app/[locale]/list/[slug]/page.tsx` now returns
  `alternates: alternatesFor(\`/list/${slug}\`, locale as Locale)`, same
  pattern as `/`, `/faq`, `/about`.
- `app/sitemap.ts`: the list-route block previously emitted one unprefixed
  `/list/<slug>` URL per list with no `alternates.languages`. Rewrote it to
  mirror the existing static-route pattern — one entry per `PUBLISHED_LOCALES`
  built with `getPathname`, each carrying `alternates.languages` from
  `alternatesFor(\`/list/${slug}\`).languages`. Lists now produce 7 sitemap
  entries each (one per published locale) with two-way hreflang, consistent
  with static routes and blog posts.

## FIX 3 — dead export `toggleListActive`

Checked `app/super-admin/marketplace/lists/page.tsx` (list table: only shows
an `isActive` status badge, no interactive toggle/switch control) and
`app/super-admin/marketplace/lists/[id]/page.tsx` + `ListForm` (the edit form
submits the full `CreateListData` including `isActive` through `updateList`,
which already runs the same `canPublishList` gate `toggleListActive` was
duplicating).

**Decision: deleted `toggleListActive`.** No toggle control exists anywhere
in the admin UI that could call it — grepping the whole repo (outside the
`.claude/worktrees` scratch copy) found zero call sites. Its publish-gate
logic was already fully duplicated in `updateList`, so keeping it around was
pure dead code with no unique behavior to preserve. Also updated a stale
comment in `createList` that referenced "`updateList/toggleListActive`" to
just "`updateList`".

## FIX 4 — residual unverifiable claims on the homepage

Read `about.methodology.blocks[1..2].body` and `faq.items[0].answer` first to
match the site's already-approved framing (checked against public sources —
institutional site, digital presence, available records; catalogue reviewed
periodically; PDF market study). Rewrote `landing.daten` and
`landing.intro.p2` in all 7 locales, removing:

- cadence claims beyond "periodically" (`continuamente`/`regularmente`,
  `kontinuierlich`/`regelmäßig` as "regularly", `continuously`, `en continu`,
  `costantemente`, `voortdurend`) — normalized titles/bodies to
  "reviewed/revised periodically";
- manual/careful per-record verification language (`cuidadosamente
  verificadas`, `sorgfältig verifizierte`, `carefully verified`, `soigneusement
  vérifiées`, `accuratamente verificate`, `zorgvuldig geverifieerde`);
- unbacked "proven interest" guarantees (`interesse comprovado`, `nachweislich
  Interesse`, `proven interest`, `intérêt avéré`, `interesse comprovato`,
  `aantoonbare interesse`);
- the implicit accuracy/reliability guarantee in `confiáveis`/`zuverlässigen`/
  `reliable`/`fiables`/`affidabili`/`betrouwbare`.

Final pt text:

**`landing.daten`**
```json
{
  "eyebrow": "Qualidade dos dados",
  "title": "Dados revisados periodicamente.",
  "body": "As listas são compiladas pela nossa operação, e cada empresa é conferida em fontes públicas — site institucional, presença digital e registros disponíveis — antes de entrar no catálogo. O catálogo é revisado periodicamente: quando uma lista deixa de refletir o mercado que descreve, ela sai de venda."
}
```

**`landing.intro.p2`**
```
"Nossas listas reúnem empresas conferidas em fontes públicas — site institucional, presença digital e registros disponíveis — dentro do setor e do mercado que cada lista se propõe a cobrir. Cada lista vem acompanhada de um estudo de mercado em PDF, para você avaliar o perfil das empresas antes de iniciar o contato."
```

Same rewrite applied consistently (translated, not machine-transliterated) in
de/en/es/fr/it/nl, reusing each locale's own existing vocabulary from
`about.methodology` / `faq` for "checked against public sources" and
"reviewed periodically" so wording stays consistent site-wide.

## Files changed

- `app/[locale]/list/[slug]/page.tsx`
- `app/sitemap.ts`
- `lib/seo/schema.ts`
- `lib/seo/schema.test.ts`
- `actions/admin/lists.ts`
- `messages/pt.json`, `de.json`, `en.json`, `es.json`, `fr.json`, `it.json`, `nl.json`

## Test / typecheck results

- `npx tsc --noEmit` — clean, no output.
- `npm test` (vitest) — **49 test files, 273 tests, all passed.**
- `npx eslint` on the 5 touched non-JSON files — clean, no output.
- All 7 `messages/*.json` files parse as valid JSON (checked with `JSON.parse`).

## Concerns

- None blocking. One note: the list-route block in `app/sitemap.ts` now
  emits `PUBLISHED_LOCALES.length` (7) sitemap entries per active list
  instead of 1. This is the intended fix (matches static routes/blog posts)
  but is a meaningful increase in sitemap size for large catalogues — worth
  keeping an eye on if the list count grows into the thousands, since the
  sitemap already caps `take: 1000` lists (→ up to 7000 URL entries from
  lists alone, still well under the 50k per-sitemap limit).
- `toggleListActive` deletion is a public server-action removal; if any
  external code or a not-yet-merged branch imported it directly, that would
  now fail to compile. Repo-wide grep (excluding the `.claude/worktrees`
  scratch copy) found no other references.
