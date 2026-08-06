# Cadastro e e-mails transacionais nos 7 idiomas — Design

**Data:** 2026-08-06
**Branch:** `feat/cadastro-e-emails-i18n`, criada a partir da `main`
**Origem:** três frentes abertas no ledger (`.superpowers/sdd/progress.md`), seção
"ABERTO: outros achados do Werner"

## O problema

Três achados independentes, com uma causa comum mais funda: **o idioma que a pessoa
escolhe no cadastro não é guardado em lugar nenhum**, então nenhum e-mail nosso tem como
saber em que língua falar.

1. **O e-mail de confirmação de cadastro chega sempre em inglês.** Ele não é nosso: quem
   envia é o Supabase, a partir do template do painel, que é único e monolíngue. O texto no
   ar é o de fábrica, quatro linhas, nunca tocado.
2. **O e-mail de confirmação de compra chega sempre em português.** Esse é nosso, e tem
   `toLocaleDateString("pt-BR")` e textos fixos em
   `lib/email/templates/purchase-confirmation.ts`.
3. **A tela de cadastro diz "Criar conta no CRM"**, e o CRM foi desabilitado para uso
   externo. A tela de login já fechou essa porta (`sign-in-form.tsx:45`, área `crm` com
   `visivel: false`); o cadastro ficou para trás.
4. **A senha não tem exigência nenhuma** além do mínimo de fábrica do Supabase.

A Alemanha é o mercado principal. Um comprador alemão paga em euro, recebe o recibo do
Paddle, e as duas únicas mensagens nossas que ele lê chegam em inglês de fábrica e em
português.

## Decisões

### O idioma mora em `User.language`

A coluna já existe (`prisma/schema.prisma:155`). Falta fazê-la valer.

**O valor está no formato errado.** O padrão é `"pt-BR"`, mas os locales do projeto são
`"pt"`, `"de"`, `"en"`… Isso já tem efeito hoje: `lib/i18n/admin-locale.ts:30` chama
`resolveMessagesLocale(dbUser.language as Locale)` e `"pt-BR"` não passa no `isLocale`,
caindo no padrão. Funciona por acidente, porque o padrão *é* português — no dia em que
alguém tivesse `"de-DE"` ali, o painel voltaria para português sem explicação. Migration
normaliza `"pt-BR"` → `"pt"` e troca o default da coluna para `"pt"`.

**Quem escreve:** o cadastro, uma vez, com o locale da tela. É o único momento em que a
pessoa declarou um idioma de propósito.

**Quem lê:** uma função única que devolve um `Locale` válido, tolerando lixo e caindo em
`pt`. Todo e-mail passa por ela.

**Fora de escopo, de propósito:** seletor de idioma no perfil. Quem se cadastrou antes fica
com `pt`. A base é pequena e o lançamento é o que importa.

### O cadastro passa a ser nosso (`POST /api/auth/sign-up`)

Hoje o formulário chama `supabase.auth.signUp()` do navegador, e o Supabase envia o e-mail.
Passa a chamar uma rota nossa, que:

1. valida com zod — nome, e-mail, senha e locale;
2. aplica `checkPersistentRateLimit`, o mesmo mecanismo do checkout;
3. cria o usuário **sem enviar nada**, via `generateLink` do cliente admin
   (`lib/supabase/admin.ts`), com `name`, `source` e `locale` no metadata, recebendo de
   volta um `token_hash`;
4. envia o e-mail pelo nosso SMTP, no idioma da tela.

**Por que assumir o envio, e não usar o Send Email Hook do Supabase:** o hook seria mais
enxuto — o `signUp` continuaria sendo o do Supabase, com o antiabuso dele. Mas a
organização está no **plano free** e o item aparece no painel com selo **BETA**, sem
confirmação de que o Send Email Hook está liberado. Apostar o desenho nele é apostar num
tijolo que pode não estar lá. A alternativa de ramificar o template do painel por
`{{ .Data }}` é tecnicamente viável (a variável existe), mas produz um template com sete
ramos, editado no painel, fora do git, e que teria de ser repetido em cada e-mail de auth.

Assumir o envio também escapa do limite de envio do SMTP embutido do Supabase no plano
free, que é dimensionado para teste e não para um dia de lançamento.

**O custo, explícito:** rate limit e antiabuso do cadastro passam a ser nossos.

### O link de confirmação vai para `/auth/confirm`

`generateLink` devolve um `token_hash`, não o `code` do fluxo PKCE. A rota nova troca o
`token_hash` por sessão (`verifyOtp`) e redireciona.

`app/(app)/auth/callback/route.ts` **continua intacta**: ela trata o `code`, que é outro
parâmetro e serve outros caminhos — recuperação de senha, que segue com o Supabase por ora.

### O locale viaja no metadata, não numa coluna nova

Ele vai no `user_metadata` do Supabase e só é copiado para `User.language` quando a linha do
Prisma nasce, no primeiro acesso confirmado — onde `getAuthenticatedDbUser` já cria o
usuário. Criar linha no nosso banco para um e-mail ainda não confirmado seria pior.

O e-mail de cadastro em si não lê `User.language` (a linha ainda não existe): ele usa o
locale da requisição, que é o mesmo valor sendo gravado.

### E-mail já cadastrado não pode vazar

Hoje o `signUp` do Supabase não conta se um e-mail já existe. A rota nossa mantém esse
silêncio: **resposta idêntica nos dois casos**. Quando o e-mail já existe, sai um e-mail
diferente — "você já tem conta, entre por aqui / recupere a senha". Custa um template
pequeno e é o padrão do ramo; a alternativa (responder igual e não enviar nada) não vaza,
mas deixa no escuro quem esqueceu que já tinha conta.

### Os três e-mails compartilham casca e traduções

Namespace `emails` nos 7 arquivos de `messages/`, com `emails.signup`,
`emails.accountExists` e `emails.purchase`. Os 7 arquivos já existem e compartilham os
mesmos namespaces de topo.

**A casca sai de dentro do template de compra.** Cabeçalho com logo, card e rodapé estão
embutidos nas 167 linhas de `purchase-confirmation.ts`. Viram `lib/email/templates/layout.ts`,
que recebe título, corpo e locale. Os três e-mails passam a ter a mesma cara, e logo e cor
mudam num lugar só. É reorganização de código existente, não feature — e fica mais cara se
esperar existirem três cópias da casca.

**A formatação por idioma já tem a peça pronta:** `htmlLangFor(locale)` devolve o BCP 47
(`"de"` → `"de-DE"`), que é o que `Intl.NumberFormat` e `toLocaleDateString` exigem. €5,00
sai `5,00 €` em alemão e `€ 5,00` em português, sem tabela nova.

**Cada template é função pura:** recebe dados + locale, devolve `{ subject, html }`. Sem
banco, sem rede.

**Fora de escopo:** recuperação de senha e troca de e-mail seguem com o template do
Supabase, em inglês. Entram na mesma estrutura depois — não vale abrir três frentes de auth
com o merge do Paddle pendente.

### A tela de cadastro perde a variante do CRM

`isMarketplace` sai do componente inteiro (15 ocorrências), junto das chaves `crmTitle`,
`crmSubtitle`, `submitCrm`, `step2Crm` e `ctaCrm` nos 7 idiomas. `source` passa a ser sempre
`"marketplace"` e o destino sempre `/my-purchases`. Some a única forma de um visitante
externo ver "Criar conta no CRM".

Pressuposto: conta de equipe do CRM é criada por outro caminho (admin).

### Senha: mínimo 8, letras e números, em três camadas

- **Na tela**, com mensagem traduzida nos 7 idiomas, antes de enviar — é o que a pessoa lê.
- **Na rota**, o mesmo zod. É a camada que vale, porque a tela é burlável.
- **No painel do Supabase**, mínimo 8 e "Letters and digits", como rede de fundo. Por ser
  configuração manual, entra em `docs/variaveis-de-ambiente.md` junto do resto que não vive
  no git.

A regra corta senha trivial sem somar atrito a um marketplace de compra única, onde atrito
no cadastro custa venda.

## Dependência: o conserto do P2002 não está na `main`

`d6fbd73` ("primeiro acesso do cliente novo quebrava com erro critico") vive só na branch do
Paddle. Ele conserta a corrida em `getAuthenticatedDbUser` — **a mesma função onde este
desenho copia o locale para `User.language`**.

O commit toca um arquivo só (`lib/auth.ts`), não tem relação com pagamento, e o bug atinge
todo cliente novo em produção hoje. **Primeiro passo desta branch: cherry-pick de `d6fbd73`.**
Construir em cima da versão com a corrida seria construir sobre um bug conhecido, e prender
esse conserto à aprovação do Paddle é prender um defeito de produção a uma data que não está
na nossa mão.

## Testes

Nenhum teste toca banco ou rede — regra da casa.

- **Paridade de chaves** no molde de `lib/i18n/messages-auth.test.ts`: todo locale tem toda
  chave de `emails`. É o teste que pega a tradução esquecida, o modo mais provável de isso
  quebrar.
- **Por template:** o assunto sai no idioma pedido; data e valor saem no formato do locale;
  o link de confirmação aparece no HTML.
- **Validação de senha:** função pura de zod, casos de borda direto.
- **Rota de cadastro:** cliente admin e envio injetados, no molde de
  `lib/checkout/fulfillment.test.ts`. Casos que importam: e-mail já existente responde
  igual ao caso novo; falha do `generateLink` não deixa estado pela metade; rate limit
  responde 429.

## Critério de sucesso

Um comprador alemão se cadastra em alemão, recebe o e-mail de confirmação em alemão,
compra, e recebe a confirmação de compra em alemão com data e valor no formato alemão. A
tela de cadastro nunca menciona CRM. Senha `12345678` é recusada com mensagem em alemão.
