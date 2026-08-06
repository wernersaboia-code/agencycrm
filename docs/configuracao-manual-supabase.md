# Configuração manual no painel do Supabase

Estas configurações **não vivem no git**. Um projeto Supabase novo nasce sem elas, e nada
no código avisa quando faltam — por isso a lista existe. Confira depois de qualquer troca
de projeto ou restauração de backup.

## Authentication → Sign In / Providers → Password

- **Minimum password length: 8**
- **Password Requirements: "Letters and digits"**

É a rede de fundo da regra que `lib/auth/password-policy.ts` aplica na tela e dentro de
`registrarUsuario`. As duas primeiras camadas são nossas e são as que produzem mensagem
traduzida; esta terceira é a que continua valendo se alguém chamar a API do Supabase por
fora do nosso cadastro.

## Authentication → Emails → Email OTP Expiration

- **86400** (segundos, 24 horas)

O texto `emails.signup.expires`, nos 7 idiomas, promete que o link de confirmação de
cadastro vale 24 horas. Essa promessa não é garantida pelo código: quem controla o prazo
real do `token_hash` é este campo do painel, e o default do Supabase é 1 hora. Sem ajustar
aqui, o e-mail mente.

## Authentication → URL Configuration

A **Site URL** precisa ser o domínio com `www`, que é o canônico. O apex responde 308, e um
redirecionamento no meio do caminho quebra o link de confirmação de cadastro.

## Authentication → Emails (templates)

O template **"Confirm sign up" deixou de ser usado.** Quem manda a confirmação de cadastro
é `POST /api/auth/sign-up`, pelo nosso SMTP, com template versionado em
`lib/email/templates/signup-confirmation.ts` e textos nos 7 idiomas em `messages/*.json`
(namespace `emails`).

Os demais templates — recuperação de senha e troca de e-mail — **seguem sendo do painel, em
inglês**, até entrarem na mesma estrutura. É dívida conhecida, registrada na spec
`docs/superpowers/specs/2026-08-06-cadastro-e-emails-i18n-design.md`.

## SMTP

O envio dos nossos e-mails transacionais usa as variáveis `SMTP_*` (ou `GMAIL_*`) da
aplicação, lidas em `lib/email/system-smtp.ts` — não o SMTP configurado no painel do
Supabase. Sem nenhuma delas, `POST /api/auth/sign-up` responde 503 e ninguém consegue se
cadastrar.
