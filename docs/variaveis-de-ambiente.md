# Variáveis de ambiente

Lista das variáveis que o Easy Prospect usa, o que cada uma faz e onde obter o valor.

**Este arquivo não contém valores.** Tudo que casa com `.env*` está no `.gitignore`
(linha 34) e nunca deve ser versionado — o repositório é público. Credencial vive em
dois lugares e só neles: no `.env.local` da sua máquina, e no painel da Vercel.

> **Variável nova só passa a valer no build seguinte.** Depois de cadastrar na Vercel,
> force um **Redeploy** — salvar não basta.

## Pagamento

O provedor é escolhido pela moeda do carrinho: `BRL` vai para o Mercado Pago, `EUR` e
`USD` vão para o Paddle. A regra está em `lib/checkout/currency-guard.ts` e é imposta
tanto na tela quanto nas rotas do servidor.

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

### Paddle — cobrança em euro e dólar

Atende o comprador internacional. O Paddle é *Merchant of Record*: ele é o vendedor
perante o comprador, aparece na fatura dele e recolhe o IVA.

| variável | o que é | onde obter |
|---|---|---|
| `PADDLE_API_KEY` | Credencial do servidor. **Secreta.** Nunca use prefixo `NEXT_PUBLIC_` nela. | Painel do Paddle → Developer tools → Authentication |
| `PADDLE_WEBHOOK_SECRET` | Assinatura das notificações | Gerado ao cadastrar a notification destination |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Token público, usado pelo Paddle.js no navegador | Painel do Paddle → Developer tools → Authentication |
| `NEXT_PUBLIC_PADDLE_ENV` | `sandbox` ou `production`. **O padrão é `sandbox`** | — |

O padrão ser `sandbox` é deliberado: cobrar de verdade tem que ser decisão explícita,
nunca o efeito de uma variável esquecida.

URL do webhook:

```
https://www.easyprospect.com.br/api/checkout/paddle/webhook
```

Mesma regra do `www` e da barra final.

**O sandbox do Paddle é uma conta separada**, com credenciais próprias que não se
convertem nas de produção. Credencial de sandbox nunca vai para a Vercel de produção —
o site no ar passaria a abrir um checkout de mentira.

### Stripe e PayPal — desligados

Continuam no código e podem ser religados preenchendo as variáveis correspondentes
(`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
`PAYPAL_CLIENT_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_MODE`). Hoje estão
vazios de propósito: a conta do Stripe tem pendências e a do PayPal foi cancelada.

Os textos legais não os citam mais — citar processador que não processa nada é
informação incorreta ao titular dos dados.

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

| variável | o que é |
|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Servidor de envio (`smtp.zoho.com`, `587`, `false`) |
| `SMTP_USER`, `SMTP_PASS` | Credenciais da caixa. **`SMTP_PASS` é secreta.** |
| `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL` | Remetente exibido |
| `FAQ_CONTACT_EMAIL` | Destino das perguntas do FAQ |

`contato@easyprospect.com.br` é uma caixa Zoho, e a autenticação usa **senha de
aplicativo**, gerada no painel do Zoho — não a senha de login.

Isso vale para o e-mail transacional (confirmação de compra). O cold mail de cada
workspace usa credenciais próprias, guardadas criptografadas no banco e configuradas
pela UI em Configurações → E-mail, nunca por variável de ambiente.

## Aplicação

| variável | o que é |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Base das URLs geradas no servidor. Em produção, **o domínio com `www`** |
| `NEXT_PUBLIC_APP_NAME` | Nome exibido |
| `TRACKING_URL` | Base dos links rastreados do cold mail |
| `CRON_SECRET` | **Secreta.** Autoriza as rotas de cron |
| `SECRETS_ENCRYPTION_KEY` | **Secreta.** Criptografa as credenciais SMTP dos workspaces no banco. Trocá-la torna ilegível tudo que já foi gravado. |

## Observabilidade

| variável | o que é |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Destino dos eventos |
| `SENTRY_ORG`, `SENTRY_PROJECT` | Identificação do projeto |
| `SENTRY_AUTH_TOKEN` | **Secreta.** Envia os source maps no build. Sem ela o build passa, mas as stack traces chegam minificadas. |

O Sentry está no plano gratuito, configurado sem tracing e sem session replay de
propósito, para não estourar a cota.

## Se uma credencial vazar

1. **Rotacione primeiro**, no painel do provedor. Remover do git não invalida uma chave
   que já foi lida.
2. Atualize no `.env.local` e na Vercel, e faça o redeploy.
3. Só então limpe o histórico, se ela chegou a ser commitada.
