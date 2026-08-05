# Paddle como provedor internacional, ao lado do Mercado Pago

**Data:** 2026-08-05
**Estado:** aprovado, pronto para plano de implementação

## Contexto

O Mercado Pago entrou em produção em 2026-08-05 e funciona: uma compra real foi
paga por Pix, efetivada pelo webhook e entregue por e-mail. O que ele **não**
resolve é a venda internacional, e a razão é mais dura do que "cartão estrangeiro
costuma ser recusado".

Consulta a `GET /v1/identification_types` com o token da conta devolve exatamente
dois tipos:

```json
[{"id":"CPF","min_length":11,"max_length":11},
 {"id":"CNPJ","min_length":14,"max_length":14}]
```

Não há passaporte nem documento estrangeiro. O Checkout Pro de uma conta
brasileira (site MLB) exige identificação fiscal brasileira do pagador. Um
comprador europeu não trava na recusa do cartão — ele **trava no formulário**,
porque não existe campo que ele consiga preencher.

Isso invalida uma premissa da spec de 2026-08-03, que previa o comprador europeu
vendo €45 na vitrine e pagando o equivalente em reais. Ele não consegue pagar de
forma nenhuma.

O Paddle entra para cobrir esse caso. Stripe (pendências na conta) e PayPal (conta
cancelada) continuam fora.

### O que o Paddle é, e por que isso importa

O Paddle é **Merchant of Record**: ele é o vendedor perante o comprador. Aparece na
fatura dele, recolhe o IVA europeu e assume a relação fiscal. Isso não é detalhe de
integração — muda o que as páginas legais precisam dizer, e é a razão pela qual o
próprio Paddle analisa o site antes de liberar cobrança.

### Risco a registrar

**A aprovação do Paddle é o gargalo, não o código.** Verificação de domínio,
descrição do produto, política de reembolso e dados da empresa passam por análise
que leva dias e pode ser recusada — marketplace de listas de contatos já foi
recusado por dois adquirentes (Stripe e PayPal). Por isso as páginas legais vêm
primeiro nesta ordem de trabalho: elas são pré-requisito da análise.

Se a recusa vier, o trabalho de código é perdido. Submeter para aprovação antes de
implementar é decisão consciente de sequenciamento.

## Escopo

### Dentro

- Páginas legais nos 7 idiomas: Paddle como vendedor registrado, IVA, política de
  reembolso, remoção de Stripe e PayPal dos textos. **Primeiro item.**
- Cliente do Paddle, criação de transação com preços não-catálogo e webhook.
- `paddle` no enum `PaymentProvider` e coluna `paddleTransactionId` em `Purchase`.
- Roteamento por moeda do carrinho, imposto nos dois lados (cliente e servidor).
- Liberação do CSP para os domínios do Paddle.
- Botão do Paddle no checkout, ao lado do fluxo existente do Mercado Pago.

### Fora, de propósito

- Assinaturas e planos (este trabalho não toca no caminho de assinatura).
- Reembolso pelo painel administrativo — reembolso do Paddle é feito no painel dele.
- Remoção de Stripe e PayPal do código (só dos textos legais).
- Cross Border do Mercado Pago — alternativa descartada em favor do Paddle.
- Catálogo de produtos espelhado no Paddle (ver "Preços").

## Roteamento entre provedores

A **moeda do carrinho** decide:

| moeda do carrinho | provedor |
|---|---|
| `BRL` | Mercado Pago (Pix, cartão, débito, saldo) |
| `EUR`, `USD` | Paddle |

O site já tem seletor de moeda e preços cadastrados por moeda, então a regra usa
peça existente e é previsível para o comprador: ele vê a moeda e sabe o que vai
pagar.

**O imposto vale nos dois lados.** A tela do checkout escolhe qual botão renderiza,
e as rotas do servidor recusam a moeda errada — carrinho em BRL numa rota do Paddle
responde 400, e vice-versa. Portão apenas no cliente é portão que não existe.

Alternativas descartadas: deixar o comprador escolher entre os dois (o brasileiro
pagaria spread à toa e o europeu travaria no CPF, que é o problema que estamos
resolvendo); rotear por país detectado (VPN e brasileiro morando fora erram, e o
comprador não tem como corrigir).

## Preços

**Nenhum catálogo no Paddle.** O servidor cria a transação com preços
não-catálogo, e o valor sai de `resolveListPrices` no servidor — a mesma regra que
o projeto já defende em PayPal, Stripe e Mercado Pago: preço nunca vem do cliente.

Alternativa descartada: espelhar as 34 listas como Product + Price no painel do
Paddle. Daria relatórios mais legíveis por produto, ao custo de duas fontes de
verdade — mudar um preço exigiria mexer nos dois lugares, e o dia em que
divergissem o comprador pagaria o valor errado.

### Imposto embutido no preço — a decisão que faz o fluxo funcionar

As transações são criadas com preço **tax-inclusive**.

Isto não é preferência estética. Como Merchant of Record, o Paddle cobra o IVA. Com
preço *tax-exclusive*, o `grand_total` da transação volta como preço + IVA, e
`amountMatches` (`lib/checkout/fulfillment.ts`) compararia €45,00 esperado com
€53,55 cobrado, devolveria `amount_mismatch`, e **nenhuma compra internacional
seria efetivada**. O sintoma em produção seria a pior forma possível: compra paga
que nunca libera o download.

Com preço tax-inclusive, o europeu vê €45 e paga €45, o IVA sai de dentro, e
`amountMatches` continua intocado comparando `grand_total` com o nosso total. É
também a norma na UE, onde preço anunciado ao consumidor inclui imposto.

## Chave de correlação

Igual ao Mercado Pago, e pela mesma razão: a `Purchase` nasce **antes** da
transação, e o `purchase.id` viaja no `custom_data`.

1. Criar `Purchase` com `status: pending`, `provider: paddle`, valores na moeda do
   carrinho.
2. Criar a transação no Paddle com `custom_data = { purchaseId }`.
3. Gravar `paddleTransactionId` na compra.
4. Se o passo 2 falhar, marcar a compra `failed` — não deixar pendente órfão.

No mapa `BUSCA_POR_PROVEDOR`, `paddle` busca por `{ id }` — mesma cláusula do
`mercadopago`.

## Modelo de dados

```prisma
enum PaymentProvider {
  paypal
  stripe
  mercadopago
  paddle
}
```

Campo novo em `Purchase`:

```prisma
paddleTransactionId String? @unique
```

Uma coluna só. O Mercado Pago precisou de duas porque preferência e pagamento são
entidades distintas; no Paddle a transação **é** o pagamento. A coluna serve para
conciliação manual quando alguém abrir um ticket, não para correlação.

Migration Prisma sem shadow database, como as demais deste projeto.

## Componentes

### `lib/paddle.ts`

Cliente fino sobre `fetch`, **não** o SDK oficial — mesma razão do Mercado Pago: são
poucos endpoints e não vale acoplar o caminho do dinheiro a uma dependência a mais.

- `isPaddleConfigured(): boolean`
- `createTransaction(...)` / `getTransaction(id)`
- Conversão de valores: o Paddle trabalha em **unidade mínima** da moeda (centavos),
  como o Stripe e diferente do Mercado Pago. A conversão é de escala, não de
  arredondamento.
- `verifyPaddleSignature(...)` — pura, sem rede.

### Verificação de assinatura

Header `Paddle-Signature: ts=<unix>;h1=<hex>`. O manifesto é `ts:corpo_cru`,
HMAC-SHA256, comparado em tempo constante.

**O corpo precisa ser lido cru**, sem `JSON.parse` antes: qualquer reformatação
quebra a assinatura. Este é o erro clássico da integração e está registrado aqui
porque o custo dele é um webhook que rejeita tudo em produção.

Fail-closed: sem secret ou com assinatura inválida, 401 sem processar.

### Variáveis de ambiente

```
PADDLE_API_KEY
PADDLE_WEBHOOK_SECRET
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
NEXT_PUBLIC_PADDLE_ENV          # sandbox | production
```

`NEXT_PUBLIC_PADDLE_ENV` existe porque o Paddle tem sandbox real, com domínio
separado — dá para testar sem dinheiro, diferente do Mercado Pago.

### Content-Security-Policy

O CSP atual (`next.config.ts`) é `script-src 'self' 'unsafe-inline'`, e o
`frame-src` libera apenas PayPal. Isso **bloqueia o Paddle.js**, que carrega de
`cdn.paddle.com`, e bloqueia o iframe do overlay.

Sem essa liberação a integração não funciona nem em desenvolvimento, e o sintoma
seria um botão que não faz nada, com erro apenas no console. `script-src`,
`connect-src` e `frame-src` ganham os domínios do Paddle — e nada além deles.

## Fluxo de checkout

O Paddle usa **overlay**: o comprador não sai do site, o checkout abre sobre a
página. Consequências, todas simplificações em relação ao Mercado Pago:

- Não há página de retorno.
- Não há `back_urls`.
- O caminho de confirmação é mais curto.

O webhook continua sendo a autoridade.

## Rotas

### `POST /api/checkout/paddle/create-transaction`

Mesma autenticação (`getAuthenticatedActiveDbUser`), mesmo rate limit persistido
(bucket `checkout:create`, 10/min), mesmo backstop de 15 pendentes por hora, mesmo
`checkoutRequestSchema` — tudo espelhando `create-preference` do Mercado Pago.

Diferenças: resolve preços na moeda do carrinho (EUR ou USD), **recusa BRL com
400**, e cria a `Purchase` antes da transação.

Devolve `{ transactionId, purchaseId }`.

### `POST /api/checkout/paddle/confirm-transaction`

Caminho rápido, chamado quando o overlay avisa que concluiu. Faz `getTransaction` e
chama `fulfillPurchase`.

Existe por UX: o comprador está olhando a tela, e esperar o webhook seriam segundos
de nada acontecendo. O webhook é a rede de reconciliação.

A corrida entre esta rota e o webhook não é risco novo — é a mesma que o
`updateMany` condicional de `fulfillPurchase` resolve, e que foi **observada em
produção em 2026-08-05** no fluxo do Mercado Pago (webhook às 15:01:10,
`confirm-payment` às 15:01:24, um único e-mail enviado).

### `POST /api/checkout/paddle/webhook`

Corpo lido cru. Assinatura obrigatória e fail-closed.

**Apenas `transaction.completed` age.** Todo outro evento responde 200 e registra
log.

Isso é deliberadamente menos ambicioso que o webhook do Mercado Pago, onde
`rejected` marca a compra `failed`. No Paddle o comprador pode tentar outro cartão
dentro do mesmo overlay: tratar uma tentativa recusada como pedido morto recriaria
exatamente o bug corrigido em `64c82d7` — recusa encerra a tentativa, não o pedido.

Erro de processamento responde 500 para o Paddle reentregar.

Diferente do Mercado Pago, o webhook do Paddle **não consulta a API**: a notificação
já traz o corpo completo, com `custom_data`, `grand_total` e `currency_code`. Não há
o caso de "transação inexistente" que obrigou o tratamento de 404 em `fed5c05` — a
falha permanente equivalente aqui é notificação sem `purchaseId` em `custom_data`,
que responde 200 e é descartada com log.

O 404 existe apenas em `confirm-transaction`, que consulta por conta própria, e lá é
devolvido ao cliente.

## Páginas legais

Nos 7 idiomas (`content/legal/terms.*.ts`, `content/legal/privacy.*.ts`), e **antes
do código**, porque a aprovação do Paddle depende delas estarem no ar.

- Paddle nomeado como **vendedor registrado** (Merchant of Record) na venda
  internacional, responsável pelo recolhimento do IVA.
- Mercado Pago nomeado como processador na venda em reais.
- Política de reembolso explícita.
- **Stripe e PayPal saem dos textos.** Eles não processam nada hoje, e citar
  processador inexistente para o titular dos dados é informação incorreta, não
  apenas texto desatualizado. As rotas e o código dos dois continuam onde estão.

## Tratamento de erro

| situação | resposta |
|---|---|
| Paddle não configurado | 503 |
| Carrinho em BRL nesta rota | 400 |
| Corpo inválido | 400 |
| Não autenticado | 401 |
| Rate limit / excesso de pendentes | 429 |
| Falha ao criar a transação | 500, compra marcada `failed` |
| Webhook sem secret ou assinatura inválida | 401, sem processar |
| Webhook sem `purchaseId` em `custom_data` | 200, evento descartado com log |
| `confirm-transaction` com transação inexistente | 404 |
| Erro ao processar webhook | 500, para reentrega |
| Valor divergente | compra **não** é efetivada (`amount_mismatch`) |

## Testes

No padrão do repositório — funções puras testadas sem rede, banco injetado por
parâmetro. Nenhum teste toca o banco.

- Conversão de valores para a unidade mínima do Paddle e de volta.
- Verificação de assinatura: válida, ausente, `ts` adulterado, `h1` de tamanho
  diferente (o `timingSafeEqual` lança quando os buffers diferem em tamanho).
- Corpo reformatado invalida a assinatura — trava a leitura crua.
- Guarda de moeda: carrinho em BRL recusado com 400.
- `fulfillPurchase` com `provider: "paddle"`: aprovação, valor divergente, compra
  inexistente, compra já paga.
- Corrida entre `confirm-transaction` e webhook: apenas um efetiva, um e-mail só.
- Roteamento: carrinho em EUR não oferece Mercado Pago; carrinho em BRL não oferece
  Paddle.

## Critérios de aceite

1. Com as quatro variáveis preenchidas em sandbox, uma compra com carrinho em EUR
   vai do carrinho ao download.
2. O valor cobrado é exatamente o preço anunciado, com o IVA por dentro — nenhuma
   compra termina em `amount_mismatch` por causa de imposto.
3. Compra concluída com a aba fechada antes da confirmação é efetivada pelo webhook
   e dispara o e-mail.
4. Webhook com assinatura inválida é rejeitado com 401 e não altera nenhuma compra.
5. `confirm-transaction` e webhook chegando juntos efetivam a compra uma vez só e
   enviam um único e-mail.
6. Carrinho em BRL não oferece Paddle; carrinho em EUR ou USD não oferece Mercado
   Pago. As rotas recusam a moeda errada mesmo se chamadas diretamente.
7. O Paddle.js carrega sem erro de CSP, em desenvolvimento e em produção.
8. As páginas legais nos 7 idiomas nomeiam Paddle e Mercado Pago, e não citam mais
   Stripe nem PayPal.
