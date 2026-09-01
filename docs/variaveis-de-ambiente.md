# Variáveis de ambiente

Lista das variáveis que o Easy Prospect usa, o que cada uma faz e onde obter o valor.

**Este arquivo não contém valores.** Tudo que casa com `.env*` está no `.gitignore`
(linha 34) e nunca deve ser versionado — **o repositório é público**. Credencial vive em
dois lugares e só neles: no `.env.local` da sua máquina, e no painel da Vercel.

> **Variável nova só passa a valer no build seguinte.** Depois de cadastrar na Vercel,
> force um **Redeploy** — salvar não basta.

Para conferir o que está configurado em produção sem expor valor nenhum, use o painel
**Super admin → Configurações**: ele lista cada variável com um status de "configurado"
e o valor mascarado.

## Pagamento

**Quem escolhe o provedor é o comprador, não o sistema.** O checkout mostra um botão por
provedor configurado, e cada botão se auto-esconde quando falta a chave pública dele. Ou
seja, ligar um provedor não obriga a ligar o outro, e nenhum arquivo de código precisa
mudar para religar: é só variável de ambiente.

Isso substitui a regra antiga de escolha por moeda (`lib/checkout/currency-guard.ts`),
que saiu junto com o Paddle e não existe mais.

### Mercado Pago — cobrança em reais

Atende quem tem CPF ou CNPJ. Oferece Pix, cartão de crédito, cartão de débito e saldo
Mercado Pago.

| variável | o que é | onde obter |
|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Credencial do servidor. **Secreta.** | Painel do MP → Suas integrações → a aplicação → Credenciais de produção |
| `MERCADOPAGO_WEBHOOK_SECRET` | Assinatura das notificações | Gerado ao cadastrar o webhook, no mesmo painel |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Sinal público de "provedor ligado". Sem ela o botão não aparece no checkout. | Mesma tela das credenciais |

URL do webhook a cadastrar no painel:

```
https://www.easyprospect.com.br/api/checkout/mercadopago/webhook
```

**Com `www` e sem barra no final.** O apex e a barra final devolvem 308, e o Mercado
Pago não segue redirecionamento — o teste do painel falha sem dizer por quê.

**Limite prático:** a tela do Mercado Pago exige CPF para pagamento com cartão. Quem não
tem CPF não conclui a compra, mesmo com cartão internacional. Confirmado em teste real —
o material de divulgação do MP diz o contrário. É por isso que o Stripe existe aqui.

### Stripe — cobrança na moeda do carrinho

Conta aberta em 25.08.2026. É a via internacional: cobra na moeda que o comprador vê no
carrinho, sem exigir CPF.

| variável | o que é | onde obter |
|---|---|---|
| `STRIPE_SECRET_KEY` | Credencial do servidor. **Secreta.** Sem ela a rota devolve 503. | Dashboard → Developers → API keys (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Assinatura dos eventos. Sem ela o webhook rejeita tudo com 401 — é fail-closed de propósito. | Gerado ao criar o endpoint (`whsec_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Sinal público de "provedor ligado". Sem ela o botão não aparece no checkout. | Mesma tela das API keys (`pk_live_...`) |

URL do webhook:

```
https://www.easyprospect.com.br/api/checkout/stripe/webhook
```

Mesma regra do `www` e da barra final. Ao criar o endpoint, assine **exatamente dois**
eventos, que são os únicos que o código trata:

- `checkout.session.completed`
- `checkout.session.expired`

**Test mode e live mode têm chaves E webhooks separados.** Webhook criado em test com
`sk_live_` cadastrada faz todo evento ser rejeitado por assinatura inválida, sem erro
visível na loja.

**Sobre moeda:** conta brasileira do Stripe *pode cobrar* (presentment) em EUR e USD; o
que é obrigatoriamente BRL é a *liquidação* (settlement). Cartão brasileiro é que precisa
processar em BRL. Não confundir os dois — a confusão já levou a supor que o Stripe não
serviria para o comprador internacional.

### PayPal — desligado

Continua no código e pode ser religado preenchendo as variáveis abaixo. Hoje estão vazias
porque a conta foi cancelada pelo provedor.

| variável | o que é |
|---|---|
| `PAYPAL_CLIENT_SECRET` | Credencial do servidor. **Secreta.** |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Sinal público de "provedor ligado" |
| `PAYPAL_MODE` | Só o valor exato `live` liga produção; qualquer outra coisa (inclusive vazio ou digitado errado) cai em `sandbox`. Cobrar de verdade tem que ser decisão explícita, nunca efeito de variável esquecida. |
| `PAYPAL_WEBHOOK_ID` | Identifica o webhook na verificação de assinatura, em `/api/checkout/webhook` |

### Paddle — removido

O Paddle saiu do código por inteiro (não há `lib/paddle.ts` nem rota
`/api/checkout/paddle/`). Ele reprovou `easyprospect.com.br` no domain review,
enquadrando o site em categorias proibidas da política dele. As variáveis `PADDLE_*` não
são lidas por nada e podem ser removidas da Vercel.

## Banco e autenticação

| variável | o que é |
|---|---|
| `DATABASE_URL` | Conexão do Prisma, via pooler do Supabase |
| `DIRECT_URL` | Conexão direta, usada pelas migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública, vai no bundle do navegador |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secreta.** Ignora RLS — nunca exponha no cliente |

Migrations são aplicadas **pelo deploy**: `vercel.json` tem
`prisma generate && prisma migrate deploy && next build`. Nunca aplique migração por SQL
cru — quebraria o registro em `_prisma_migrations` e o build seguinte falharia tentando
recriar o que já existe.

## E-mail

O e-mail transacional tem **dois caminhos, nesta ordem de precedência** (ver
`lib/email/system-smtp.ts`):

1. Se `SMTP_HOST`, `SMTP_USER` e `SMTP_PASS` estiverem preenchidas, usa SMTP genérico.
2. Senão, se `GMAIL_USER` e `GMAIL_APP_PASSWORD` estiverem preenchidas, usa Gmail.
3. Senão, não envia.

| variável | o que é |
|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Servidor de envio (Zoho: `smtp.zoho.com`, `587`, `false`) |
| `SMTP_USER`, `SMTP_PASS` | Credenciais da caixa. **`SMTP_PASS` é secreta.** |
| `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL` | Remetente exibido. Sem `SMTP_FROM_EMAIL`, cai para `SMTP_USER` |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Caminho alternativo. **`GMAIL_APP_PASSWORD` é secreta.** |
| `FAQ_CONTACT_EMAIL` | Destino das perguntas do FAQ |

`contato@easyprospect.com.br` é uma caixa **Zoho**, e a autenticação usa **senha de
aplicativo**, gerada no painel do provedor — não a senha de login. Atenção ao caminho 2:
autenticar no Gmail enviando com "De:" do domínio próprio funciona, mas é frágil em
entregabilidade (o SPF/DKIM do domínio não cobre o servidor do Google).

Isso vale para o e-mail transacional (confirmação de compra). O cold mail de cada
workspace usa credenciais próprias, guardadas criptografadas no banco e configuradas pela
UI em Configurações → E-mail, nunca por variável de ambiente.

### Vendedor no comprovante de compra

O comprovante de compra em PDF (anexado à confirmação e baixável em Minhas Compras)
identifica quem vendeu por estas variáveis. Sem `SELLER_NAME` **e** `SELLER_ADDRESS`,
o comprovante não é gerado: o botão some, o e-mail não anexa nada e a rota
`/api/purchases/[id]/receipt` responde 404. Estado visível em Super admin →
Configurações.

| variável | o que é |
|---|---|
| `SELLER_NAME` | Razão social exibida como vendedor. Sem ela, cairia em "Easy Prospect" |
| `SELLER_ADDRESS` | Endereço do vendedor. É o mínimo para o documento servir à contabilidade do comprador |
| `SELLER_TAX_ID` | Opcional. CNPJ/registro fiscal, se houver |
| `SELLER_EMAIL` | Opcional. Sem ela, cai para `SMTP_FROM_EMAIL` e depois `SMTP_USER` |

O comprovante **não é nota fiscal** e o próprio PDF diz isso; nenhum imposto é
calculado a partir dessas variáveis.

## Aplicação

| variável | o que é |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Base das URLs geradas no servidor. Em produção, **o domínio com `www`** |
| `CRON_SECRET` | **Secreta.** Autoriza as rotas de cron |
| `SECRETS_ENCRYPTION_KEY` | **Secreta.** Criptografa as credenciais SMTP dos workspaces no banco. Trocá-la torna ilegível tudo que já foi gravado. |
| `ENCRYPTION_KEY` | **Alias de fallback** de `SECRETS_ENCRYPTION_KEY`, lido só quando ela falta. Não é uma segunda chave — preencher as duas com valores diferentes é pedir para não conseguir decifrar o que foi gravado. |
| `SIGNING_SECRET` | **Secreta.** Assina URLs. Se faltar, cai para `SECRETS_ENCRYPTION_KEY` e depois para `ENCRYPTION_KEY`. |

## Observabilidade

| variável | o que é |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Destino dos eventos |
| `SENTRY_ORG`, `SENTRY_PROJECT` | Identificação do projeto, lidas em `next.config.ts` |
| `SENTRY_AUTH_TOKEN` | **Secreta.** Envia os source maps no build. Sem ela o build passa, mas as stack traces chegam minificadas. |

O Sentry está no plano gratuito, configurado sem tracing e sem session replay de
propósito, para não estourar a cota.

## Se uma credencial vazar

1. **Rotacione primeiro**, no painel do provedor. Remover do git não invalida uma chave
   que já foi lida.
2. Atualize no `.env.local` e na Vercel, e faça o redeploy.
3. Só então limpe o histórico, se ela chegou a ser commitada.
