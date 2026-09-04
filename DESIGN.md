---
version: alpha
name: AgencyCRM Operational Design System
description: Visual system for a CRM and B2B lead marketplace used by agencies, sales operators, and administrators.
colors:
  background: "#F8FAFE"
  surface: "#FFFFFF"
  surface-subtle: "#E3EDF5"
  foreground: "#151A26"
  muted-foreground: "#525F6B"
  border: "#DEE4EB"
  primary: "#003048"
  primary-hover: "#0C4160"
  on-primary: "#F8FBFF"
  accent: "#184890"
  accent-soft: "#73A9E1"
  warning: "#B45309"
  warning-soft: "#FFF4D6"
  success: "#189048"
  success-soft: "#DDF6E7"
  danger: "#C5372C"
  admin: "#3B3F82"
  admin-soft: "#E8EAFE"
typography:
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  heading-lg:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: 0
rounded:
  xs: 3px
  sm: 4px
  md: 6px
  lg: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    height: 36px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    borderColor: "{colors.border}"
  sidebar:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    activeBackground: "{colors.accent}"
  input:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
---

## Overview

AgencyCRM should feel like an operational trading desk for international B2B prospecting: calm, dense, precise, and trustworthy. The interface is used repeatedly by people managing leads, campaigns, calls, purchases, and admin work, so the visual language must privilege scanning speed over decoration.

The current UI is functional but too close to a default shadcn surface: neutral gray cards, generic rounded panels, inconsistent accent colors, and marketing sections that rely on familiar SaaS composition. The stronger direction is "quiet operational": a crisp off-white workspace, deep navy navigation, compact 8px cards, tabular rhythm, and blue/green only where action or commercial signal matters.

The palette above is derived from the brand logo (`public/logo.png`): the navy of the arrow (`#003048`) is `primary`, the EU blue of the globe (`#184890`) is `accent`, and the Brazilian green (`#189048`) carries `success`. **`app/globals.css` is the single source of truth** — these hex values document what the oklch tokens there resolve to. Change the tokens, then update this file; never hardcode either into components.

## Colors

Use `primary` as the shell and primary action color. It is intentionally dark and grounded, closer to export operations and CRM control rooms than to generic startup blue. Because it is already near-black, its hover state *lightens* rather than darkens. Use `accent` for active states, progress, links, and commercial momentum — it clears 8.4:1 on the light canvas, so it is safe for text; the softer `accent-soft` is not, and is limited to icons, borders, and fills. Use `admin` only for administrative surfaces or role markers so admin affordances are recognizable without a separate purple theme taking over the product.

The logo's yellow (`#f0c018`) is deliberately absent from the token set: at 1.7:1 on white it cannot carry text, and as a fill it competes with `warning`. Keep it in the logo.

Backgrounds should not be pure white at the page level. Use `background` for app canvases, `surface` for actual cards/panels, and `surface-subtle` for headers, sidebars inside panels, empty states, and table headers. Warning, success, and danger colors should appear as soft fills plus readable text, not bright blocks.

## Typography

Use Inter throughout. Keep dashboard and tool headings compact; avoid hero-scale type inside CRM surfaces. Labels should be uppercase only for navigation section labels and metric overlines, never for long prose. Do not use negative letter spacing.

## Layout

CRM, admin, and marketplace tool pages should be dense but breathable: 24px desktop page padding, 16px card internals, 12px gaps for grouped controls, and predictable grid tracks. Avoid nested cards. A page section can be full-width or constrained, but repeated records, stat panels, and modal bodies may be cards.

The CRM shell should feel anchored: dark left navigation, a light sticky top bar, and a subtle off-white working canvas. Key actions should sit near the page title or section header, not buried in decorative callouts.

## Elevation & Depth

Prefer borders and subtle tonal separation over heavy shadows. Cards can use a very small shadow only when they are interactive or elevated above the app canvas. Strong shadows are reserved for overlays, popovers, and modals.

## Shapes

Use 8px as the largest common card radius and 6px for controls. Avoid pill-shaped badges unless they represent a status chip or avatar. Icon containers should be square or softly rounded, not circular by default.

## Components

Buttons should be compact and decisive. Primary buttons use dark teal; secondary and outline buttons stay quiet. Icon buttons need visible focus and fixed dimensions.

Cards should have 8px radius, a light border, compact headers, and no decorative nesting. Tables should use a tinted header row, consistent row height, and hover states that help scanning without feeling loud. Badges should be squarer than pills unless the component already represents presence/avatar-like status.

## Two surfaces: vitrine vs. operacional

O produto serve dois públicos com necessidades opostas, e forçá-los a um design
só foi o que travou as tentativas de adaptar a vitrine. A partir de 2026-09-03 a
regra é separar, não unificar:

- **Vitrine pública** (home, catálogo, listas, checkout, legais, blog, FAQ) é
  **vitrine SaaS premium**: gradiente de marca (`hero-gradient`), cards com brilho
  sutil (`hover-glow`), rótulos de produto em maiúsculas espaçadas (eyebrow),
  layouts split (visual + bullets) e faixas de número. O tom de fluxo é o da
  duna.com; o conteúdo, nunca.
- **CRM / operacional** (leads, campanhas, calls, dashboard, admin) continua
  **quiet operational**: denso, controlado, sem decoração. Nada muda aqui.

O que NUNCA muda, nas duas superfícies:

- **Nenhum número sem base.** Número de RESULTADO ("10× mais rápido", "37% de
  conversão") só entra com dado real. Sem dado, usa-se número de INVENTÁRIO
  (quantos estudos, países, setores) lido do banco — nunca cravado em `messages/`.
- **Nenhuma prova social fabricada.** Logo, depoimento com nome/foto e caso de
  sucesso só com material real e autorizado. Sem material, a seção usa evidência
  verificável do próprio produto (amostra, revisão humana, catálogo real) ou
  simplesmente não aparece.
- **IA nunca como argumento de venda** ao cliente.

### Ritmo da vitrine

Quatro regras que a home passou a seguir em 2026-09-03, depois de a página ter
ficado lida como documento em vez de landing:

- **Separação por superfície, nunca por filete.** Seções vizinhas alternam
  `bg-background` e `bg-muted/40`; o `border-t` saiu de todas. Linha entre blocos
  é hábito de documento — a referência separa trocando o fundo. A sequência
  inteira mora num comentário em `app/[locale]/page.tsx`, porque o `tone` mora em
  cada seção e a alternância não se garante sozinha.
- **Uma quebra tonal, e só uma.** `<Section tone="deep">` pinta um bloco escuro
  de marca (`.vitrine-deep`) no meio da página, no lugar que a referência dá ao
  bloco cinza do "Policy Engine". A classe redefine `--card`, `--border`,
  `--muted-foreground` e `--brand-accent-strong` dentro do próprio subárvore, então
  os filhos continuam usando as utilitárias de sempre — nada de variante escura à
  mão, que seria paleta duplicada. Duas quebras não são quebra, são listras.
- **Sobrancelha pequena, título grande.** Eyebrow em `text-xs` com
  `tracking-[0.14em]`; `h2` em `text-3xl md:text-4xl lg:text-5xl` com
  `tracking-tight` e `text-balance`. Título de vitrine é maior que título de
  artigo; é metade da leitura de "premium".
- **Diagrama mostra mecanismo, não ícones.** Onde a referência põe o desenho do
  motor, a home põe o fluxo real de um estudo (pesquisa → conferência humana em
  fontes públicas → publicação, com a revisão periódica voltando à conferência).
  SVG inline com os tokens do tema, para servir claro, escuro e superfície escura
  sem uma segunda arte. Ícone dentro de círculo não conta como diagrama.
- **Sombra em três camadas, nunca uma.** `.shadow-vitrine` e `.shadow-vitrine-lg`
  em `globals.css` empilham contato + difusa + ambiente. As `shadow-sm/md/xl` do
  Tailwind são uma camada só e leem como caixa colada na página. Elas trocam de
  fórmula sozinhas no tema escuro e dentro de `.vitrine-deep`, onde sombra clara
  não existe e o volume vem de preto mais fundo — o componente não sabe em qual
  superfície está. No CRM, as sombras discretas de sempre.
- **Escala de raio fechada.** 16px (`rounded-2xl`) em painel de seção, 12px
  (`rounded-xl`) em elemento interno e moldura de ícone, pill só em botão e chip.
  Antes conviviam `rounded-md`, `-lg`, `-xl` e `-2xl` sem critério.
- **Nada de fundo animado.** O `hero-gradient` rodava um ciclo de 15s; fundo que
  se move devagar é o sinal mais barato de template, e a referência tem o hero
  estático. Gradiente sim, animação não.
- **O visual alterna de lado.** Seção após seção com texto à esquerda e painel à
  direita faz a página pender toda para o mesmo lado. Inverter pelo `order` do
  grid no `lg` preserva a ordem do DOM — o título continua primeiro para leitor
  de tela e para o empilhamento no celular.
- **A imagem manda no card de blog.** Proporção fixa (`aspect-[3/2]`), não altura
  de miniatura: ao lado de painéis com pilha de páginas e diagrama, thumbnail de
  112px faz a seção ler como rodapé.
- **Cobertura é contada, nunca escrita.** A seção de mercados mostra um
  mapa-múndi com os países do catálogo destacados, e tanto o número de países
  quanto o de continentes saem de `getMercadosDoCatalogo()`. A versão anterior
  listava cinco regiões linguísticas cravadas em `messages/`, escritas no começo
  do projeto: quando saíram, o catálogo já cobria 62 países em seis continentes
  e a home ainda anunciava "países escandinavos". Toda afirmação de alcance na
  vitrine tem que degradar sozinha quando o catálogo encolhe.
- **A vitrine não recorta o catálogo de um jeito que ele não sustenta.** A home
  tinha uma seção que separava importadores em "foco na UE" e "orientados ao
  Mercosul" — um recorte que a faceta "categoria" já havia sido REMOVIDA por não
  conseguir descrever com honestidade (ver `lib/constants/catalog-facets.ts`).
  Antes de criar uma seção que classifica o que vendemos, conferir se o catálogo
  sabe fazer aquela classificação. As duas dimensões que ele sabe são país e
  setor.
- **Ilustração pesada se gera em build.** As fronteiras do mapa são projetadas
  por `npm run gerar:mapa` num arquivo de dados, e a seção só renderiza SVG no
  servidor. `d3-geo`, `topojson-client` e `world-atlas` ficam em
  devDependencies e nunca entram no bundle; hover, tooltip e link funcionam sem
  uma linha de JavaScript. Numa vitrine, ilustração não justifica biblioteca de
  cliente.

## Do's and Don'ts

Do make the CRM feel fast, controlled, and specific to B2B prospecting. Do use deep navy navigation, restrained blue accents, compact metrics, and clear data hierarchy. Do keep admin purple contained to admin identity and role signals.

Don't use *generic/random* blue-purple gradients anywhere, nor *decorative* glow, over-rounded panels and icon circles on operational screens. On the public vitrine the brand gradient and premium gloss are now welcome (see "Two surfaces"); on CRM and admin, flat and restrained.

Don't reach for raw Tailwind color classes (`bg-white`, `text-gray-950`, `text-indigo-700`). They pin a surface to one theme and silently break dark mode — the landing carried 59 of them before this system was wired up. Use the semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-brand`, `text-brand-accent-strong`) so every surface follows the theme.
