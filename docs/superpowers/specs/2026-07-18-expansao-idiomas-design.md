# Expansão para 8 idiomas com rotas por locale — Design

**Data:** 2026-07-18
**Status:** Aprovado (aguardando revisão da spec)

## Objetivo

Levar o funil público de 2 para 8 idiomas — adicionar EN, ES, FR, IT, NL e AR
ao PT e DE existentes — e dar a cada idioma **URL própria e indexável**. Hoje
só a landing e a FAQ têm rota por idioma; o catálogo, o detalhe da lista, o
carrinho e o checkout compartilham a mesma URL nos dois idiomas e se traduzem
por cookie, então o Google conhece apenas a versão portuguesa dessas páginas.

Tráfego de busca é a motivação principal. O catálogo e as fichas de lista são
onde entra descoberta de cauda longa, e são exatamente as páginas hoje
invisíveis nos idiomas não-padrão.

## Relação com o design anterior

Este documento **supersede** uma decisão de
[`2026-07-11-funil-i18n-design.md`](2026-07-11-funil-i18n-design.md), que
listou explicitamente "reestruturar o app para `app/[locale]`" como fora de
escopo e optou por resolução via cookie. Aquela escolha foi correta para dois
idiomas; não escala para oito nem resolve indexação.

A migração também elimina de graça um trade-off que aquele design aceitou: o
flash de chrome alemão ao digitar `/` com cookie `de`. Com o locale na URL, não
há divergência entre o que a URL diz e o que o cookie guarda.

## Escopo

**Dentro:** funil público — landing, FAQ, catálogo, detalhe da lista, carrinho,
checkout (e telas de sucesso/cancelamento), minhas compras. São os 10
namespaces existentes em `messages/`, 374 chaves.

**Fora:** CRM e super-admin. Hoje têm **zero** instrumentação de i18n — 77
arquivos com português fixo. Traduzi-los exigiria instrumentar tudo do zero,
um projeto maior que este, e o público deles é a equipe interna. Permanecem em
português e LTR.

## Idiomas

| Locale | Idioma | `lang` | Direção |
|---|---|---|---|
| `pt` | Português (padrão) | `pt-BR` | ltr |
| `de` | Alemão | `de-DE` | ltr |
| `en` | Inglês | `en-US` | ltr |
| `es` | Espanhol | `es-ES` | ltr |
| `fr` | Francês | `fr-FR` | ltr |
| `it` | Italiano | `it-IT` | ltr |
| `nl` | Holandês | `nl-NL` | ltr |
| `ar` | Árabe | `ar` | **rtl** |

A landing já apresenta "Países de língua árabe" (AE · SA · QA · KW · EG) como
mercado-alvo, então o árabe é coerente com o posicionamento do produto.

## Arquitetura

### Rotas — `app/[locale]/`

O funil migra para um segmento dinâmico, com `localePrefix: "as-needed"` e
`defaultLocale: "pt"`. Consequência importante: **nenhuma URL existente muda.**

| Hoje | Depois |
|---|---|
| `/` | `/` |
| `/faq` | `/faq` |
| `/de` | `/de` |
| `/de/faq` | `/de/faq` |
| `/catalog` (PT e DE via cookie) | `/catalog` + `/de/catalog`, `/en/catalog`, … |

Sem redirects, sem risco de perder posicionamento acumulado. O ganho é
aditivo: as páginas do funil passam a existir uma vez por idioma.

As áreas internas (`app/(crm)`, `app/super-admin`) e as rotas de API ficam
fora do segmento.

### Configuração de locales — fonte única

`lib/i18n/routing.ts` passa a ser a única fonte, via `defineRouting` do
next-intl. Deletados:

- `SITE_LOCALES` e o type guard manual `isSiteLocale` (hoje um
  `value === "pt" || value === "de"` escrito à mão)
- `PT_TO_DE` / `DE_TO_PT` em `lib/i18n/locale-routes.ts` — os mapas
  bidirecionais par a par, que com 8 idiomas virariam 56 entradas

A troca de idioma deixa de consultar mapa e passa a ser substituição do
segmento de locale na URL atual. Adicionar o 9º idioma passa a custar um JSON
e uma linha de configuração.

### Direção do texto

`LOCALE_DIR: Record<Locale, "ltr" | "rtl">` marca `ar` como `rtl`. O root
layout aplica `dir` no `<html>` junto com o `lang`, ambos derivados do
segmento de rota. O componente `HtmlLang` — que hoje corrige o `lang` via
`useEffect` porque a home é ISR e não podia ler `headers()` — é absorvido por
isso e removido, já que o locale agora vem da URL.

### RTL

49 usos de classes direcionais físicas em 18 arquivos do funil e da UI
compartilhada migram para propriedades lógicas:

| Físico | Lógico |
|---|---|
| `ml-` / `mr-` | `ms-` / `me-` |
| `pl-` / `pr-` | `ps-` / `pe-` |
| `border-l-` / `border-r-` | `border-s-` / `border-e-` |
| `rounded-l-` / `rounded-r-` | `rounded-s-` / `rounded-e-` |
| `text-left` / `text-right` | `text-start` / `text-end` |

Migrar `components/ui` é seguro para o CRM: em LTR a propriedade lógica se
comporta igual à física.

Os outros 240 usos, no CRM e no admin, **não** migram — aquelas áreas nunca
renderizam em RTL.

### SEO

- `generateMetadata` emite `alternates.languages` com as 8 variantes e
  `x-default` apontando para o português
- Canonical de cada página aponta para si mesma, não para a versão padrão
- `sitemap.xml` lista todas as variantes de cada rota

## Traduções

8 arquivos em `messages/`, 374 chaves cada. As 6 traduções novas são geradas a
partir do português, **namespace por namespace** e não em um despejo único, de
modo que cada bloco entre revisável e o histórico do git fique legível.

Arquivos mantêm a mesma ordem de chaves do português, para que diffs entre
idiomas sejam comparáveis.

### Risco aceito

As traduções vão ao ar sem revisão por falantes nativos — decisão explícita do
autor do projeto, registrada aqui para que a origem da escolha não se perca.

Duas consequências que valem monitoramento depois da publicação:

1. Texto de vendas com erro idiomático custa credibilidade, e erros em árabe e
   holandês são improváveis de serem notados internamente.
2. O Google trata conteúdo traduzido automaticamente sem revisão como sinal de
   baixa qualidade. Com 8 versões de cada ficha de lista, isso multiplica
   páginas fracas em vez de multiplicar alcance.

Mitigação sugerida, não bloqueante: revisar as páginas de maior tráfego depois
que estiverem no ar, começando por landing, FAQ e checkout.

## Verificação

**Paridade de mensagens.** Um teste compara os 8 arquivos e falha se algum
divergir em chaves. Este é o risco operacional mais concreto do projeto: uma
chave faltando em árabe quebra a página em runtime, e ninguém percebe até um
cliente abrir. Substitui por verificação permanente o que hoje se faz à mão.

**Resolução de locale e troca de idioma.** Estender os testes existentes em
`lib/i18n/*.test.ts` para os 8 locales, cobrindo o comportamento de
`as-needed` (padrão sem prefixo) e o fallback de locale inválido.

**Lint anti-regressão de RTL.** Regra barrando classes direcionais físicas nos
diretórios do funil, para o trabalho de RTL não se desfazer com o tempo.

**Build.** Gera as rotas dos 8 idiomas sem erro.

**Verificação visual em RTL.** O árabe precisa de olhada real em cada tela do
funil. Espelhamento errado — ícone do lado errado, margem invertida, texto
encostado na borda — não aparece em teste automatizado. Esta é a única etapa
do projeto que não dá para automatizar.

## Faseamento

Quatro entregas, cada uma um PR. A ordem é deliberada: se a fase 1 der
problema, isso aparece com dois idiomas conhecidos, não com oito.

1. **Estrutura** — `[locale]`, routing do next-intl, remoção dos mapas par a
   par, metadados de SEO. Ainda só PT e DE, comportamento idêntico ao atual.
   É a fase de maior risco e a que mais merece isolamento.
2. **RTL** — propriedades lógicas, `dir` no html, regra de lint. Sem idioma
   novo; verificável em português forçando `dir="rtl"`.
3. **Idiomas LTR** — EN, ES, FR, IT, NL. Repetitivo e de baixo risco.
4. **Árabe** — tradução e revisão visual das telas.

Cada fase entrega algo funcionando.

## Fora de escopo, registrado

**Nomes de namespace em alemão.** `messages/pt.json` usa chaves como
`zielmaerkte`, `einkaufsprofile`, `lieferumfang`, `daten` e `vorteil` —
resquício de a landing ter nascido em alemão. Com 8 idiomas isso fica
confuso, mas renomear toca os 8 arquivos e todos os componentes que consomem
as chaves. Melhor tratar isoladamente, quando não houver outra mudança grande
em voo nos mesmos arquivos.

**Cores fixas fora do funil.** 24 arquivos de CRM, compras, blog e auth ainda
ignoram o modo escuro (ver PR #3). Sem relação com idiomas, mas na mesma
categoria de dívida de design system.
