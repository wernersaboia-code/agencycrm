# Amostra gratuita na home

Data: 2026-08-04
Estado: aprovado, aguardando plano de implementação

## Problema

Não há como o visitante ver o produto antes de pagar. A home descreve o que
vem num estudo, a página do estudo mostra a prévia de alguns campos, mas nada
disso responde à pergunta que trava a compra: *os dados prestam mesmo?*

Um estudo custa €45. É pouco para a empresa e muito para quem nunca ouviu falar
da marca. A amostra existe para transferir essa dúvida do cliente para o
produto: em vez de acreditar, ele confere.

## Decisões tomadas

Cada uma tem alternativa que foi considerada e recusada.

| Decisão | Escolhido | Por quê |
|---|---|---|
| Atrito | E-mail + consentimento, sem conta | Contato qualificado sem o abandono que o cadastro provoca antes de provar valor |
| Conteúdo | Arquivo fixo, subido pelo admin | Controle total sobre o que sai; recorte gerado do banco foi recusado por ora |
| Formato | PDF | Mesmo formato do estudo que ele vai comprar |
| Entrega | Download na hora + cópia por e-mail | Não depende do envio de e-mail funcionar |
| Uso do e-mail | Guardado no super-admin, sem disparo | Finalidade única, sem promessa que ainda não se pode cumprir |
| Posição na home | Depois de "O que você recebe" | Onde o visitante acabou de ler o que vem no estudo |
| Visibilidade | Só existe se houver arquivo ativo | Sem flag, sem deploy para ligar |

## Modelo de dados

```prisma
model FreeSample {
  id        String   @id @default(cuid())
  filePath  String   // caminho no bucket privado
  fileName  String   // nome original, exibido no admin
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("free_samples")
}

model FreeSampleDownload {
  id             String   @id @default(cuid())
  email          String
  consent        Boolean
  locale         String
  token          String   @unique
  tokenExpiresAt DateTime
  ip             String?
  userAgent      String?
  createdAt      DateTime @default(now())

  @@index([email])
  @@index([ip, createdAt])
  @@map("free_sample_downloads")
}
```

`FreeSampleDownload` copia deliberadamente a forma do `FaqSubmission`,
inclusive o índice `[ip, createdAt]` de que o rate limit persistente depende.

**Os textos da seção não entram no banco.** Título, subtítulo, rótulo do campo
e texto do botão vivem em `messages/<locale>.json`, nos sete idiomas, como todo
o resto do site. O banco guarda o arquivo e o interruptor, nada mais. Assim o
teste de paridade de mensagens cobre as traduções, e trocar o arquivo não obriga
a reescrever texto em sete lugares.

## Fluxo do visitante

1. Preenche e-mail e marca o consentimento (com link para a Política de
   Privacidade).
2. Server action valida com zod, aplica rate limit por IP e grava a linha com
   um token de validade longa.
3. A resposta traz uma URL assinada do bucket (120 s) e o download começa.
4. O e-mail com a cópia é disparado **sem bloquear a resposta**.

### Por que o e-mail não leva a URL assinada

A URL assinada do bucket vale 120 segundos. Serve para o download imediato e
não serve para o e-mail, que pode ser aberto no dia seguinte — o link chegaria
morto. O e-mail leva `/free-sample/<token>`, que valida o token, gera uma URL
assinada nova e redireciona. É o mesmo desenho do `PurchaseAccessToken`.

## Fluxo do admin

Página nova em `/super-admin/marketplace/free-sample`:

- sobe o PDF (validação e bucket reusando `lib/supabase/list-studies.ts`)
- vê qual arquivo está no ar
- liga e desliga a seção
- vê quem baixou, com exportação em CSV

Idiomas do painel: pt, en e de — os únicos com bloco `admin` em `messages/`.

## Visibilidade

O componente consulta o `FreeSample` ativo. Não havendo nenhum, retorna `null`
e a home fica idêntica ao que é hoje. Mesma regra do `visibleFacets` no catálogo
e do gate `canPublishList`.

**Cache obrigatório.** Isso põe uma consulta ao banco na página mais visitada do
site, que já teve problema de renderização dinâmica. A consulta vai envolvida em
cache com tag, invalidada quando o admin liga ou desliga — a home não paga ida
ao banco por visita.

## Privacidade

Consentimento explícito, finalidade única: receber o arquivo. Sem disparo
automático, sem entrada no CRM. Rate limit por IP no formulário. No painel dá
para exportar e apagar.

## Riscos assumidos

**O e-mail pode não chegar.** O `.env` autentica no Gmail enquanto o `contato@`
é Zoho. Por isso o download é imediato e o e-mail é cópia: se o envio quebrar,
o visitante já tem o arquivo e o contato já está gravado. A falha vai para o
Sentry em vez de morrer calada.

**A página do super-admin exige sessão**, o que a põe fora do alcance de
verificação por navegador em execuções sem login. As regras — validação,
gate de visibilidade, expiração do token, rate limit — ficam em módulos
próprios com teste, como em `lib/admin/filtro-listas.ts`.

## Testes

- schema de validação: e-mail inválido, consentimento ausente, locale fora da lista
- gate de visibilidade: sem `FreeSample`, com um inativo, com um ativo
- token: válido, expirado, inexistente
- rate limit: dentro e fora da janela

## Fora de escopo

- Recorte de lista real gerado do banco (foi considerado e adiado)
- Escolha de país/setor pelo visitante
- Qualquer envio de marketing para quem baixou
