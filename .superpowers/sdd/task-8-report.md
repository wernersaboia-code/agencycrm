# Task 8 Report — Página "Sobre" com metodologia dos dados

Spec: **SEO/GEO Fundações** · branch `feat/seo-geo-fundacoes`

> ⚠️ O conteúdo anterior deste arquivo pertencia a outra spec (entrega de PDF ao
> comprador) e estava sem commit. Foi copiado antes da sobrescrita para
> `…/scratchpad/task-8-report.PREVIOUS-pdf-spec.md`.

## Status: DONE

---

## 1. Texto final em pt — todas as seções (para revisão frase a frase)

### `about.meta`
- **title:** Quem somos e como os dados são feitos
- **description:** Como as listas de importadores e distribuidores são produzidas: pesquisa própria, conferência em fontes públicas e revisão periódica do catálogo.

### `about.hero`
- **eyebrow:** Sobre
- **title (h1):** Quem está por trás das listas
- **subtitle:** O Easy Prospect reúne importadores e distribuidores em estudos de mercado em PDF, para quem exporta saber com quem falar. Esta página explica como esses dados são produzidos.

### `about.methodology`
- **eyebrow:** Metodologia
- **title (h2):** Como os dados são produzidos
- **intro:** Quem paga por dados B2B tem o direito de saber de onde eles vêm. O processo está descrito abaixo, sem promessas que não possamos sustentar.

**Bloco 1 — Origem dos dados**
> As listas nascem de pesquisa própria e são compiladas pela nossa operação. Cada uma é montada a partir do setor e do mercado que ela se propõe a cobrir.

**Bloco 2 — Conferência em fontes públicas**
> Antes de entrar numa lista, cada empresa é conferida em fontes públicas — site institucional, presença digital e registros disponíveis — para confirmar que existe, que atua no setor indicado e que os canais de contato estão ativos.

**Bloco 3 — Manutenção do catálogo**
> O catálogo é revisado periodicamente. Quando uma lista deixa de refletir o mercado que descreve, ela sai de venda em vez de continuar disponível.

### `about.delivery`
- **title (h2):** O que você recebe
- **body:** Cada compra dá acesso a um estudo de mercado em PDF com as empresas da lista escolhida.

### `about.limits`
- **title (h2):** O que não prometemos
- **body:** Não prometemos que toda empresa vai responder ao seu contato, nem que uma lista substitui a sua própria avaliação antes de negociar. O que garantimos é o critério: nenhuma empresa entra numa lista sem ter sido conferida em fontes públicas.

### `about.cta`
- **title (h2):** Ainda com dúvidas?
- **body:** As perguntas mais comuns sobre as listas, a entrega e o pagamento estão respondidas no FAQ.
- **catalog (botão):** Ver catálogo → `/catalog`
- **faq (botão):** Ver perguntas frequentes → `/faq`

### `about.breadcrumb` (só JSON-LD, não é texto visível)
- home: Início · current: Sobre

### `footer.aboutUs`
- **pt:** Sobre nós (de: Über uns · en: About us · es: Sobre nosotros · fr: À propos · it: Chi siamo · nl: Over ons)

---

## 2. Conformidade com a restrição de veracidade

Cada afirmação da página e sua base:

| Afirmação | Base |
|---|---|
| "nascem de pesquisa própria e são compiladas pela nossa operação" | fato aprovado (formulação vetada com o dono) |
| "conferida em fontes públicas — site institucional, presença digital e registros disponíveis" | fato aprovado, literal da formulação vetada |
| "para confirmar que existe, atua no setor indicado e canais de contato ativos" | fato aprovado, literal |
| "O catálogo é revisado periodicamente" | fato aprovado (sem cadência declarada) |
| "sai de venda em vez de continuar disponível" | fato aprovado (listas que deixam de refletir o mercado são retiradas) |
| "estudo de mercado em PDF" | fato aprovado (o comprador recebe um PDF de estudo de mercado) |
| "O que não prometemos…" | negativa — não afirma nada além do critério já aprovado |

**Não aparece em lugar nenhum da página, em nenhum dos 7 idiomas:**
número de listas/empresas/clientes/países, percentual de precisão, cadência
("mensal"/"monthly"/"maandelijks"/…), equipe ou analistas humanos revisando
registros, certificações, prêmios, parcerias, endereço, tempo de mercado,
tamanho de time, meio de pagamento (Stripe/Pix/cartão), ou qualquer descrição
de ferramenta interna.

### Frases que eu deliberadamente suavizei ou removi
1. **"Nenhuma lista é revendida pronta de terceiros"** — removida. É plausível a
   partir de "pesquisa própria", mas é uma afirmação *adicional* que eu não podia
   fundamentar na lista de fatos verdadeiros. Ficou só "nascem de pesquisa própria".
2. **"…com as empresas da lista e seus canais de contato"** (em `delivery`) —
   cortei "e seus canais de contato": isso descreveria o conteúdo do PDF, que não
   está entre os fatos confirmados. Ficou "com as empresas da lista escolhida".
3. **Cadência** — em vez de "revisado mensalmente", ficou "revisado
   periodicamente" (pt), "regelmäßig" (de), "periodically" (en), "periódicamente"
   (es), "périodiquement" (fr), "periodicamente" (it), "periodiek" (nl).
4. **"nossa equipe"** — no francês a tradução natural seria "notre équipe";
   troquei por "par Easy Prospect" para não sugerir time humano. Mesmo cuidado em
   de/nl ("von Easy Prospect selbst", "door Easy Prospect zelf").
5. Nenhum dado de contato/endereço foi inventado — a página encaminha ao FAQ, que
   já tem o formulário de contato real.

### Ponto sobre o qual tenho dúvida (vale o olhar do dono)
- `about.limits`: *"nem que uma lista substitui a sua própria avaliação antes de
  negociar"*. É verdadeiro e protege juridicamente, mas é uma escolha de tom —
  admitir limite numa página de venda. Se soar defensivo demais, o bloco inteiro
  pode ser removido sem tocar em mais nada (`about.limits` é autocontido).

---

## 3. Chaves adicionadas (idênticas nos 7 arquivos de `messages/`)

Namespace novo `about`:

```
about.meta.title
about.meta.description
about.hero.eyebrow
about.hero.title
about.hero.subtitle
about.methodology.eyebrow
about.methodology.title
about.methodology.intro
about.methodology.blocks[0..2].title
about.methodology.blocks[0..2].body
about.delivery.title
about.delivery.body
about.limits.title
about.limits.body
about.cta.title
about.cta.body
about.cta.faq
about.cta.catalog
about.breadcrumb.home
about.breadcrumb.current
```

Chave nova no namespace existente:

```
footer.aboutUs
```

`footer.about` já existia e é o *tagline* do rodapé — por isso o link novo usa
`aboutUs`, e não `about`.

Paridade verificada por script: as chaves de `about` existem, com o mesmo
caminho, em `pt`, `de`, `en`, `es`, `fr`, `it`, `nl`. Os 7 arquivos continuam
JSON válido e mantiveram o line ending original (CRLF) — o patch foi textual,
sem reserializar o arquivo inteiro, para não reformatar blocos alheios.

Comprimento de metadata (limite de SERP: title+" | Easy Prospect" ≤ 60,
description ≤ 155): pt 53/145 · de 56/146 · en 52/140 · es 55/151 · fr 60/151 ·
it 47/133 · nl 51/152 — todos dentro.

---

## 4. Arquivos alterados

**Criado**
- `app/[locale]/about/page.tsx` — Server Component no molde de
  `app/[locale]/faq/page.tsx`: `generateMetadata` com `title`/`description` de
  `about.meta` e `alternates: alternatesFor("/about", locale as Locale)`;
  `<JsonLd data={buildBreadcrumbSchema([...])} />` com Início → Sobre, URLs via
  `getPathname` + `BASE_URL` (mesma mecânica de prefixo do sitemap/hreflang);
  corpo montado com `Section`/`SectionHeading` de `components/landing/section`,
  cards de metodologia no mesmo padrão visual de `how-it-works-section` e fecho
  no bloco `bg-brand` de `final-cta-section`. Sem estado, sem client component.

**Modificados**
- `messages/pt.json`, `de`, `en`, `es`, `fr`, `it`, `nl` — namespace `about` +
  `footer.aboutUs` (49 linhas inseridas em cada, 0 removidas).
- `app/sitemap.ts` — `{ path: "/about", changeFrequency: "monthly", priority: 0.6 }`
  em `ROUTES` (gera 7 URLs, uma por locale publicado, com hreflang recíproco).
- `components/marketplace/marketplace-footer.tsx` — `<li>` novo na coluna
  "Produto", depois do FAQ, usando `LocaleLink href="/about"`.

`/about` não precisou de entrada em `pathnames`: o `routing` do projeto não
localiza segmentos de URL, então o caminho é o mesmo em todos os idiomas.

---

## 5. Verificação

| Checagem | Resultado |
|---|---|
| `npx tsc --noEmit` | limpo, sem saída |
| `npx eslint` nos 3 arquivos tocados | exit 0, 0 problemas |
| `npm run lint` (repo inteiro) | roda; os 1360 erros/94646 avisos reportados são pré-existentes e não vêm de nenhum arquivo desta task (confirmado rodando o eslint isolado nos arquivos tocados) |
| `npm test` (`vitest run`) | **48 arquivos, 257 testes, todos passando** |

**Pulado (por instrução):** a verificação por `curl` do Step 5 do brief
(`/about`, `/de/about`, `sitemap.xml`) — não foi permitido subir dev server nesta
execução. O que essa verificação cobriria está coberto indiretamente: o `tsc`
valida a página, a checagem de paridade de chaves garante que os 7 locales
renderizam sem `MISSING_MESSAGE`, e `/about` está em `ROUTES` (7 URLs no
sitemap, uma por `PUBLISHED_LOCALES`). **Recomendo confirmar as 3 URLs no
próximo `npm run dev`.**

---

## 6. Commit

`feat(seo): página Sobre com metodologia verificável dos dados`
