# Mercado Pago como provedor único de pagamento

**Data:** 2026-08-03
**Estado:** aprovado, pronto para plano de implementação

## Contexto

O marketplace hoje aceita pagamento por dois provedores: PayPal (original) e Stripe
(adicionado pelo plano `2026-07-25-stripe-segundo-provedor`). Os dois deixaram de
estar disponíveis:

- **Stripe:** conta com pendências não resolvidas. O Pix nunca foi liberado (é
  invite-only) e a conta brasileira liquida apenas em BRL.
- **PayPal:** conta cancelada pelo provedor, sem explicação.

O Mercado Pago passa a ser o único caminho de recebimento. Isso não é uma escolha
de arquitetura — é uma restrição herdada.

### Restrição de moeda (verificada)

O Checkout Pro aceita cartões emitidos em qualquer país, mas **não cobra em
qualquer moeda**. O `currency_id` de uma preferência é preso ao país da conta:
conta brasileira (site MLB) cobra em BRL. Um cartão estrangeiro paga um valor em
reais e o banco emissor faz a conversão, com IOF e spread por conta do comprador.

O Mercado Pago **não converte automaticamente**. Enviar `49.90` com a intenção de
"49,90 USD" resulta em cobrança de **R$ 49,90** — o número passa, a moeda não, e
não há erro de API. Esse é o modo de falha que este desenho existe para impedir.

Existe uma solução Cross Border que liquida em USD, mas exige liberação comercial
(contato com `crm_regionales@mercadopago.com`, documentação da empresa) e o
parâmetro `counter_currency`. Não é autoatendimento e está fora de escopo.

### Decisão de produto

A vitrine continua multimoeda (EUR/BRL/USD). A cobrança é sempre em BRL, com o
valor em reais exibido explicitamente antes do redirecionamento.

### Risco a registrar

Dois adquirentes já recusaram a operação. Marketplace de listas de leads é
categoria que costuma ser marcada como risco (dados pessoais, venda de contatos).
O Mercado Pago pode questionar também. Por isso a abstração de provedor
permanece de pé mesmo com um provedor só, e Stripe/PayPal saem da tela sem sair
do código.

## Escopo

### Dentro

- Cliente do Mercado Pago e conversões de valor.
- Criação de preferência do Checkout Pro, página de retorno e webhook.
- `mercadopago` no enum `PaymentProvider` e campos correspondentes em `Purchase`.
- Fluxo assíncrono do Pix (pagamento aprovado depois do redirecionamento).
- Preço em BRL obrigatório por lista.
- Aviso de cobrança em reais para carrinhos em EUR/USD, nos 7 idiomas.
- Ocultar os botões de Stripe e PayPal no checkout.

### Fora, de propósito

- Assinaturas e planos (`Workspace.subscriptionId`, `stripeCustomerId` — este
  trabalho não toca no caminho de assinatura).
- Reembolso pelo painel administrativo.
- Cross Border do Mercado Pago (depende de liberação comercial).
- Remoção de Stripe e PayPal do código.

## Regra de moeda

A cobrança usa o preço BRL **já cadastrado** da lista, nunca um valor convertido
em runtime. Isso mantém a regra que o projeto já defende em
`lib/currency/index.ts`: preço convertido na hora flutua entre a vitrine e o
checkout, e a diferença aparece no momento exato em que a pessoa decide pagar.

### Preço em BRL passa a ser obrigatório

`writeListPrices` (`lib/marketplace/list-prices.ts`) hoje exige apenas EUR e trata
BRL como preço opcional. Com o Mercado Pago sozinho, lista sem preço em BRL é
lista que ninguém consegue comprar.

- EUR continua obrigatório — é a moeda de referência da exibição.
- BRL passa a ser obrigatório ao lado dele.
- `writeListPrices` lança erro se qualquer um dos dois faltar.
- O formulário do super-admin recusa salvar sem os dois.

Listas existentes sem preço em BRL precisam ser preenchidas antes de voltarem a
ser vendáveis. O plano de implementação deve verificar quantas são.

### O que fica gravado na compra

`Purchase.total` e `Purchase.currency` guardam **o que foi efetivamente cobrado**:
o valor em reais, `currency = "BRL"`. Idem para `PurchaseItem.price` /
`PurchaseItem.currency`.

Um comprador europeu que viu €45 na vitrine terá recibo e "Minhas compras" em
reais, porque foi isso que saiu da conta dele.

Alternativa descartada: guardar o par cobrado/exibido em colunas separadas. Isso
adiciona estado para um caso que desaparece assim que houver um provedor
internacional de novo.

Efeito colateral desejado: `amountMatches` (`lib/checkout/fulfillment.ts`)
continua correto sem alteração — compara BRL com BRL.

## Modelo de dados

```prisma
enum PaymentProvider {
  paypal
  stripe
  mercadopago
}
```

Campos novos em `Purchase`:

```prisma
mercadoPagoPreferenceId String? @unique
mercadoPagoPaymentId    String?
```

Migration Prisma sem shadow database, como as demais deste projeto.

## Chave de correlação

Esta é a diferença estrutural em relação ao Stripe.

O webhook do Mercado Pago entrega **apenas o ID do pagamento**. Status, valor,
moeda e vínculo com o pedido só existem após um `GET /v1/payments/{id}`. O campo
que amarra o pagamento ao nosso domínio é o `external_reference`, definido por nós
na preferência.

Portanto a chave de fulfillment é o **nosso** `purchase.id`, não um identificador
do provedor.

Consequência: a ordem de criação inverte em relação ao Stripe. A `Purchase` é
criada **antes** da preferência.

1. Criar `Purchase` com `status: pending`, `provider: mercadopago`, valores em BRL.
2. Criar a preferência com `external_reference = purchase.id`.
3. Gravar `mercadoPagoPreferenceId` na compra.
4. Se o passo 2 falhar, marcar a compra como `failed` — não deixar pendente órfão.

### Refatoração pontual em `fulfillPurchase`

`fulfillPurchase` resolve o `where` da busca com um ternário
(`provider === "paypal" ? { paypalOrderId } : { stripeSessionId }`). Com três
provedores — e um deles buscando pela chave própria, não do provedor — isso deixa
de ser legível e passa a ser um lugar onde um erro silencioso cabe.

Vira um mapa explícito de provedor → cláusula de busca:

| provider | busca por |
|---|---|
| `paypal` | `{ paypalOrderId: providerOrderId }` |
| `stripe` | `{ stripeSessionId: providerOrderId }` |
| `mercadopago` | `{ id: providerOrderId }` |

O resto de `fulfillPurchase` — transição condicional `pending → paid`,
idempotência via `updateMany`, e-mail de confirmação disparado uma vez só —
permanece inalterado e passa a servir os três provedores.

## Componentes

### `lib/mercadopago.ts`

Cliente fino sobre `fetch`, **não** o SDK oficial. São dois endpoints
(`POST /checkout/preferences`, `GET /v1/payments/{id}`) e o SDK do Mercado Pago
tem histórico de tipagem instável — não vale acoplar o caminho do dinheiro a isso.

Espelha `lib/stripe.ts`:

- `isMercadoPagoConfigured(): boolean` — presença do access token habilita o
  provedor no servidor.
- `createPreference(...)` / `getPayment(id)`.
- Conversão de valor pura e testável. O Mercado Pago usa decimal, não a menor
  unidade da moeda: a conversão é de arredondamento para 2 casas, não de escala.
- `verifyWebhookSignature(...)` — pura, sem rede.

### `lib/server-env.ts`

```ts
getMercadoPagoServerConfig()   // MERCADOPAGO_ACCESS_TOKEN
getMercadoPagoWebhookSecret()  // MERCADOPAGO_WEBHOOK_SECRET
```

O secret do webhook em getter próprio, pelo mesmo motivo do Stripe: a rota de
criação de preferência não pode falhar por uma variável que só o webhook usa.

### `lib/env.ts`

`getOptionalPublicMercadoPagoPublicKey()` — `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` é
o sinal público de "provedor habilitado" para a UI, espelhando o padrão de Stripe
e PayPal.

### Variáveis de ambiente

```
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_WEBHOOK_SECRET
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
```

## Rotas

### `POST /api/checkout/mercadopago/create-preference`

Espelha `create-session` do Stripe: mesma autenticação
(`getAuthenticatedActiveDbUser`), mesmo rate limit persistido (bucket
`checkout:create`, 10/min), mesmo backstop de 15 pendentes por hora, mesmo
`checkoutRequestSchema`.

Diferenças:

- Resolve preços com `resolveListPrices(prisma, listIds, "BRL")`
  **independentemente da moeda do carrinho**.
- Item sem preço em BRL → 400. Nada de queda para EUR aqui: a queda para euro é
  comportamento de vitrine, e cobrar em moeda diferente da exibida é cobrar
  diferente do combinado.
- Cria a `Purchase` antes da preferência (ver "Chave de correlação").
- `back_urls` de sucesso/pendente/falha e `notification_url` do webhook.
- Devolve o `init_point` para o redirecionamento.

### `GET /api/checkout/mercadopago/confirm-payment`

Chamada pela página de retorno `/[locale]/checkout/mercadopago-return`. Faz
`getPayment` e chama `fulfillPurchase`. É o caminho rápido; o webhook é a rede de
reconciliação.

### `POST /api/checkout/mercadopago/webhook`

Corpo lido cru. Assinatura obrigatória e **fail-closed**, como a do Stripe: sem
`MERCADOPAGO_WEBHOOK_SECRET` ou com assinatura inválida, responde 401 e não
processa.

Verificação: HMAC-SHA256 sobre o manifesto
`id:{data.id};request-id:{x-request-id};ts:{ts};`, comparado com `v1` do header
`x-signature`, usando comparação de tempo constante.

Erro de processamento responde 500 para o Mercado Pago reentregar.

## Fluxo do Pix

Com o Stripe, o único meio habilitado era cartão, que chega sempre `paid` — o
webhook era quase redundância. Com Pix, o comprador sai do site para o app do
banco e volta minutos depois, ou não volta nunca. O webhook passa a ser o caminho
principal, não a rede.

Mapeamento de `payment.status`:

| status | ação |
|---|---|
| `approved` | `fulfillPurchase` — efetiva e envia o e-mail |
| `pending`, `in_process`, `authorized` | nada. O Mercado Pago reenvia ao aprovar |
| `rejected`, `cancelled` | marca a compra `failed` se ainda estiver `pending` |
| `refunded`, `charged_back` | fora de escopo neste trabalho; apenas registra log |

Nunca marcar `failed` uma compra já `paid`.

## Meios de pagamento

Nada de allowlist. O Checkout Pro já oferece Pix, cartão de crédito, cartão de
débito, saldo Mercado Pago e PayPal por padrão.

A configuração é uma exclusão só:

```json
"payment_methods": { "excluded_payment_types": [{ "id": "ticket" }] }
```

Boleto fica de fora: compensação em até 3 dias úteis não combina com produto de
entrega imediata.

Excluir o que não se quer é mais seguro que listar o que se quer — um método novo
que o Mercado Pago lançar entra sozinho, em vez de sumir sem ninguém notar.

**Sobre o PayPal:** Mercado Livre e PayPal têm parceria no Brasil, e o PayPal
aparece como meio de pagamento dentro do checkout do Mercado Pago. Quem conecta a
conta é o **comprador**, na carteira dele. Não é necessária conta PayPal de
vendedor, e o dinheiro liquida no Mercado Pago. Não há nada a configurar por API
além de não excluir o método.

**Sobre o Apple Pay:** não disponível. O Mercado Pago não tem integração com Apple
Pay no Brasil.

## Aviso de conversão

Quando o carrinho está em EUR ou USD, o checkout exibe — antes do botão — o valor
exato em reais que será cobrado, e a nota de que o banco do comprador faz a
conversão.

O número vem de `GET /api/checkout/mercadopago/quote`: mesmos itens, total
calculado em BRL no servidor. O preço nunca sai do cliente.

Se a cotação falhar, o botão não aparece. Melhor não vender que redirecionar
alguém para um valor que ele não viu.

Textos novos nos 7 idiomas (`messages/*.json`).

## Stripe e PayPal no checkout

Os botões saem da tela. As rotas, os webhooks, o enum e as compras históricas
ficam intactos — religar qualquer um dos dois volta a ser questão de variável de
ambiente.

O aviso de "nenhum provedor configurado" em `app/[locale]/checkout/page.tsx` passa
a considerar os três provedores.

## Tratamento de erro

| situação | resposta |
|---|---|
| Provedor não configurado | 503 |
| Corpo inválido | 400 |
| Item sem preço em BRL | 400 |
| Não autenticado | 401 |
| Rate limit / excesso de pendentes | 429 |
| Falha ao criar preferência | 500, compra marcada `failed` |
| Webhook sem secret ou assinatura inválida | 401, sem processar |
| Erro ao processar webhook | 500, para reentrega |
| Valor divergente | compra **não** é efetivada (`amount_mismatch`) |

## Testes

Nos mesmos moldes de `lib/stripe.test.ts` e `lib/checkout/fulfillment.test.ts` —
funções puras testadas sem rede, banco injetado por parâmetro.

- Conversão de valores para o formato do Mercado Pago.
- Verificação de assinatura do webhook: válida, inválida, ausente, `ts` adulterado.
- `fulfillPurchase` com `provider: mercadopago`: aprovação, valor divergente,
  compra inexistente, compra já paga.
- Corrida entre `confirm-payment` e webhook: apenas um efetiva, e-mail enviado uma
  vez só.
- Ciclo do Pix: `pending` não efetiva; `approved` posterior efetiva exatamente uma
  vez.
- `rejected` marca `failed`; `rejected` sobre compra já `paid` não altera nada.
- `writeListPrices` recusa lista sem BRL e sem EUR.
- `create-preference` recusa item sem preço em BRL com 400.

## Critérios de aceite

1. Com as três variáveis preenchidas, uma compra em BRL vai do carrinho ao
   download com Pix, cartão de crédito e cartão de débito.
2. Uma compra iniciada com o carrinho em EUR cobra o preço BRL cadastrado, e o
   valor em reais aparece na tela antes do redirecionamento.
3. Pagamento por Pix concluído com a aba fechada efetiva a compra pelo webhook e
   dispara o e-mail.
4. Webhook com assinatura inválida é rejeitado com 401 e não altera nenhuma compra.
5. `confirm-payment` e webhook chegando juntos efetivam a compra uma vez só e
   enviam um único e-mail.
6. Lista sem preço em BRL não pode ser salva no super-admin nem comprada.
7. Sem as variáveis do Mercado Pago, o checkout exibe o aviso de provedor
   indisponível em vez de um cartão vazio.
