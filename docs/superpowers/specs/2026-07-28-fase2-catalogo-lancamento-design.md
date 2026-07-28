# Fase 2 — Catálogo pronto para o lançamento

**Data:** 2026-07-28
**Contexto:** o Plano de Projeto do sócio fixa o lançamento em **01.08.2026**, quatro
dias depois desta data. O escopo abaixo foi deliberadamente cortado para o que é
seguro entregar nesse prazo. A multi-moeda, desenhada e aprovada, foi movida
para a Fase 2B (pós-lançamento) porque mexe em migração de banco e no cálculo de
preço do checkout — errar ali cobra o cliente errado.

## Estado do catálogo hoje

Medido em produção em 2026-07-28:

| | |
|---|---|
| Listas | 20 (19 ativas) |
| Setores | `food` em todas as 20; `retail` em 3 |
| Categoria | `importers` em todas as 20 |
| Idiomas | `en` 17 · `pt` 2 · `es` 1 (nenhuma sem idioma) |
| Preço | €20–70, moeda única (EUR) |

Três leituras que moldam o desenho:

1. A remarcação de `food` é um `UPDATE` de 20 linhas. Sem risco.
2. O filtro de categoria exibe **uma única opção**, porque `visibleFacets` esconde
   faceta zerada e só existe `importers`. Um filtro com uma caixa não filtra nada.
3. O filtro de idioma é o de maior valor imediato: 17 das 20 listas estão em
   inglês, e hoje nada informa ao visitante que existem listas em português.

---

## Escopo

### 1. Rótulo cru do setor (correção de defeito)

O rótulo traduzido existe em `messages/*.json` sob `catalog.industries.*`, mas
dois lugares imprimem o id direto do banco:

- `components/marketplace/list-card.tsx:128` — `<Badge>{industry}</Badge>`
- `app/[locale]/list/[slug]/page.tsx:194` — `list.industries.join(", ")`

O filtro traduz (`catalog-sidebar.tsx:288`); o resto não. É por isso que o
catálogo mostra "food" em vez de "Alimentos & Bebidas".

Ambos passam a traduzir pelo mesmo caminho do sidebar. O mesmo vale para
`category`, que tem o defeito idêntico na página de detalhe.

**Regra:** id de faceta nunca chega à tela. Quem renderiza faceta traduz.

### 2. Vocabulário: HORECA e FMCG

`INDUSTRY_IDS` (`lib/constants/catalog-facets.ts:27`) muda assim:

- **Sai** `food`.
- **Entram** `fmcg_food`, `fmcg_nonfood`, `horeca`.

`food` sai porque "Alimentos & Bebidas" e "FMCG — Bens de Consumo Alimentares"
significam praticamente a mesma coisa; deixar os dois põe duas caixas
equivalentes lado a lado no filtro e obriga quem cadastra a escolher entre elas
toda vez.

`foodservice` **não** entra. O Plano de Projeto o trata como prioridade separada
de HORECA, mas no comércio internacional os dois se sobrepõem muito, e faceta
que o cliente não sabe escolher é pior que faceta a menos. HORECA é o termo mais
reconhecido no mercado europeu, que é o alvo. Fica registrado para revisão quando
o catálogo tiver volume que justifique a separação.

Rótulos nos sete idiomas. `lib/i18n/messages-integridade.test.ts` compara cada
locale contra `pt`, então esquecer uma tradução é reprovado — mas esquecer o
rótulo **em pt também** passa despercebido, e o id vaza cru para a tela. Esta
fase acrescenta um teste que fecha essa brecha: para cada id de `CATEGORY_IDS`,
`INDUSTRY_IDS` e `COUNTRY_CODES`, existe a chave correspondente em
`messages/pt.json`.

| id | pt | en | de |
|---|---|---|---|
| `horeca` | HORECA — Hotelaria, Restauração e Catering | HORECA — Hotels, Restaurants & Catering | HORECA — Hotellerie, Gastronomie, Catering |
| `fmcg_food` | FMCG — Bens de Consumo Alimentares | FMCG — Food & Beverage | FMCG — Konsumgüter Food |
| `fmcg_nonfood` | FMCG — Bens de Consumo Não-Alimentares | FMCG — Non-Food | FMCG — Konsumgüter Non-Food |

es, fr, it e nl seguem o mesmo padrão: sigla preservada, qualificador traduzido.

**Migração de dados.** Um comando, aplicado às 20 listas:

```sql
update lead_lists
set industries = array_replace(industries, 'food', 'fmcg_food')
where 'food' = any(industries);
```

Roda **antes** do deploy do código novo. Nessa ordem o catálogo nunca fica com
listas apontando para um id que o vocabulário não conhece. O caminho inverso
(código primeiro) deixaria as 20 listas sem faceta visível no intervalo.

### 3. Filtro de idioma

Quarta seção no `CatalogSidebar`, com o mesmo padrão de checkbox das outras.

- Vocabulário: `LIST_LANGUAGES` (`lib/constants/list-languages.ts`), que já existe.
- Rótulo: **nome do idioma por extenso**, sem bandeira.
- Query param: `languages=pt,en` — plural, como `countries` e `industries`.
- Sujeito a `visibleFacets`: só aparece idioma com lista publicada.

O campo `language` já existe em `LeadList` e está preenchido nas 20 listas, então
não há migração.

**A bandeira de idioma sai do card** (`list-card.tsx:100`). Duas bandeiras no
mesmo canto — uma de país, uma de idioma — leem como quatro países. Ficam só as
de país, que é o que o cliente compra. O idioma da lista passa a aparecer como
texto na página de detalhe.

### 4. Filtro de categoria com valor único

`CatalogSidebar` esconde a seção de categoria quando `visibleFacets` devolve
menos de dois ids. A regra vale para qualquer seção, não só categoria: uma faceta
sozinha não oferece escolha.

**Exceção obrigatória:** a seção continua visível se houver filtro ativo nela,
mesmo com uma faceta só. Sem essa guarda, um filtro vindo de link antigo ficaria
aplicado sem aparecer em lugar nenhum para ser desmarcado — o mesmo motivo pelo
qual `visibleFacets` já preserva a faceta selecionada.

A seção reaparece sozinha quando o catálogo ganhar a segunda categoria — sem
mudança de código.

### 5. Rolagem do painel de filtros

`components/marketplace/catalog-filters-panel.tsx:64` usa `lg:sticky lg:top-24`
sem altura máxima. O painel gruda no topo e, quando a lista de filtros passa da
altura da tela, o fim fica inalcançável: a roda do mouse rola a página, não o
painel.

Com a quarta seção isso deixa de ser eventual. Conserto:

```
lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto
```

`dvh` e não `vh` por causa da barra do navegador móvel — irrelevante no breakpoint
`lg`, mas é o padrão correto e não custa nada.

### 6. Quem Somos no header

`/about` já existe e está completa; só não está ligada ao menu. Entra em
`components/marketplace/marketplace-header.tsx` na navegação desktop (:63) e na
gaveta mobile (:150), entre "Blog" e "FAQ".

### 7. Revisão do texto do Quem Somos

O material do sócio (`Sobre Nós e Metodologia.docx`, `Por_que_EasyProspect_PT-BR.docx`
e as seis traduções) tem a mesma estrutura da página atual. O que muda:

**Entra**, porque é melhor que o texto atual:

- A lista de verificação por empresa: atua no setor / tem atividade de importação
  ou distribuição / tem presença profissional / tem contato atual / é parceiro
  potencial plausível.
- A ressalva de que a verificação não substitui qualificação comercial individual.
- "Nossos diretórios não foram concebidos para campanhas de e-mail em massa, mas
  para uma abordagem personalizada." Posiciona o produto e protege o uso do dado.
- A ideia de que cada lista vem acompanhada de um estudo compacto de entrada no
  mercado — hoje a página não deixa isso claro, e é o diferencial do produto.

**Não entra**, com o motivo:

- **Ênfase na IA.** Os documentos abrem com "utilizando os recursos mais avançados
  da Inteligência Artificial". Em dados B2B isso desconta a percepção de
  qualidade em vez de somar. A versão alemã mais recente do próprio autor já
  corrige o tom ("análise apoiada por IA *e* revisão manual final") — é essa que
  vale. A IA é mencionada como método, não como argumento de venda.
- **Fontes não confirmadas.** Câmaras de comércio, catálogos de feiras,
  associações setoriais e portais especializados aparecem como origem dos dados.
  Só entram as fontes que a operação realmente consulta — a página foi escrita
  para não afirmar o que não se sustenta, inclusive diante de questionamento
  sobre dados pessoais.
- **"Muitos anos de experiência"** na voz da empresa. Com o site lançando agora,
  soa a currículo emprestado. A experiência é real, mas é *de uma pessoa*: fica
  mais forte nomeada, na seção de quem está por trás.
- **O número `100000`**, que aparece quatro vezes solto entre seções dos
  documentos. É resto de formatação. Se a intenção era "100.000 empresas", não
  há base para o número.

A estrutura de `messages/*.json` sob `about.*` não muda — só o conteúdo das
chaves, nos sete idiomas. As traduções do sócio (en, de, es, fr, it, nl) servem
de base, aplicados os mesmos cortes.

---

## Fora do escopo desta fase

**Fase 2B — Multi-moeda (pós-lançamento).** Desenhada e aprovada, adiada por
prazo. O desenho fica registrado para não se perder:

- Tabela `LeadListPrice { listId, currency, amount }` com `@@unique([listId, currency])`.
  `LeadList.price`/`currency` permanecem como o preço em EUR; os dados atuais
  viram a primeira linha da tabela nova.
- Moedas: EUR, BRL, USD. EUR obrigatório; as outras opcionais. Sem preço na
  moeda escolhida, exibe EUR com a moeda explícita.
- Seletor no header ao lado do de idioma, cookie `CURRENCY`, independente do
  idioma. Palpite inicial pelo idioma da URL: pt→BRL, en→USD, resto→EUR.
- Carrinho travado em uma moeda por compra; trocar de moeda recalcula, e item sem
  preço na moeda escolhida derruba o carrinho inteiro para EUR, com aviso.
- **O servidor nunca aceita preço vindo do cliente.** `actions/checkout.ts:71` já
  lê `list.price` do banco; passa a resolver por `LeadListPrice` validando a
  moeda contra a lista permitida. O cliente envia no máximo o código da moeda.
- **Dependência externa:** cobrar em EUR e USD depende da configuração do
  provedor de pagamento no lançamento (a conta brasileira liquida em BRL). O
  catálogo pode *exibir* as três moedas antes disso; a *cobrança* nas três é que
  fica condicionada.

**Fase 3 — RTL.** O `dir` no `<html>` já está aplicado. Faltam as propriedades
lógicas (32 ocorrências de `ml-`/`mr-`/`text-left` no funil) e a regra de lint
anti-regressão. Fase pequena.

**Fase 4 — Árabe.** `messages/ar.json` não existe. Depende da Fase 3.

**Já concluído fora de ordem.** A Fase 3 original do plano de idiomas (EN, ES,
FR, IT, NL) está feita: os arquivos existem em `messages/`. A Fase 1 está
merjada.

**Dívida registrada, sem data.** Namespaces em alemão em `messages/pt.json`
(`zielmaerkte`, `lieferumfang`, `einkaufsprofile`, `daten`, `vorteil`); termos de
uso e política de privacidade; entrega das listas em PDF.

---

## Verificação de aceite

- [ ] Nenhum id de faceta aparece na tela: card, página de detalhe e filtro
      mostram rótulo traduzido em todos os sete idiomas
- [ ] As 20 listas exibem "FMCG — Bens de Consumo Alimentares"; nenhuma fica sem
      setor visível
- [ ] `grep -rn "'food'" lib actions app components` não encontra o id antigo
- [ ] O teste novo de paridade faceta↔rótulo passa, e falha se um id for
      acrescentado sem rótulo em `pt`
- [ ] `npx vitest run lib/i18n/messages-integridade.test.ts` passa — os três ids
      novos têm rótulo nos sete idiomas
- [ ] Com `?category=importers` na URL, a seção de categoria continua visível e
      permite desmarcar, mesmo sendo a única faceta
- [ ] O filtro de idioma lista pt, en e es (os três com lista publicada), e
      filtrar por `pt` devolve exatamente 2 listas
- [ ] A seção de categoria não é renderizada enquanto só existir `importers`
- [ ] Nenhum card do catálogo mostra bandeira de idioma; as de país continuam
- [ ] Com as quatro seções abertas numa janela de 800px de altura, a roda do
      mouse sobre o painel alcança o botão "Limpar filtros"
- [ ] "Quem somos" aparece no menu desktop e na gaveta mobile, e leva a `/about`
      preservando o idioma da URL
- [ ] `npx tsc --noEmit && npm run lint && npx vitest run && npm run build` — exit 0
