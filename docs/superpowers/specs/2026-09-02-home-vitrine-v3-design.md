# Vitrine v3 da home — o esqueleto da Duna com dados reais

Data: 2026-09-02
Estado: aprovado, aguardando plano de implementação

Análise completa, bloco a bloco:
https://claude.ai/code/artifact/ea041f2a-8a0e-4518-ae97-2c81ee609de0

## Problema

A home de hoje tem doze seções corretas e nenhuma hierarquia. Todas usam o mesmo
espaçamento (`py-14 md:py-16`), quatro delas são coluna estreita centralizada, e o
material mais forte que a operação tem — a metodologia de verificação, os limites
declarados, o tamanho real do catálogo — está no `/about` e no FAQ, páginas que
quase ninguém abre.

O Werner trouxe a duna.com como referência de *fluxo*, não de estética. O que essa
página faz bem é repetir um esqueleto: título curto, uma frase de contexto, três ou
quatro capacidades nomeadas, um visual, e um link para aprofundar. É esse esqueleto
que se quer aqui.

O que **não** se quer é a estética: a Duna vende com paisagem em gradiente,
depoimento nominal com foto e três números de resultado no hero. Os dois primeiros
esbarram na regra de voz do projeto, o terceiro esbarra no `DESIGN.md`, que proíbe
gradiente e glow de propósito.

## O que foi apurado no banco (02/09/2026)

Consultas de leitura contra produção. **Estes números derrubaram três suposições**
que a análise fazia antes de conferir — o registro fica porque o erro é o argumento
a favor de ler do banco em vez de cravar em `messages/`.

| Medida | Real | Observação |
|---|---|---|
| Estudos publicados | **61** | de 64 no banco; os 61 ativos têm PDF |
| Países com estudo | **49** | cada estudo cobre exatamente 1 país |
| Setores | **5** | HoReCa 49 · brinquedos 5 · frutas exóticas 3 · FMCG 3 · barras 1 |
| Com `dataReviewedAt` | **61 de 61** | mais recente 2026-08-26 |
| Idioma dos estudos | **59 en**, 1 pt, 1 es | confirma "estudos redigidos em inglês" |
| Empresas perfiladas | **inapurável** | `totalLeads` zerado nos 61; `marketplace_leads` sem linha ligada a estudo ativo |
| Campos de perfil | **0% preenchidos** | `productPortfolio`, `sourcing`, `salesPointsCount` etc. |

As duas últimas linhas são consequência do reposicionamento: a empresa perfilada
vive **dentro do PDF**, não no banco. As colunas de `MarketplaceLead` são estrutura
do produto anterior, quando o que se vendia era a base de contatos.

`docs/estado-e-pendencias.md` diz 49 estudos. Estava certo em 31/08 e já não está.

## Decisões tomadas

Cada uma tem alternativa considerada e recusada.

| Decisão | Escolhido | Por quê |
|---|---|---|
| Referência | Esqueleto da duna.com | O ritmo é o que se quer; a estética não |
| Estética | `DESIGN.md` do projeto | Paisagem, gradiente e glow recusados — o documento os proíbe |
| Prova social | Sem depoimento nominal | Regra de voz: ninguém nomeado |
| Estatística de resultado | Recusada | Regra de voz: nenhum número sem base |
| Estatística de inventário | Aceita, **lida do banco** | Contável; cravada em `messages/` envelhece sozinha |
| "N empresas perfiladas" | **Cortada** | Não existe no banco; só sairia contando 61 PDFs à mão |
| Enquadramento da faixa | "61 estudos · 5 setores · 49 países" | Werner escolheu amplitude, ciente da concentração em HoReCa |
| Título do hero | **Não muda** | A reversão do `326ad2d` foi deliberada |
| Bloco de IA | Vira o checklist de verificação | IA nunca como argumento de venda |
| Blocos de produto (06–09) | Escritos a partir dos PDFs | Os campos do banco estão vazios; fase própria |
| Seção sem lastro | Devolve `null` | Mesmo critério de `FreeSampleSection` e `visibleFacets` |
| Origem dos textos | `messages/<locale>.json` | Só o número vem do banco; texto segue nos 7 idiomas |

### Duas decisões com ressalva registrada

**"5 setores" sugere um equilíbrio que não existe.** HoReCa é 49 dos 61 estudos.
A alternativa — "HoReCa e foodservice em 49 países" — vende profundidade, que é o
que o catálogo de fato tem. O Werner optou por amplitude e a escolha fica; a
ressalva fica registrada aqui, não repetida no plano.

**O hero segue contradizendo a aba.** `landing.hero.title` diz "Listas qualificadas
de importadores e distribuidores"; `landing.meta.title`, na mesma rota, diz "Estudos
de entrada em mercado". Decisão do Werner: não mexer agora.

## Arquitetura

Nada de modelo novo. Uma função de leitura, uma seção nova, e ajuste de
espaçamento nas existentes.

```
lib/marketplace/resumo-catalogo.ts    (novo)
  getResumoCatalogo()  ->  { estudos, paises, setores, revisadoEm }
  unstable_cache com tag TAG_RESUMO_CATALOGO
        |
        v
components/landing/catalog-stats-section.tsx   (novo)
  devolve null quando estudos === 0
        |
        v
app/[locale]/page.tsx   (ordem das seções)
```

A função espelha `getFilterCounts()` em `actions/marketplace.ts`, que já percorre
`leadList.findMany({ where: { isActive: true } })` e agrega países e setores. A
diferença é que o resumo devolve **contagens de chaves distintas**, não o mapa.

**Contagem de países:** `Object.keys(countryCounts).length` sobre os estudos ativos,
não `COUNTRY_CODES.length`. São coisas diferentes — o vocabulário de facetas conhece
30 códigos e o catálogo tem 49 países. (Essa divergência é um bug próprio, tratado na
branch `claude/elastic-poitras-3a4395`, fora deste plano.)

**Cache:** `unstable_cache` com tag, no molde de `lib/free-sample/amostra-ativa.ts`.
A home é a página mais visitada e já teve problema de renderização dinâmica; o
catálogo muda algumas vezes por mês. A tag é revalidada quando o admin publica,
despublica ou apaga um estudo.

**Falha:** ao contrário da amostra grátis, aqui a tabela `lead_lists` sempre existe —
não há caso P2021 a tolerar. Qualquer erro é relançado, e a Suspense boundary da
seção cai sozinha sem levar o resto da home.

## As fases

Ordem por risco crescente. Cada fase é publicável sozinha.

**Fase 1 — Ritmo.** Espaçamento e alternância em `components/landing/section.tsx`.
Nenhuma string nova, nenhuma consulta. É o que mais muda a percepção por menos
código.

**Fase 2 — Faixa de números (bloco 03).** A função de resumo, a seção, a tag de
cache e a revalidação no admin.

**Fase 3 — Honestidade e método (blocos 04 e 05).** Trazer "O que não podemos
prometer" e o checklist de verificação do `/about` para a home. O texto já existe
em `content/about/about.*.ts` nos 7 idiomas, mas precisa virar chave em
`messages/` — a home lê de `messages/`, não de `content/`.

**Fase 4 — Rodapé (bloco 12).** Colunas de setor e de região linguística, com links
para o catálogo filtrado.

**Fase 5 — Blog (bloco 11).** Categoria e tempo de leitura no card.

**Fase 6 — Blocos de produto (06–09).** A reescrita das quatro seções centrais a
partir do conteúdo real dos PDFs. Depende de trabalho manual de leitura; fica por
último e pode virar plano próprio.

## O que fica de fora

- **O texto do hero.** Decisão do Werner.
- **Os 19 países sem faceta.** Branch `claude/elastic-poitras-3a4395`.
- **Contar empresas dos PDFs.** Se um dia alguém contar, o número entra na faixa —
  mas é decisão de operação, não de vitrine.
- **Qualquer mudança no `/about` e no FAQ.** A fase 3 copia conteúdo para a home;
  as páginas de origem seguem intactas.

## Riscos

**Duplicação de texto entre `content/about` e `messages/`.** A fase 3 cria uma
segunda cópia do checklist de verificação. É deliberado: `content/about/*.ts` é
transcrição literal do documento do sócio e não deve ser reescrito, enquanto a home
precisa de uma versão curta. As duas convivem, e a divergência é aceita — mas o
plano deve registrar isso num comentário no código, senão a próxima pessoa "conserta"
unificando.

**Estudo em destaque invisível.** Há 5 estudos com `isFeatured`, e
`getFeaturedLists(4)` mostra 4. Um nunca aparece. Não é bug — o limite é
deliberado — mas vale conferir com o Werner se ele sabe.

**Custo de i18n.** Toda chave nova entra nos 7 arquivos de `messages/`, e
`lib/i18n/messages-integridade.test.ts` reprova se faltar. As fases 2, 3, 4 e 5
criam chaves; a 1 não.
