# Fase 2B: multi-moeda (EUR / BRL / USD)

**Data:** 2026-07-30
**Contexto:** o catálogo cobra em uma única moeda por lista, e as 20 listas do
banco estão todas em EUR. O público é internacional (7 idiomas, importadores
europeus), e o comprador brasileiro ou americano vê um preço numa moeda que não
é a dele. O desenho desta fase foi aprovado em 2026-07-28 e registrado na seção
"Fora do escopo" de `2026-07-28-fase2-catalogo-lancamento-design.md`; esta spec o
substitui como referência, com as decisões que faltavam e as correções que o
código atual impôs ao desenho original.

**Princípio da fase: preço fixo por moeda, nunca conversão em runtime.** Não
existe taxa de câmbio no caminho de render nem no de cobrança. Cada lista tem um
preço cadastrado por moeda, decidido comercialmente. Um preço convertido na hora
flutua entre a vitrine e o checkout, e a diferença aparece exatamente no momento
em que o comprador está decidindo pagar.

## Estado atual

| | |
|---|---|
| `LeadList.price` / `LeadList.currency` | `Decimal(10,2)` + string, default `EUR`; uma moeda por lista |
| Banco (verificado por SQL, 2026-07-30) | 20 listas, **todas EUR**, preços 20,00–70,00; 19 ativas |
| Compras | 1 paga, EUR |
| Form do admin | `z.enum(["EUR","USD","BRL"])` — a moeda já é escolhível por lista |
| Provedores | **PayPal e Stripe, os dois implementados** |
| `create-order` / `create-session` | rejeitam carrinho com moedas misturadas (`currencies.size !== 1`); resolvem preço pelo banco, nunca pelo cliente |
| Carrinho | `localStorage`, guarda `price` e `currency` por item |
| Seletor de moeda | não existe |

### Delta em relação ao desenho de 28/07

O desenho supunha um provedor (PayPal). **O Stripe foi implementado desde
então** (`app/api/checkout/stripe/*`, `lib/stripe.ts`,
`components/checkout/stripe-checkout-button.tsx`). Toda mudança de checkout
atravessa dois caminhos, não um. O lado bom: os dois já foram escritos como
espelho um do outro, com a mesma validação de itens e a mesma resolução de preço
pelo banco.

### Defeito latente encontrado

`components/checkout/paypal-buttons.tsx:65` fixa `currency: "EUR"` no
`PayPalScriptProvider`, enquanto `create-order` monta o pedido com
`list.currency`. Hoje é inofensivo porque toda lista é EUR. **Vira divergência
entre o SDK e o pedido no minuto em que existir a primeira lista em BRL** — ou
seja, o defeito é acionado por esta fase, e conserta-se dentro dela.

## Decisões

**A moeda escolhida vale para a cobrança**, não só para a exibição. Não existe
"preço de referência": o número que o comprador vê é o número que o provedor
cobra. Moeda de apresentação e moeda de liquidação são independentes — a conta
brasileira liquida em real de qualquer forma, com o câmbio do provedor, e isso
não muda por causa desta fase. O que muda é que o comprador passa a ver um valor
que consegue avaliar.

**O palpite inicial vem da geografia do IP, com o idioma como fallback.**
`BR → BRL`, `US`/`CA` → `USD`, resto → `EUR`. A alternativa (palpite pelo idioma
da URL) erra os dois casos reais: o alemão morando no Brasil e o brasileiro
lendo em inglês. A moeda é **independente do idioma** nos dois sentidos — trocar
de idioma não troca a moeda, e vice-versa.

**Os preços em BRL e USD são cadastrados, com um gerador em massa para semear.**
A taxa que o gerador usa é digitada pelo admin, aplicada uma vez, e o valor
gravado é fixo e editável. A taxa não sobrevive à operação: não fica em nenhuma
tela nem em nenhum cálculo posterior.

**Sem preço na moeda escolhida:** na vitrine, exibe EUR com o símbolo € explícito
(nunca R$ sobre um número em euro). No checkout, **erro** — fallback silencioso
ali significa cobrar diferente do que foi mostrado.

## Arquitetura

### 1. Dados

```
model LeadListPrice {
  id       String   @id @default(cuid())
  listId   String
  list     LeadList @relation(fields: [listId], references: [id], onDelete: Cascade)
  currency String
  amount   Decimal  @db.Decimal(10, 2)

  @@unique([listId, currency])
  @@index([listId])
}
```

`LeadList.price` e `LeadList.currency` **permanecem**, significando o preço em
EUR. Renomear ou remover campo com compra paga e 19 listas ativas no ar troca um
ganho de elegância por risco desnecessário. A migração cria a tabela e semeia
uma linha por lista a partir de `price`/`currency` — as 20 são EUR, então a
semeadura é direta e verificável por contagem.

Consequência a administrar: o preço em EUR passa a existir em dois lugares. A
regra é **um único caminho de escrita** (`lib/marketplace/list-prices.ts`), que
grava a linha EUR e `LeadList.price` na mesma transação. Nenhum outro módulo
escreve preço. Um teste garante a igualdade dos dois para toda lista ativa.

Leitura: `LeadListPrice` é a fonte de verdade. `LeadList.price` fica como o
espelho que o resto do sistema (SEO, super-admin, e-mail) já consome.

### 2. Resolução da moeda — `lib/currency/`

Módulo novo e isolado, sem dependência de React nem de Prisma:

- `SUPPORTED_CURRENCIES` (`["EUR","BRL","USD"]`) e `DEFAULT_CURRENCY` (`EUR`)
- `guessCurrency({ country, locale })` — a tabela de palpite, função pura
- `parseCurrency(value)` — valida um código vindo de cookie ou de request

O `proxy.ts` lê `x-vercel-ip-country` e grava o cookie `CURRENCY` **só quando ele
ainda não existe**; escolha explícita do usuário nunca é sobrescrita. Sem o
header (desenvolvimento local, outro host), o palpite cai no idioma da URL.

A consulta geográfica acontece uma vez, no proxy. **As páginas só leem o
cookie.** Isso é deliberado: ler geografia dentro do render foi o que já tornou
o funil inteiro dinâmico uma vez neste projeto, e o custo não é aceitável de
novo.

`CurrencySwitcher` no header do marketplace, ao lado do `LocaleSwitcher` e com o
mesmo padrão (dropdown + server action gravando cookie + `router.refresh()`).

### 3. Vitrine

Catálogo já é `force-dynamic`. `app/[locale]/list/[slug]/page.tsx` passa a
resolver o preço pela moeda do cookie. O helper de leitura devolve sempre
`{ amount, currency }` — quem renderiza nunca precisa saber se houve fallback,
só recebe a moeda que de fato vai exibir.

`formatCurrency` (`lib/utils.ts`) hoje deriva o locale da moeda: BRL sempre sai
`pt-BR`, mesmo para um leitor alemão. Passa a receber o locale ativo e usar a
moeda apenas como moeda.

### 4. Carrinho

O carrinho continua guardando preço em `localStorage`, e uma server action
`resolveCartPrices(listIds, currency)` reescreve os itens quando a moeda troca e
quando o carrinho abre. Se **qualquer** item não tiver preço na moeda escolhida,
o carrinho inteiro cai para EUR com aviso — um carrinho com duas moedas não tem
total.

Foi considerada a alternativa de o carrinho guardar só `listId` + quantidade,
resolvendo preço no servidor sempre. Elimina a classe de bug inteira, mas mexe
em drawer, badge, página de carrinho e checkout de uma vez. Preço velho no
`localStorage` nunca foi risco de dinheiro — os dois provedores já ignoram
qualquer valor vindo do cliente — só de exibição. Fica registrada como melhoria
possível, fora desta fase.

### 5. Checkout

Nos dois provedores, o cliente passa a enviar **no máximo o código da moeda**. O
servidor valida contra `SUPPORTED_CURRENCIES` e resolve os preços por
`LeadListPrice`. Item sem preço na moeda pedida → `400`, sem fallback. A
verificação de moeda única do carrinho continua, agora sobre a moeda resolvida.

`PayPalScriptProvider` deixa de fixar `EUR` e recebe a moeda da compra.

`lib/checkout/fulfillment.ts` já compara valor **e** moeda capturados contra o
`Purchase` (`amountMatches`), então a checagem que impede pagar 45 BRL numa
compra de 45 EUR já existe e continua valendo sem alteração.

### 6. Admin

- Form da lista: campos opcionais BRL e USD ao lado do de EUR (que segue
  obrigatório). O seletor de moeda por lista sai — a lista não tem mais *uma*
  moeda.
- Ação em massa no super-admin: o admin digita a taxa por moeda, e a ação
  preenche **apenas** as listas sem preço naquela moeda, com arredondamento
  comercial. Mostra o que vai fazer antes de fazer. Auditada via `recordAudit`,
  como as outras mutations administrativas.

### 7. Falsidades que a fase obriga a corrigir

Três coisas hoje inofensivas porque só existe EUR:

- `app/[locale]/my-purchases/page.tsx:95` soma `totalSpent` de todas as compras e
  rotula o total com a moeda da **primeira**. Com moedas mistas, é um número que
  não existe. Passa a total por moeda.
- `components/marketplace/cart-drawer.tsx:70` formata o total com
  `items[0]?.currency`. Passa a usar a moeda resolvida do carrinho.
- `buildProductSchema` (`lib/seo/schema.ts`) emite um único `priceCurrency`.
  Passa a emitir um `Offer` por moeda cadastrada. O crawler não tem cookie: um
  schema em € sobre uma página renderizada em R$ é dado estruturado amplificando
  divergência, que é precisamente o que este projeto já decidiu não fazer.

## Fora de escopo

- **Conversão de câmbio em runtime.** Nenhuma cotação é consultada, nunca.
- **Moeda no `/super-admin`.** Operação interna segue em EUR; relatório
  administrativo não é vitrine.
- **Generalizar os campos `paypalOrderId`/`paypalPayerId` do `Purchase`.** É
  PAY-1, tarefa própria.
- **Escolher provedor por moeda** (ex.: BRL só no Stripe). Depende de
  configuração de conta ainda não confirmada; hoje os dois recebem a mesma moeda.
- **Carrinho sem preço no `localStorage`** (seção 4).

## Pendência externa registrada

Cobrar em três moedas expõe spread de câmbio em toda venda que não seja na moeda
de liquidação da conta — o que já acontece hoje, já que hoje toda venda é em EUR
numa conta brasileira. A fase não piora nem melhora isso; só passa a haver vendas
em BRL, que liquidam sem spread. **O tratamento contábil de receita em três
moedas como pessoa física é assunto do contador**, já registrado como pendência
do Werner, e não bloqueia esta implementação.

## Verificação de aceite

- [ ] Migração aplicada: `select count(*) from lead_list_prices where currency='EUR'` = 20, e cada `amount` igual ao `LeadList.price` correspondente
- [ ] Teste-guarda: toda lista ativa tem preço em EUR; falha se uma lista for criada sem ele
- [ ] Teste-guarda: `LeadList.price` e a linha EUR de `LeadListPrice` batem para toda lista ativa
- [ ] `lib/currency/` tem teste de unidade cobrindo palpite (BR/US/CA/outros), ausência de header, código inválido em cookie
- [ ] Trocar a moeda no header muda os preços do catálogo e da página de lista sem trocar o idioma; trocar o idioma não muda a moeda
- [ ] Visitante novo com `x-vercel-ip-country: BR` vê R$ sem clicar em nada; com `DE`, vê €
- [ ] Escolha explícita de moeda sobrevive a uma nova visita (cookie não é sobrescrito pelo proxy)
- [ ] Lista sem preço em BRL, com BRL escolhido, exibe o preço em EUR com € explícito — nunca R$
- [ ] Carrinho com um item sem preço na moeda escolhida cai inteiro para EUR e mostra o aviso
- [ ] Teste de integração: `create-order` e `create-session` ignoram qualquer valor de preço enviado no corpo, e devolvem 400 para moeda fora de `SUPPORTED_CURRENCIES`
- [ ] Compra em BRL fecha ponta a ponta no Stripe (sessão criada em `brl`, `Purchase.currency = BRL`, `amountMatches` valida na captura)
- [ ] `PayPalScriptProvider` recebe a moeda da compra; `grep -n 'currency: "EUR"' components/checkout/` não encontra literal
- [ ] Gerador em massa não sobrescreve preço existente (rodar duas vezes com taxas diferentes não altera o segundo resultado) e grava `AuditLog`
- [ ] `/my-purchases` com compras em duas moedas mostra um total por moeda, nenhum total somando as duas
- [ ] JSON-LD da página de lista traz um `Offer` por moeda cadastrada, e o preço visível na página está entre eles
- [ ] `npx tsc --noEmit && npm run lint && npx vitest run && npm run build` — exit 0
